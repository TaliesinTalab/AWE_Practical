import { describe, expect, it } from "vitest";
import { completeExpedition, failExpedition } from "./expeditions";
import { resolveRaid } from "./raid";
import { colonyReducer } from "../state/colonyReducer";
import { parseSave, serialise } from "../state/persistence";
import type { ColonyState, ExpeditionResult, Resources } from "../types";

const stores = (change: Partial<Resources> = {}): Resources => ({
  wood: 9,
  stone: 4,
  food: 21,
  tools: 2,
  weapons: 0,
  panFlutes: 1,
  ...change,
});

const backFromBandits = (resources: Resources = stores()): ColonyState => ({
  day: 5,
  resources,
  people: [
    {
      id: "d1",
      name: "d1",
      title: "",
      icon: "",
      assignment: null,
      species: "dwarf",
      equipment: null,
      task: { kind: "expedition", destination: "bandit-hold", returnOnDay: 5 },
    },
  ],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
});

const blades: ExpeditionResult = {
  expeditionId: "exp-1",
  status: "completed",
  rewards: { weapons: 4 },
  message: "Four blades.",
};

describe("raid", () => {
  it("is announced for the next day after a successful trip to the Bandit Hold", () => {
    const home = completeExpedition(backFromBandits(), "d1", blades);
    expect(home.resources.weapons).toBe(4);
    expect(home.raidOnDay).toBe(6);
    expect(home.lastRaid).toBeNull();
    expect(home.resources).toMatchObject({ wood: 9, stone: 4, food: 21 });
  });

  it("is not announced after a failed request", () => {
    const home = failExpedition(backFromBandits(), "d1", "Lost.");
    expect(home.raidOnDay).toBeUndefined();
    expect(resolveRaid({ ...home, day: 6 }).lastRaid).toBeNull();
  });

  it("does nothing before its day", () => {
    const home = completeExpedition(backFromBandits(), "d1", blades);
    expect(resolveRaid(home)).toBe(home);
  });

  it("loots half of wood, stone and food, rounded down, below 5 weapons", () => {
    const home = completeExpedition(backFromBandits(), "d1", blades);
    const raided = resolveRaid({ ...home, day: 6 });
    expect(raided.resources).toEqual(stores({ wood: 5, stone: 2, food: 11, weapons: 4 }));
    expect(raided.lastRaid).toEqual({ day: 6, defended: false, looted: { wood: 4, stone: 2, food: 10 } });
    expect(raided.raidOnDay).toBeUndefined();
    expect(raided.activities[0].tone).toBe("warning");
    expect(resolveRaid(raided)).toBe(raided);
  });

  it("defends with 5 weapons and keeps them", () => {
    const home = completeExpedition(backFromBandits(stores({ weapons: 1 })), "d1", blades);
    const defended = resolveRaid({ ...home, day: 6 });
    expect(defended.resources).toEqual(stores({ weapons: 5 }));
    expect(defended.lastRaid).toEqual({ day: 6, defended: true, looted: {} });
    expect(defended.activities[0].tone).toBe("good");
  });

  it("strikes at the end of the next day tick, after production and meals", () => {
    const home = completeExpedition(backFromBandits(), "d1", blades);
    const nextDay = colonyReducer(home, { type: "advanceDay" });
    expect(nextDay.day).toBe(6);
    expect(nextDay.resources.food).toBe(10);
    expect(nextDay.lastRaid?.looted).toEqual({ wood: 4, stone: 2, food: 10 });
  });

  it("gives the same result for the same state and survives a save", () => {
    const home = completeExpedition(backFromBandits(), "d1", blades);
    expect(resolveRaid({ ...home, day: 6 })).toEqual(resolveRaid({ ...home, day: 6 }));
    expect(parseSave(serialise(home))?.raidOnDay).toBe(6);
    expect(parseSave(serialise({ ...home, raidOnDay: -1 }))).toBeNull();
  });
});
