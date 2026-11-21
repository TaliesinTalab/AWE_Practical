import { describe, expect, it } from "vitest";
import { colonyReducer, initialColony, type ColonyAction } from "./colonyReducer";
import type { ExpeditionResult } from "../types";

const result: ExpeditionResult = {
  expeditionId: "exp-17",
  status: "completed",
  rewards: { stone: 8, tools: 1 },
  message: "Found a seam.",
};
const depart: ColonyAction = { type: "startExpedition", personId: "dwarf-3", destination: "crystal-cave" };
const succeed: ColonyAction = { type: "completeExpedition", personId: "dwarf-3", result };

const person3 = (state: typeof initialColony) => state.people.find((person) => person.id === "dwarf-3");

describe("colony reducer", () => {
  it("does not forge without enough stone", () => {
    const poor = { ...initialColony, resources: { ...initialColony.resources, stone: 1 } };
    const next = colonyReducer(poor, { type: "forgeTool" });
    expect(next.resources).toEqual(poor.resources);
    expect(next.activities[0].tone).toBe("warning");
  });

  it("forges a tool from 3 wood and 2 stone", () => {
    const next = colonyReducer(initialColony, { type: "forgeTool" });
    expect(next.resources).toMatchObject({ wood: 11, stone: 7, tools: 2 });
  });

  it("sends an available person only once", () => {
    const away = colonyReducer(initialColony, depart);
    expect(person3(away)?.task).toEqual({ kind: "expedition", destination: "crystal-cave" });
    expect(colonyReducer(away, depart)).toBe(away);
  });

  it("does not reassign a person who is away", () => {
    const away = colonyReducer(initialColony, depart);
    expect(colonyReducer(away, { type: "assignJob", personId: "dwarf-3", job: "mining" })).toBe(away);
  });

  it("applies expedition rewards exactly once", () => {
    const home = colonyReducer(colonyReducer(initialColony, depart), succeed);
    expect(home.resources).toMatchObject({ stone: 17, tools: 2 });
    expect(person3(home)?.task).toBeNull();
    expect(colonyReducer(home, succeed)).toBe(home);
  });

  it("returns the person without rewards when the expedition fails", () => {
    const away = colonyReducer(initialColony, depart);
    const home = colonyReducer(away, { type: "failExpedition", personId: "dwarf-3", message: "Rockfall." });
    expect(person3(home)?.task).toBeNull();
    expect(home.resources).toEqual(initialColony.resources);
    expect(home.activities[0]).toMatchObject({ message: "Rockfall.", tone: "warning" });
  });

  it("keeps the chronicle at 6 entries with unique ids", () => {
    let state = initialColony;
    for (let i = 0; i < 10; i++) state = colonyReducer(state, { type: "forgeTool" });
    expect(state.activities).toHaveLength(6);
    expect(new Set(state.activities.map((activity) => activity.id)).size).toBe(6);
  });

  it("does not mutate the previous state and is deterministic", () => {
    const before = structuredClone(initialColony);
    expect(colonyReducer(initialColony, depart)).toEqual(colonyReducer(initialColony, depart));
    expect(initialColony).toEqual(before);
  });
});
