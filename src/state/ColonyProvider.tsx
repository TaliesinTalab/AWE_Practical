import { useEffect, useReducer, useState, type ReactNode } from "react";
import { beginExpedition } from "../api";
import type { JobType } from "../types";
import { ColonyContext, type ColonyContextValue } from "./ColonyContext";
import { availablePerson, colonyReducer, initialColony } from "./colonyReducer";

export function ColonyProvider({ children }: { children: ReactNode }) {
  const [colony, dispatch] = useReducer(colonyReducer, initialColony);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(
      () => dispatch({ type: "advanceDay" }),
      8_000,
    );

    return () => window.clearInterval(timer);
  }, [paused]);

  async function sendExpedition(personId: string, destination: string) {
    if (!availablePerson(colony, personId)) return;

    dispatch({ type: "startExpedition", personId, destination });

    try {
      const result = await beginExpedition(personId, destination);
      dispatch({ type: "completeExpedition", personId, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The expedition was lost from view.";
      dispatch({ type: "failExpedition", personId, message });
    }
  }

  const value: ColonyContextValue = {
    colony,
    paused,
    activities: colony.activities,
    expeditionPending: colony.people.some((person) => person.task?.kind === "expedition"),
    togglePaused: () => setPaused((value) => !value),
    assignPerson: (personId: string, job: JobType) => dispatch({ type: "assignJob", personId, job }),
    craftTool: () => dispatch({ type: "forgeTool" }),
    sendExpedition,
  };

  return <ColonyContext value={value}>{children}</ColonyContext>;
}
