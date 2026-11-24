import { describe, expect, it } from "vitest";
import { craftBlocker } from "./crafting";
import { equipItem } from "./equipment";
import { completeExpedition, expeditionBlocker, failExpedition } from "./expeditions";
import { carveBlocker, MARSYAS, startCarving, welcomeNewcomer } from "./newcomer";
import { dailyProduction, mealsNeeded } from "../simulation";
import { colonyReducer } from "../state/colonyReducer";
import type { ColonyState, ExpeditionResult, Person } from "../types";

const dwarf = (id: string, change: Partial<Person> = {}): Person => ({
  id,
  name: id,
  title: "",
  icon: "",
  assignment: null,
  species: "dwarf",
  equipment: null,
  task: null,
  ...change,
});

const makeState = (overrides: Partial<ColonyState> = {}): ColonyState => ({
  day: 5,
  resources: { wood: 0, stone: 0, food: 10, tools: 0, weapons: 0, panFlutes: 0 },
  people: [dwarf("d1")],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

const backFrom = (destination: string): ColonyState =>
  makeState({ people: [dwarf("d1", { task: { kind: "expedition", destination, returnOnDay: 5 } })] });

const found: ExpeditionResult = {
  expeditionId: "exp-1",
  status: "completed",
  rewards: { weapons: 1, food: 2 },
  message: "Back from the dungeon.",
};

describe("newcomer", () => {
  it("joins after a successful expedition to the Ominous Dungeon", () => {
    const home = completeExpedition(backFrom("ominous-dungeon"), "d1", found);
    expect(home.newcomerJoined).toBe(true);
    expect(home.people.map((person) => person.id)).toEqual(["d1", "satyr-1"]);
    expect(home.resources).toMatchObject({ weapons: 1, food: 12 });
    expect(home.activities[0].message).toContain("Marsyas");
  });

  it("joins only once", () => {
    const first = completeExpedition(backFrom("ominous-dungeon"), "d1", found);
    const again = { ...first, people: [backFrom("ominous-dungeon").people[0], first.people[1]] };
    const second = completeExpedition(again, "d1", found);
    expect(second.people).toHaveLength(2);
    expect(welcomeNewcomer(second)).toBe(second);
  });

  it("does not join after a failed expedition or another destination", () => {
    expect(failExpedition(backFrom("ominous-dungeon"), "d1", "Lost.").people).toHaveLength(1);
    expect(completeExpedition(backFrom("crystal-cave"), "d1", found).newcomerJoined).toBe(false);
  });

  it("farms double, cuts one log less than a dwarf and eats like everyone", () => {
    const farming = makeState({ people: [dwarf("d1"), { ...MARSYAS, assignment: "farming" }] });
    const cutting = makeState({ people: [dwarf("d1"), { ...MARSYAS, assignment: "woodcutting" }] });
    expect(dailyProduction(farming).food).toBe(8);
    expect(dailyProduction(cutting).wood).toBe(2);
    expect(mealsNeeded(farming)).toBe(2);
  });

  it("cannot be assigned to mining", () => {
    const state = makeState({ people: [dwarf("d1"), MARSYAS] });
    expect(colonyReducer(state, { type: "assignJob", personId: "satyr-1", job: "mining" })).toBe(state);
    expect(colonyReducer(state, { type: "assignJob", personId: "satyr-1", job: "farming" }).people[1].assignment).toBe("farming");
    expect(colonyReducer(state, { type: "assignJob", personId: "d1", job: "mining" }).people[0].assignment).toBe("mining");
  });
});

describe("pan flute", () => {
  const withSatyr = (overrides: Partial<ColonyState> = {}): ColonyState =>
    makeState({
      resources: { wood: 10, stone: 10, food: 10, tools: 1, weapons: 0, panFlutes: 1 },
      people: [dwarf("d1", { assignment: "woodcutting" }), MARSYAS],
      ...overrides,
    });

  it("is carved by the satyr in two days without occupying the forge", () => {
    const carving = startCarving(withSatyr());
    expect(carving.resources.wood).toBe(6);
    expect(carving.people[1].task).toEqual({ kind: "carving", doneOnDay: 7 });
    expect(craftBlocker(carving, "d1", "tool")).toBeNull();
    expect(expeditionBlocker(carving, "satyr-1", "crystal-cave")).toBe("Choose someone who is free.");

    const nextDay = colonyReducer(carving, { type: "advanceDay" });
    expect(nextDay.resources.panFlutes).toBe(1);
    const done = colonyReducer(nextDay, { type: "advanceDay" });
    expect(done.resources.panFlutes).toBe(2);
    expect(done.people[1].task).toBeNull();
  });

  it("is not carved without a satyr, without timber, while hungry or while he is busy", () => {
    const noSatyr = makeState({ resources: { wood: 10, stone: 0, food: 10, tools: 0, weapons: 0, panFlutes: 0 } });
    const noWood = withSatyr({ resources: { wood: 3, stone: 0, food: 10, tools: 0, weapons: 0, panFlutes: 0 } });
    const hungry = withSatyr({ hungry: true });
    const busy = startCarving(withSatyr());
    for (const state of [noSatyr, noWood, hungry, busy]) {
      expect(carveBlocker(state)).not.toBeNull();
      expect(startCarving(state)).toBe(state);
    }
  });

  it("keeps the satyr away from the forge and from tools", () => {
    const state = withSatyr();
    expect(craftBlocker(state, "satyr-1", "tool")).toContain("does not work the forge");
    expect(colonyReducer(state, { type: "startCraft", personId: "satyr-1", item: "weapon" })).toBe(state);
    expect(equipItem(state, "satyr-1", "tool")).toBe(state);
  });

  it("is equipped from the stores, one item per person", () => {
    const equipped = equipItem(withSatyr(), "d1", "panFlute");
    expect(equipped.resources.panFlutes).toBe(0);
    expect(equipped.people[0].equipment).toBe("panFlute");
    expect(equipItem(equipped, "d1", "tool")).toBe(equipped);
    expect(equipItem(equipped, "satyr-1", "panFlute")).toBe(equipped);
  });

  it("gives a woodcutting dwarf 3 more wood and any farmer 3 more food", () => {
    const flute = { equipment: "panFlute" } as const;
    const produce = (people: Person[]) => dailyProduction(makeState({ people }));
    expect(produce([dwarf("d1", { assignment: "woodcutting", ...flute })]).wood).toBe(6);
    expect(produce([dwarf("d1", { assignment: "farming", ...flute })]).food).toBe(7);
    expect(produce([dwarf("d1", { assignment: "mining", ...flute })])).toMatchObject({ stone: 2, wood: 0, food: 0 });
    expect(produce([{ ...MARSYAS, assignment: "farming", ...flute }]).food).toBe(11);
    expect(produce([{ ...MARSYAS, assignment: "woodcutting", ...flute }]).wood).toBe(2);
  });
});
