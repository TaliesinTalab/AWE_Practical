import { appendActivity } from "../simulation";
import type { ColonyState, JobType, Person, Task } from "../types";

export const NEWCOMER_DESTINATION = "ominous-dungeon";
export const FLUTE = { wood: 4, days: 2 };
export const SATYR_NOTE =
  "Satyr: farms double, cuts 1 timber less than a dwarf, never mines. Wields no tools and forges nothing, but carves pan flutes.";

export const MARSYAS: Person = {
  id: "satyr-1",
  name: "Marsyas",
  title: "Heretic Satyr",
  icon: "🐐",
  assignment: null,
  specialty: "farming",
  species: "satyr",
  equipment: null,
  task: null,
};

export function canDoJob(person: Person, job: JobType): boolean {
  return !(person.species === "satyr" && job === "mining");
}

export function welcomeNewcomer(state: ColonyState): ColonyState {
  if (state.newcomerJoined) return state;

  const message =
    "The scout freed Marsyas, a satyr whom a demon had locked away and tormented for losing a contest. He joins Stonehome and vows to earn its protection.";
  return {
    ...state,
    newcomerJoined: true,
    people: [...state.people, MARSYAS],
    activities: appendActivity(state.activities, state.day, message, "good"),
  };
}

export function carver(state: ColonyState): Person | undefined {
  return state.people.find((person) => person.task?.kind === "carving");
}

export function carveBlocker(state: ColonyState): string | null {
  const satyr = state.people.find((person) => person.species === "satyr");
  if (!satyr) return "Only a satyr knows this craft, and none lives in Stonehome.";
  if (state.hungry) return "The hold is hungry. No carving until everyone is fed.";
  if (satyr.task !== null) return `${satyr.name} is busy.`;
  if (state.resources.wood < FLUTE.wood) return `Needs ${FLUTE.wood} timber.`;
  return null;
}

export function startCarving(state: ColonyState): ColonyState {
  const satyr = state.people.find((person) => person.species === "satyr");
  if (!satyr || carveBlocker(state) !== null) return state;

  const task: Task = { kind: "carving", doneOnDay: state.day + FLUTE.days };
  return {
    ...state,
    resources: { ...state.resources, wood: state.resources.wood - FLUTE.wood },
    people: state.people.map((entry) => (entry.id === satyr.id ? { ...entry, task } : entry)),
    activities: appendActivity(
      state.activities,
      state.day,
      `${satyr.name} starts carving a pan flute. Done on day ${task.doneOnDay}.`,
    ),
  };
}

export function completeCarving(state: ColonyState): ColonyState {
  const worker = carver(state);
  if (!worker || worker.task?.kind !== "carving" || worker.task.doneOnDay > state.day) return state;

  return {
    ...state,
    resources: { ...state.resources, panFlutes: state.resources.panFlutes + 1 },
    people: state.people.map((entry) => (entry.id === worker.id ? { ...entry, task: null } : entry)),
    activities: appendActivity(state.activities, state.day, `${worker.name} finished carving a pan flute.`, "good"),
  };
}
