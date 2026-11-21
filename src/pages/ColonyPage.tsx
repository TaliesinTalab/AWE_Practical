import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { DwarfRoster } from "../components/DwarfRoster";
import { jobLabel, production } from "../simulation";
import { useColony } from "../state/ColonyContext";
import { availablePerson } from "../state/colonyReducer";
import type { ResourceKey } from "../types";

export function ColonyPage() {
  const {
    colony,
    activities,
    expeditionPending,
    assignPerson,
    sendExpedition,
  } = useColony();
  const [destination, setDestination] = useState("crystal-cave");
  const [expeditionPerson, setExpeditionPerson] = useState(colony.people[0]?.id ?? "");
  const canSend = !expeditionPending && availablePerson(colony, expeditionPerson) !== undefined;

  const dailyOutput = colony.people.reduce<Record<ResourceKey, number>>(
    (total, person) => {
      if (person.assignment) {
        const output = production[person.assignment];
        Object.entries(output).forEach(([resource, amount]) => {
          total[resource as ResourceKey] += amount ?? 0;
        });
      }
      return total;
    },
    {
      wood: 0,
      stone: 0,
      food: -colony.people.length,
      tools: 0,
      weapons: 0,
      panFlutes: 0,
    },
  );

  return (
    <div className="dashboard">
      <DwarfRoster people={colony.people} onAssign={assignPerson} />

      <section className="center-stack">
        <section className="panel production">
          <header>
            <div>
              <small>SHIFT LEDGER</small>
              <h2>Daily Production</h2>
            </div>
            <span>updates each day</span>
          </header>

          <div className="job-grid">
            {(["woodcutting", "mining", "farming"] as const).map((job) => (
              <article key={job}>
                <b>
                  {job === "woodcutting"
                    ? "🌲"
                    : job === "mining"
                      ? "⛏️"
                      : "🍄"}
                </b>
                <h3>{jobLabel(job)}</h3>
                <p>
                  {
                    colony.people.filter(
                      (person) => person.assignment === job,
                    ).length
                  }{" "}
                  assigned
                </p>
                <strong>+{Object.values(production[job])[0]} / day</strong>
              </article>
            ))}
          </div>

          <div className="net-line">
            <span>NET FOOD AFTER MEALS</span>
            <strong className={dailyOutput.food >= 0 ? "gain" : "loss"}>
              {dailyOutput.food >= 0 ? "+" : ""}
              {dailyOutput.food}
            </strong>
          </div>
        </section>
      </section>

      <aside className="side-stack">
        <section className="panel expedition">
          <header>
            <div>
              <small>BEYOND THE GATE</small>
              <h2>Expedition</h2>
            </div>
            <b>🗺️</b>
          </header>

          <label>
            Scout
            <select
              value={expeditionPerson}
              onChange={(event) => setExpeditionPerson(event.target.value)}
            >
              {colony.people.map((person) => (
                <option key={person.id} value={person.id} disabled={person.task !== null}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="crystal-cave">Crystal Cave</option>
              <option value="old-mine">The Old Mine</option>
              <option value="blocked-pass">Blocked Pass</option>
            </select>
          </label>

          <button
            disabled={!canSend}
            onClick={() => sendExpedition(expeditionPerson, destination)}
          >
            {expeditionPending ? "Beyond the gate…" : "Send expedition"}
          </button>
          <p>
            A result returns in one request. The selected dwarf is unavailable
            while travelling.
          </p>
        </section>

        <Chronicle activities={activities} />
      </aside>
    </div>
  );
}
