import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { craftBlocker, forgeWorker, RECIPES } from "../game/crafting";
import { carveBlocker, carver, FLUTE } from "../game/newcomer";
import { useColony } from "../state/ColonyContext";
import type { CraftItem } from "../types";

const icons: Partial<Record<CraftItem, string>> = {
  tool: "⚒️",
  weapon: "⚔️",
};

export function ForgePage() {
  const { colony, activities, startCraft, startCarving } = useColony();
  const [crafterId, setCrafterId] = useState(colony.people[0]?.id ?? "");
  const worker = forgeWorker(colony);
  const task = worker?.task?.kind === "forge" ? worker.task : null;
  const carving = carver(colony);
  const carveBlock = carveBlocker(colony);

  return (
    <div className="forge-layout">
      <div className="center-stack">
        <section className="panel forge">
          <div>
            <small>EMBER FORGE</small>
            <h2>
              {worker && task
                ? `${worker.name} is forging a ${RECIPES[task.item]?.label}`
                : "The forge is free"}
            </h2>
            <p>
              {task
                ? `Done on day ${task.doneOnDay}. Today is day ${colony.day}.`
                : "One task at a time. The crafter does no other work until it is done."}
            </p>
          </div>
          <label>
            Crafter
            <select
              value={crafterId}
              onChange={(event) => setCrafterId(event.target.value)}
            >
              {colony.people.map((person) => (
                <option key={person.id} value={person.id} disabled={person.task !== null || person.species === "satyr"}>
                  {person.name}
                  {person.species === "satyr" ? " (does not forge)" : ""}
                </option>
              ))}
            </select>
          </label>
        </section>

        {(Object.keys(RECIPES) as CraftItem[]).map((item) => {
          const recipe = RECIPES[item];
          if (!recipe) return null;
          const blocker = craftBlocker(colony, crafterId, item);

          return (
            <section className="panel forge" key={item}>
              <div>
                <small>EMBER FORGE</small>
                <h2>Craft a {recipe.label}</h2>
                <p>
                  Takes {recipe.days} {recipe.days === 1 ? "day" : "days"}.{" "}
                  {blocker ?? "Materials are taken at the start."}
                </p>
              </div>
              <div className="recipe">
                <span>{recipe.cost.wood} 🪵</span>
                <i>+</i>
                <span>{recipe.cost.stone} 🪨</span>
                <i>→</i>
                <span>1 {icons[item]}</span>
                <button
                  disabled={blocker !== null}
                  onClick={() => startCraft(crafterId, item)}
                >
                  Forge {recipe.label}
                </button>
              </div>
            </section>
          );
        })}

        <section className="panel forge">
          <div>
            <small>SATYR CRAFT</small>
            <h2>
              {carving?.task?.kind === "carving"
                ? `${carving.name} is carving a pan flute`
                : "Carve a pan flute"}
            </h2>
            <p>
              {carving?.task?.kind === "carving"
                ? `Done on day ${carving.task.doneOnDay}. Today is day ${colony.day}.`
                : `Takes ${FLUTE.days} days and does not occupy the forge. ${carveBlock ?? "The timber is taken at the start."}`}
            </p>
            <p>
              A pan flute gives a woodcutting dwarf +3 timber and any farmer +3
              rations a day. One item per person: a tool or a flute.
            </p>
          </div>
          <div className="recipe">
            <span>{FLUTE.wood} 🪵</span>
            <i>→</i>
            <span>1 🎶</span>
            <button disabled={carveBlock !== null} onClick={startCarving}>
              Carve pan flute
            </button>
          </div>
        </section>
      </div>

      <Chronicle activities={activities} />
    </div>
  );
}
