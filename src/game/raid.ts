import { appendActivity } from "../simulation";
import type { ColonyState, ResourceKey, Resources } from "../types";

export const RAID_DESTINATION = "bandit-hold";
export const WEAPON_THRESHOLD = 5;

const LOOTED: ResourceKey[] = ["wood", "stone", "food"];

export function announceRaid(state: ColonyState): ColonyState {
  const raidOnDay = state.day + 1;
  const message = `Bandits followed the tracks home. They reach Stonehome on day ${raidOnDay}. ${WEAPON_THRESHOLD} weapons in the stores hold the gate.`;
  return { ...state, raidOnDay, activities: appendActivity(state.activities, state.day, message, "warning") };
}

export function resolveRaid(state: ColonyState): ColonyState {
  if (state.raidOnDay === undefined || state.raidOnDay > state.day) return state;

  const defended = state.resources.weapons >= WEAPON_THRESHOLD;
  const resources = { ...state.resources };
  const looted: Partial<Resources> = {};
  if (!defended) {
    for (const key of LOOTED) {
      const taken = Math.floor(resources[key] / 2);
      looted[key] = taken;
      resources[key] -= taken;
    }
  }

  const message = defended
    ? `Bandits attacked, but ${resources.weapons} weapons held the gate. Nothing was taken and the weapons are kept.`
    : `Bandits pillaged Stonehome and took ${looted.wood} timber, ${looted.stone} stone and ${looted.food} rations. ${WEAPON_THRESHOLD} weapons would have held the gate.`;

  return {
    ...state,
    resources,
    raidOnDay: undefined,
    lastRaid: { day: state.day, defended, looted },
    activities: appendActivity(state.activities, state.day, message, defended ? "good" : "warning"),
  };
}
