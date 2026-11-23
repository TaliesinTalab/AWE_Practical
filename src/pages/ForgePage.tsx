import { Chronicle } from "../components/Chronicle";
import { WEAPON_COST } from "../game/equipment";
import { useColony } from "../state/ColonyContext";

export function ForgePage() {
  const { activities, craftTool, craftWeapon } = useColony();

  return (
    <div className="forge-layout">
      <section className="panel forge">
        <div>
          <small>EMBER FORGE</small>
          <h2>Craft a tool</h2>
          <p>Equip the hold for future work.</p>
        </div>
        <div className="recipe">
          <span>3 🪵</span>
          <i>+</i>
          <span>2 🪨</span>
          <i>→</i>
          <span>1 ⚒️</span>
          <button onClick={craftTool}>Forge tool</button>
        </div>
      </section>

      <section className="panel forge">
        <div>
          <small>EMBER FORGE</small>
          <h2>Craft a weapon</h2>
          <p>Cost: {WEAPON_COST.wood} wood + {WEAPON_COST.stone} stone for 1 weapon.</p>
        </div>
        <div className="recipe">
          <span>{WEAPON_COST.wood} 🪵</span>
          <i>+</i>
          <span>{WEAPON_COST.stone} 🪨</span>
          <i>→</i>
          <span>1 ⚔️</span>
          <button onClick={craftWeapon}>Forge weapon</button>
        </div>
      </section>

      <Chronicle activities={activities} />
    </div>
  );
}