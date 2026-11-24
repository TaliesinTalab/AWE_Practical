import { advanceDay, appendActivity, jobLabel } from "../simulation";
import { equipItem, forgeWeapon, unequipItem } from "../game/equipment";
import type {
  Activity,
  ColonyState,
  CraftItem,
  Person,
  Equipment,
  ExpeditionResult,
  JobType,
  ResourceKey,
} from "../types";

export type ColonyAction =
  | { type: "advanceDay" }
  | { type: "assignJob"; personId: string; job: JobType }
  | { type: "forgeTool" }
  | { type: "craftWeapon" }
  | { type: "equip"; personId: string; item: Equipment }
  | { type: "unequip"; personId: string }
  | { type: "startCraft"; personId: string; item: CraftItem }
  | { type: "startExpedition"; personId: string; destination: string }
  | { type: "completeExpedition"; personId: string; result: ExpeditionResult }
  | { type: "failExpedition"; personId: string; message: string };

export const initialColony: ColonyState = {
  day: 12,
  resources: { wood: 14, stone: 9, food: 18, tools: 1, weapons: 0, panFlutes: 0 },
  people: [
    {
      id: "dwarf-1",
      name: "Bromli Copperkeg",
      title: "Hold Warden",
      icon: "🧔🏻",
      assignment: "mining",
      specialty: "mining",
      species: "dwarf",
      equipment: null,
      task: null,
    },
    {
      id: "dwarf-2",
      name: "Yrsa Flintbraid",
      title: "Trail Scout",
      icon: "🧔🏼‍♀️",
      assignment: "woodcutting",
      specialty: "woodcutting",
      species: "dwarf",
      equipment: null,
      task: null,
    },
    {
      id: "dwarf-3",
      name: "Dori Ashmantle",
      title: "Stone Singer",
      icon: "🧔🏽",
      assignment: null,
      species: "dwarf",
      equipment: null,
      task: null,
    },
  ],
  activities: [
    { id: 1, day: 12, message: "The forge fires are lit. Stonehome wakes." },
  ],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
};

// A person with a task (expedition or forge) cannot take on anything else.
export function availablePerson(state: ColonyState, personId: string): Person | undefined {
  return state.people.find((person) => person.id === personId && person.task === null);
}

function isTravelling(state: ColonyState, personId: string): boolean {
  return state.people.some((person) => person.id === personId && person.task?.kind === "expedition");
}

function updatePerson(state: ColonyState, personId: string, change: Partial<Person>): ColonyState {
  return {
    ...state,
    people: state.people.map((person) => (person.id === personId ? { ...person, ...change } : person)),
  };
}

// Newest entry first. The id continues from the newest entry, so it never repeats.
function record(state: ColonyState, message: string, tone?: Activity["tone"]): ColonyState {
  return { ...state, activities: appendActivity(state.activities, state.day, message, tone) };
}

export function colonyReducer(state: ColonyState, action: ColonyAction): ColonyState {
  switch (action.type) {
    case "advanceDay":
      return advanceDay(state);

    case "assignJob": {
      const person = availablePerson(state, action.personId);
      if (!person) return state;
      return record(
        updatePerson(state, person.id, { assignment: action.job }),
        `${person.name} assigned to ${jobLabel(action.job)}.`,
      );
    }

    case "forgeTool": {
      const { wood, stone, tools } = state.resources;
      if (wood < 3 || stone < 2) return record(state, "The forge needs 3 timber and 2 stone.", "warning");
      return record(
        { ...state, resources: { ...state.resources, wood: wood - 3, stone: stone - 2, tools: tools + 1 } },
        "A sturdy iron tool joins the stores.",
        "good",
      );
    }

    case "startExpedition": {
      const person = availablePerson(state, action.personId);
      if (!person) return state;
      return record(
        updatePerson(state, person.id, { task: { kind: "expedition", destination: action.destination } }),
        `${person.name} departed for ${action.destination.replace("-", " ")}.`,
      );
    }

    case "completeExpedition": {
      if (!isTravelling(state, action.personId)) return state;
      const resources = { ...state.resources };
      for (const [key, amount] of Object.entries(action.result.rewards)) resources[key as ResourceKey] += amount ?? 0;
      return record(
        updatePerson({ ...state, resources }, action.personId, { task: null }),
        action.result.message,
        "good",
      );
    }

    case "failExpedition": {
      if (!isTravelling(state, action.personId)) return state;
      return record(updatePerson(state, action.personId, { task: null }), action.message, "warning");
    }

    // Filled in by D2.
    case "craftWeapon":
      return forgeWeapon(state);

    case "equip":
      return equipItem(state, action.personId, action.item);

    case "unequip":
      return unequipItem(state, action.personId);

    // Filled in by D3.
    case "startCraft":
      return state;
  }
}