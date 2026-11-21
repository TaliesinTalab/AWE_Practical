import type { ColonyState, Person, PersonStatus, JobType, Resources } from "./types";

export const production: Record<Exclude<JobType, null>, Partial<Resources>> = {
  woodcutting: { wood: 3 }, mining: { stone: 2 }, farming: { food: 4 },
};

export function advanceDay(state: ColonyState): ColonyState {
  const resources = { ...state.resources };

  state.people.forEach((person) => {
    if (!person.assignment) return;

    const output = production[person.assignment];

    Object.entries(output).forEach(([resource, amount]) => {
      resources[resource as keyof Resources] += amount ?? 0;
    });

  });

  resources.food = Math.max(0, resources.food - state.people.length);

  return { ...state, day: state.day + 1, resources };
}

export const jobLabel = (job: JobType) => job ? ({ 
  woodcutting: "Woodcutting", 
  mining: "Deep Mining", 
  farming: "Mushroom Farm" 
}[job]) : "Unassigned";

export const personStatus = (person: Person): PersonStatus =>
  person.task ? person.task.kind : person.assignment ? "working" : "idle";
