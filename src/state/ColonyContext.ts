import { createContext, useContext } from "react";
import type { Activity, ColonyState, Equipment, JobType } from "../types";

export interface ColonyContextValue {
  colony: ColonyState;
  paused: boolean;
  activities: Activity[];
  expeditionPending: boolean;
  togglePaused: () => void;
  assignPerson: (id: string, assignment: JobType) => void;
  craftTool: () => void;
  craftWeapon: () => void;
  equipTool: (personId: string) => void;
  unequipItem: (personId: string) => void;
  sendExpedition: (personId: string, destination: string) => Promise<void>;
}

export const ColonyContext = createContext<ColonyContextValue | null>(null);

export function useColony(): ColonyContextValue {
  const context = useContext(ColonyContext);
  if (!context) {
    throw new Error("useColony must be used inside <ColonyProvider>");
  }
  return context;
}
