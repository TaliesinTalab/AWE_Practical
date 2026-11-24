import { appendActivity } from "../simulation";
import type { Activity, ColonyState, Equipment, Person } from "../types";

export const WEAPON_COST = {
  wood: 4,
  stone: 3,
} as const;

// circular > dry
function updatePerson(state: ColonyState, personId: string, change: Partial<Person>): ColonyState {
  return {
    ...state,
    people: state.people.map((person) => (person.id === personId ? { ...person, ...change } : person)),
  };
}

//no tools equipped/available (panel) state = unchanged
export function equipItem(state: ColonyState, personId: string, item: Equipment): ColonyState {
  if (item !== "tool") return state;
  if (state.resources.tools < 1) return state;

  //person missing/task/equipped (panel) state = unchanged
  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null || person.equipment !== null) return state;

  //-1 tool, equip
  const nextState = updatePerson(
    {
      ...state,
      resources: {
        ...state.resources,
        tools: state.resources.tools - 1,
      },
    },
    person.id,
    { equipment: "tool" },
  );

  return {
    ...nextState, //copy nextState as is, change only desired values
    activities: appendActivity(nextState.activities, state.day, `${person.name} equipped a tool.`, "good"),
  };
}

export function unequipItem(state: ColonyState, personId: string): ColonyState {
  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null || person.equipment === null) return state;

  const returnedResource = person.equipment === "tool" ? "tools" : "panFlutes";
  const nextState = updatePerson(
    {
      ...state,
      resources: {
        ...state.resources,
        [returnedResource]: state.resources[returnedResource] + 1,
      },
    },
    person.id,
    { equipment: null },
  );

  const itemLabel = person.equipment === "tool" ? "tool" : "pan flute";
  return {
    ...nextState,
    activities: appendActivity(
      nextState.activities,
      state.day,
      `${person.name} returned a ${itemLabel} to stores.`,
    ),
  };
}

export function forgeWeapon(state: ColonyState): ColonyState {
  const { wood, stone, weapons } = state.resources;
  if (wood < WEAPON_COST.wood || stone < WEAPON_COST.stone) {
    return {
      ...state,
      activities: appendActivity(
        state.activities,
        state.day,
        `The forge needs ${WEAPON_COST.wood} timber and ${WEAPON_COST.stone} stone for a weapon.`,
        "warning",
      ),
    };
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      wood: wood - WEAPON_COST.wood,
      stone: stone - WEAPON_COST.stone,
      weapons: weapons + 1,
    },
    activities: appendActivity(state.activities, state.day, "A weapon joins the armory.", "good"),
  };
}