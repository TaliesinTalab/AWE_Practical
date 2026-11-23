import { describe, expect, it } from "vitest";
import { equipItem, forgeWeapon, unequipItem, WEAPON_COST } from "./equipment";
import type { ColonyState } from "../types";

const makeState = (overrides: Partial<ColonyState> = {}): ColonyState => ({
  day: 1,
  resources: { wood: 10, stone: 10, food: 10, tools: 1, weapons: 0, panFlutes: 0 },
  people: [
    { id: "d1", name: "Brom", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: null, task: null },
    { id: "d2", name: "Yrsa", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: null, task: null },
  ],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

describe("equipment and weapon recipe rules", () => {
  it("equips a tool and returns it while conserving total tools", () => {
    const start = makeState();
    const equipped = equipItem(start, "d1", "tool");
    expect(equipped.resources.tools).toBe(0);
    expect(equipped.people[0].equipment).toBe("tool");

    // Cannot equip a second item onto d1 or equip when store has 0 tools
    expect(equipItem(equipped, "d1", "tool")).toBe(equipped);
    expect(equipItem(equipped, "d2", "tool")).toBe(equipped);

    const returned = unequipItem(equipped, "d1");
    expect(returned.resources.tools).toBe(1);
    expect(returned.people[0].equipment).toBeNull();
    expect(unequipItem(returned, "d1")).toBe(returned);
  });

  it("does not equip a tool to someone with an active task", () => {
    const busy = makeState({
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: null, task: { kind: "expedition", destination: "crystal-cave" } },
      ],
    });
    expect(equipItem(busy, "d1", "tool")).toBe(busy);
  });

  it("forges a weapon using WEAPON_COST and keeps resources non-negative on shortage", () => {
    const start = makeState({
      resources: { wood: 8, stone: 6, food: 10, tools: 0, weapons: 0, panFlutes: 0 },
    });
    const forged = forgeWeapon(start);
    expect(forged.resources).toMatchObject({
      wood: 8 - WEAPON_COST.wood,
      stone: 6 - WEAPON_COST.stone,
      weapons: 1,
    });

    const poor = makeState({
      resources: { wood: 3, stone: 3, food: 10, tools: 0, weapons: 0, panFlutes: 0 },
    });
    const failed = forgeWeapon(poor);
    expect(failed.resources).toEqual(poor.resources); //check nothing was deducted (same before and after)
    expect(failed.activities[0].tone).toBe("warning");
  });

  it("does not mutate previous state and is deterministic", () => {
    const start = makeState();
    const snapshot = structuredClone(start);
    expect(equipItem(start, "d1", "tool")).toEqual(equipItem(start, "d1", "tool"));
    expect(start).toEqual(snapshot);
  });
});