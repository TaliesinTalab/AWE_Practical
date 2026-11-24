import { describe, expect, it } from "vitest";
import { colonyReducer, initialColony } from "./colonyReducer";
import { parseSave, restoreColony, SAVE_VERSION, serialise } from "./persistence";

const withState = (change: object): string =>
  JSON.stringify({ version: SAVE_VERSION, state: { ...initialColony, ...change } });

describe("persistence", () => {
  it("restores exactly the state that was saved", () => {
    expect(parseSave(serialise(initialColony))).toEqual(initialColony);
  });

  it("keeps a forge task and a journey that were under way", () => {
    const forging = colonyReducer(initialColony, { type: "startCraft", personId: "dwarf-1", item: "tool" });
    const busy = colonyReducer(forging, { type: "startExpedition", personId: "dwarf-3", destination: "old-mine" });
    const restored = parseSave(serialise(busy));
    expect(restored).toEqual(busy);
    expect(restored?.people[0].task).toEqual({ kind: "forge", item: "tool", doneOnDay: 13 });
    expect(restored?.people[2].task).toEqual({ kind: "expedition", destination: "old-mine", returnOnDay: 14 });
  });

  it("keeps a carving task", () => {
    const [first, ...rest] = initialColony.people;
    const carving = { ...initialColony, people: [{ ...first, task: { kind: "carving" as const, doneOnDay: 14 } }, ...rest] };
    expect(parseSave(serialise(carving))).toEqual(carving);
  });

  it("rejects text that is not JSON", () => {
    expect(parseSave("{not json")).toBeNull();
    expect(parseSave("")).toBeNull();
  });

  it("rejects a missing or different version", () => {
    expect(parseSave(JSON.stringify({ state: initialColony }))).toBeNull();
    expect(parseSave(JSON.stringify({ version: SAVE_VERSION + 1, state: initialColony }))).toBeNull();
  });

  it("rejects a missing field", () => {
    expect(parseSave(JSON.stringify({ version: SAVE_VERSION, state: { day: 3 } }))).toBeNull();
    expect(parseSave(withState({ hungry: undefined }))).toBeNull();
  });

  it("rejects resources that are negative, fractional or not numbers", () => {
    expect(parseSave(withState({ resources: { ...initialColony.resources, food: -1 } }))).toBeNull();
    expect(parseSave(withState({ resources: { ...initialColony.resources, wood: 2.5 } }))).toBeNull();
    expect(parseSave(withState({ resources: { ...initialColony.resources, stone: "9" } }))).toBeNull();
  });

  it("rejects a person with an unknown job, species or equipment", () => {
    const [first, ...rest] = initialColony.people;
    expect(parseSave(withState({ people: [{ ...first, assignment: "brewing" }, ...rest] }))).toBeNull();
    expect(parseSave(withState({ people: [{ ...first, species: "elf" }, ...rest] }))).toBeNull();
    expect(parseSave(withState({ people: [{ ...first, equipment: "sword" }, ...rest] }))).toBeNull();
  });

  it("rejects a task the hold could never finish", () => {
    const [first, ...rest] = initialColony.people;
    const lost = { kind: "expedition", destination: "nowhere", returnOnDay: 13 };
    const unknown = { kind: "forge", item: "crown", doneOnDay: 13 };
    expect(parseSave(withState({ people: [{ ...first, task: lost }, ...rest] }))).toBeNull();
    expect(parseSave(withState({ people: [{ ...first, task: unknown }, ...rest] }))).toBeNull();
  });

  it("starts the given colony unchanged when nothing was saved", () => {
    expect(restoreColony(null, initialColony)).toBe(initialColony);
  });

  it("restores a save and says that tasks continue", () => {
    const forging = colonyReducer(initialColony, { type: "startCraft", personId: "dwarf-1", item: "tool" });
    const restored = restoreColony(serialise(forging), initialColony);
    expect(restored.people).toEqual(forging.people);
    expect(restored.resources).toEqual(forging.resources);
    expect(restored.activities[0].message).toContain("Tasks under way continue");
    expect(colonyReducer(restored, { type: "advanceDay" }).resources.tools).toBe(forging.resources.tools + 1);
  });

  it("falls back to a fresh colony with a warning when the save is corrupt", () => {
    const restored = restoreColony("{not json", initialColony);
    expect(restored.resources).toEqual(initialColony.resources);
    expect(restored.people).toEqual(initialColony.people);
    expect(restored.activities[0].tone).toBe("warning");
  });
});
