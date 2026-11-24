import { WEAPON_THRESHOLD } from "../game/raid";
import type { ColonyState } from "../types";

export function RaidReport({ colony }: { colony: ColonyState }) {
  const { raidOnDay, lastRaid, resources } = colony;
  if (raidOnDay === undefined && lastRaid === null) return null;

  const enough = resources.weapons >= WEAPON_THRESHOLD;

  return (
    <section className="panel">
      <header>
        <div>
          <small>THE GATE</small>
          <h2>Bandit raids</h2>
        </div>
        <span>
          {resources.weapons} / {WEAPON_THRESHOLD} weapons
        </span>
      </header>

      {raidOnDay !== undefined && (
        <div className="net-line">
          <span>BANDITS ARRIVE ON DAY {raidOnDay}</span>
          <strong className={enough ? "gain" : "loss"}>
            {enough ? "ENOUGH WEAPONS" : "TOO FEW WEAPONS"}
          </strong>
        </div>
      )}

      {lastRaid && (
        <div className="net-line">
          <span>LAST RAID, DAY {lastRaid.day}</span>
          <strong className={lastRaid.defended ? "gain" : "loss"}>
            {lastRaid.defended
              ? "DEFENDED, NOTHING TAKEN"
              : `LOST ${lastRaid.looted.wood ?? 0} TIMBER, ${lastRaid.looted.stone ?? 0} STONE, ${lastRaid.looted.food ?? 0} RATIONS`}
          </strong>
        </div>
      )}
    </section>
  );
}
