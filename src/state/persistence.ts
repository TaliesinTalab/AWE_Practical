import { RECIPES } from "../game/crafting";
import { DESTINATIONS } from "../game/expeditions";
import { appendActivity } from "../simulation";
import type { Activity, ColonyState, Person, RaidResult, Resources, Task } from "../types";

export const SAVE_KEY = "dwarfhold-save";
export const SAVE_VERSION = 1;

const RESOURCE_KEYS = ["wood", "stone", "food", "tools", "weapons", "panFlutes"];
const JOBS: unknown[] = ["woodcutting", "mining", "farming"];
const SPECIES: unknown[] = ["dwarf", "satyr"];
const EQUIPMENT: unknown[] = ["tool", "panFlute"];
const TONES: unknown[] = ["good", "warning"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isResources(value: unknown): value is Resources {
  return isRecord(value) && RESOURCE_KEYS.every((key) => isCount(value[key]));
}

function isTask(value: unknown): value is Task | null {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (value.kind === "expedition") {
    return typeof value.destination === "string" && Object.hasOwn(DESTINATIONS, value.destination) && isCount(value.returnOnDay);
  }
  if (value.kind === "forge") {
    return typeof value.item === "string" && Object.hasOwn(RECIPES, value.item) && isCount(value.doneOnDay);
  }
  return false;
}

function isPerson(value: unknown): value is Person {
  if (!isRecord(value)) return false;
  if (![value.id, value.name, value.title, value.icon].every((text) => typeof text === "string")) return false;
  if (value.assignment !== null && !JOBS.includes(value.assignment)) return false;
  if (value.specialty !== undefined && !JOBS.includes(value.specialty)) return false;
  if (!SPECIES.includes(value.species)) return false;
  if (value.equipment !== null && !EQUIPMENT.includes(value.equipment)) return false;
  return isTask(value.task);
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) return false;
  if (!isCount(value.id) || !isCount(value.day) || typeof value.message !== "string") return false;
  return value.tone === undefined || TONES.includes(value.tone);
}

function isRaidResult(value: unknown): value is RaidResult | null {
  if (value === null) return true;
  return isRecord(value) && isCount(value.day) && typeof value.defended === "boolean" && isRecord(value.looted);
}

function isColonyState(value: unknown): value is ColonyState {
  if (!isRecord(value)) return false;
  if (!isCount(value.day) || !isResources(value.resources)) return false;
  if (!Array.isArray(value.people) || !value.people.every(isPerson)) return false;
  if (!Array.isArray(value.activities) || !value.activities.every(isActivity)) return false;
  if (typeof value.hungry !== "boolean" || typeof value.newcomerJoined !== "boolean") return false;
  return isRaidResult(value.lastRaid);
}

export function serialise(state: ColonyState): string {
  return JSON.stringify({ version: SAVE_VERSION, state });
}

export function parseSave(text: string): ColonyState | null {
  let save: unknown;
  try {
    save = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(save) || save.version !== SAVE_VERSION) return null;
  return isColonyState(save.state) ? save.state : null;
}

export function restoreColony(text: string | null, fresh: ColonyState): ColonyState {
  if (text === null) return fresh;

  const saved = parseSave(text);
  if (!saved) {
    const message = "The saved ledger could not be read. Stonehome starts anew.";
    return { ...fresh, activities: appendActivity(fresh.activities, fresh.day, message, "warning") };
  }

  const message = "Stonehome was restored from its ledger. Tasks under way continue.";
  return { ...saved, activities: appendActivity(saved.activities, saved.day, message) };
}

export function loadColony(fresh: ColonyState): ColonyState {
  try {
    return restoreColony(localStorage.getItem(SAVE_KEY), fresh);
  } catch {
    return fresh;
  }
}

export function saveColony(state: ColonyState): void {
  try {
    localStorage.setItem(SAVE_KEY, serialise(state));
  } catch {
    /* storage is full or blocked: the game goes on unsaved */
  }
}
