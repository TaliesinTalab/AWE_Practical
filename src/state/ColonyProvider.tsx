import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { beginExpedition } from "../api";
import { ColonyContext } from "./ColonyContext";
import { availablePerson, colonyReducer, initialColony } from "./colonyReducer";
import type { CraftItem, JobType } from "../types";

export const DAY_MS = 10_000;

export function ColonyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(colonyReducer, initialColony);
  const [paused, setPaused] = useState(false);
  const [expeditionPending, setExpeditionPending] = useState(false);
  const expeditionRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: "advanceDay" }), DAY_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const togglePaused = () => setPaused((wasPaused) => !wasPaused);
  const assignPerson = (personId: string, job: JobType) => dispatch({ type: "assignJob", personId, job });
  const startCraft = (personId: string, item: CraftItem) => dispatch({ type: "startCraft", personId, item });
  const equipTool = (personId: string) => dispatch({ type: "equip", personId, item: "tool" });
  const unequipItem = (personId: string) => dispatch({ type: "unequip", personId });

  const sendExpedition = async (personId: string, destination: string) => {
    const currentState = stateRef.current;
    if (expeditionRef.current || availablePerson(currentState, personId) === undefined) return;
    expeditionRef.current = true;
    setExpeditionPending(true);
    dispatch({ type: "startExpedition", personId, destination });
    try {
      const result = await beginExpedition(personId, destination);
      dispatch({ type: "completeExpedition", personId, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The expedition did not return.";
      dispatch({ type: "failExpedition", personId, message });
    } finally {
      expeditionRef.current = false;
      setExpeditionPending(false);
    }
  };

  return (
    <ColonyContext.Provider
      value={{
        colony: state,
        paused,
        activities: state.activities,
        expeditionPending,
        togglePaused,
        assignPerson,
        startCraft,
        equipTool,
        unequipItem,
        sendExpedition,
      }}
    >
      {children}
    </ColonyContext.Provider>
  );
}