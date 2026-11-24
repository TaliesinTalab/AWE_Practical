# Manual Test Plan for Dwarfhold

This document defines the manual verification scenarios for requirements **D1 through D7**. Each packet adds or refines the concrete steps for its requirement as team decisions are finalized, and the full plan is executed on `master` before submission.

## Test Environment Setup

- Start both frontend and API servers with `npm run dev` (web at `http://localhost:5174`, API at `http://localhost:4200`).
- Open the browser Developer Tools (`Console`, `Network`, and `Application -> Local Storage`) to inspect requests, errors, and persisted state.
- For expedition fault-injection tests, use the built-in `blocked-pass` destination or server query switches (`?fail=true` and `?latency=<ms>`).

---

## D1 — Colony work and survival (15%)

1. **Daily production and meal consumption**
   - **Precondition:** Fresh colony (`day 12`, 3 dwarves: 1 mining, 1 woodcutting, 1 unassigned; `food: 18`).
   - **Action:** Let one simulation day advance (or unpause until `day 13`).
   - **Expected:** Stone increases by `2` (`9 -> 11`), wood increases by `3` (`14 -> 17`), food changes by `+0 - 3 = -3` (`18 -> 15`), and the Shift Ledger matches the actual per-day change.
2. **Single activity per resident (no double contribution)**
   - **Precondition:** Assign a dwarf to a local job, then send that same dwarf on an expedition (or assign them to a forge task once D3 is active).
   - **Action:** Advance a simulation day while the dwarf is away on the expedition or busy in the forge.
   - **Expected:** That dwarf produces `0` resources from their local job while away/crafting. A crafter still counts toward daily food consumption; a traveller does not, because the rations for the journey were taken at departure.
3. **Food shortage consequence and recovery**
   - **Precondition:** Reduce stored food below the company's daily consumption (e.g., all dwarves unassigned until food runs out).
   - **Action:** Advance through a day where `food < people.length`, then restore food production and advance subsequent days.
   - **Expected:** Production happens before meals; when total food cannot cover everyone, food is clamped to `0`, `hungry` becomes `true`, a warning is recorded in the Hold Chronicle, and on the next day only Mushroom Farm (`farming`) produces (`woodcutting` and `mining` show `0 / day` in the Shift Ledger); once a day ends with everyone fed, `hungry` becomes `false`, full production resumes, and a recovery entry appears in the Hold Chronicle. While `hungry` is `true`, the Shift Ledger shows the hunger notice and the Send expedition button is disabled.

---

## D2 — Useful tools, weapons, and equipment (20%)

1. **Equip and return a tool**
   - **Precondition:** At least `1` tool in shared inventory and an unassigned or working dwarf with no equipped item.
   - **Action:** Equip a tool to the dwarf, inspect the roster and resource bar, then unequip/return the tool.
   - **Expected:** Stored `tools` decreases by `1` on equip and increases by `1` on return; the roster clearly shows who holds the tool; a dwarf cannot equip more than one tool, and a tool cannot be equipped by multiple dwarves simultaneously. The Equip and Return buttons are readable and fit the roster row.
2. **Tool production bonus on compatible local jobs**
   - **Precondition:** Equip a tool to a dwarf assigned to Woodcutting (and repeat for Deep Mining / Mushroom Farm).
   - **Action:** Advance one simulation day.
   - **Expected:** Output increases by `+1` unit of the assigned resource per day (e.g., Woodcutting `3 -> 4`, Deep Mining `2 -> 3`, Mushroom Farm `4 -> 5`), and the Shift Ledger reflects the boosted output.
3. **Weapon recipe and resource display**
   - **Precondition:** Open the Forge page with sufficient materials for a weapon.
   - **Action:** Inspect the displayed weapon recipe and forge a weapon.
   - **Expected:** The Forge page displays the recipe cost (`4 wood + 3 stone -> 1 weapon`, 2 days); starting with at least `4 wood` and `3 stone` deducts them at once and `weapons` rises by `1` in the resource bar when the stated day is reached. With insufficient wood or stone the button is disabled with the reason shown, and resources are unchanged.

---

## D3 — Crafting as colony work (10%)

1. **Start valid forge task (materials, eligible resident, duration)** *(tool 1 day, weapon 2 days)*
   - **Precondition:** Sufficient materials and an eligible resident (present, not on an expedition, not already crafting).
   - **Action:** Start forging a tool (and in a separate check, a weapon).
   - **Expected:** Materials are deducted at the start; the UI shows who is crafting and on which day it completes; the crafter is marked busy and produces no local job output while crafting; upon reaching the completion day, the item is added to inventory and the resident becomes available again. The footer names the crafter while the forge is in use.
2. **Reject invalid crafting attempts**
   - **Precondition:** Test (a) insufficient materials, (b) a chosen crafter who is busy, (c) forge already occupied by an active task, and (d) a hungry hold.
   - **Action:** Try to start a forge task in each invalid state.
   - **Expected:** The recipe button is disabled and the reason is shown next to it; neither residents, resources nor the chronicle change.
3. **No immediate crafting**
   - **Action:** Start a tool while the simulation is paused.
   - **Expected:** The materials are taken, but the tool count does not rise until the day changes.

---

## D4 — Resilient expeditions (10%)

1. **Successful expedition in days, single reward**
   - **Precondition:** Fresh colony (`day 12`, `food: 18`), an eligible dwarf, The Old Mine (2 days).
   - **Action:** Send the expedition and let two days pass.
   - **Expected:** `2` rations leave the stores at departure; the panel and the roster show the traveller and return day `14`; the traveller does no local job and is not counted at meals; exactly one request is sent when day `14` begins, and the rewards (`+12 stone, +2 wood`) are added exactly once.
2. **Failed expedition recovery (`blocked-pass`, or the API not running)**
   - **Action:** Send a dwarf to Blocked Pass and wait for the return day. Repeat with the API stopped.
   - **Expected:** No rewards, a readable warning in the chronicle, and the dwarf is home and available. The rations are not refunded.
3. **Repeated clicks, second traveller, pause**
   - **Action:** Click "Send expedition" rapidly; try to send a second dwarf while one is away; send a dwarf while the simulation is paused and wait.
   - **Expected:** One departure and one ration deduction only; the second attempt is refused with a reason; while paused no request is sent and nothing changes until the simulation runs again.
4. **Invalid departures**
   - **Precondition:** (a) a hungry hold, (b) fewer rations than the journey needs, (c) a dwarf who is forging.
   - **Expected:** The button is disabled with the reason shown; neither residents nor resources change.
5. **Tool handling on expedition departure** *(the traveller keeps the tool)*
   - **Precondition:** Equip a tool to an eligible dwarf, then send that dwarf to The Old Mine (no tool reward).
   - **Expected:** The stored tool count changes neither on departure nor on return; the roster still shows the tool on the traveller; the Return button is disabled while the dwarf is away and works again once the dwarf is back.

---

## D5 — Save and restore (10%)

1. **Persist and restore meaningful colony state across refresh**
   - **Precondition:** Advance days, change assignments, equip a tool, modify resources, and record chronicle entries.
   - **Action:** Refresh the browser (`F5` / `Ctrl+R`).
   - **Expected:** Day counter, resources, resident assignments/equipment/species, chronicle, and flags are restored accurately from `localStorage`.
2. **Corrupt or incompatible saved data fallback**
   - **Precondition:** Open DevTools `Application -> Local Storage` and edit the save entry to (a) invalid JSON, (b) missing/wrong schema version, or (c) invalid field types/negative resources.
   - **Action:** Refresh the browser.
   - **Expected:** The app does not crash; it falls back safely to a fresh colony state and informs the player via the UI/chronicle.
3. **Interrupted forge task and expedition on refresh**
   - **Precondition:** Start (a) a weapon at the forge (2 days) and (b) an expedition to The Old Mine (2 days), then refresh the browser before either finishes.
   - **Expected:** Both continue. The forge panel and the expedition panel show the same person and the same day as before the refresh, the chronicle states that the hold was restored and tasks under way continue, the weapon arrives on its day, and the traveller returns on the return day with the reward applied once (one request in the Network tab).

---

## D6 — A new species joins Stonehome (20%)

1. **Newcomer arrival after first successful expedition to chosen destination** *(Satyr after Ominous Dungeon)*
   - **Precondition:** `newcomerJoined` is false; send an eligible dwarf to the chosen destination (`Ominous Dungeon`).
   - **Action:** Complete the first expedition successfully, then complete a second expedition to the same destination.
   - **Expected:** The Satyr joins Stonehome after the first successful expedition (and does not join a second time on subsequent expeditions); a failed expedition to that destination does not trigger arrival.
2. **Distinct UI representation and visible capabilities/limitations**
   - **Precondition:** Inspect the roster and Forge page after the newcomer joins.
   - **Expected:** The Satyr is visually distinct from dwarves (own icon, title and a note in his roster row). His production difference (8 food on the Mushroom Farm, 2 wood, Deep Mining greyed out) and his crafting capability and limitation (carves a pan flute for 4 wood in 2 days; greyed out as forge crafter; no "Equip tool" button; one equipped item at most) are visible before assignment or crafting. Before he joins, the expedition panel hints at the Ominous Dungeon and the Forge page explains why the flute cannot be carved yet.
3. **Participation in colony rules**
   - **Action:** Test daily food consumption (`+1` meal/day), job assignment, pan flute carving (forge stays free, blocked while hungry), equipping a flute (`+3` wood on a woodcutting dwarf, `+3` food on any farmer, `11` food for the Satyr farming, no effect on a miner), expedition eligibility, and a browser refresh while the Satyr is carving.
   - **Expected:** All colony rules apply consistently without breaking invariants.

---

## D7 — Expedition consequences and defense (15%)

1. **Bandit attack after a successful expedition with too few weapons**
   - **Precondition:** 0 stored `weapons`. Select `Bandit Hold` (4 days): the expedition panel states the rule (attack on the next day, 5 weapons hold the gate, weapons are kept, otherwise half of wood, stone and food).
   - **Action:** Send an eligible resident and wait for the return and one more day.
   - **Expected:** On the return day weapons rise to 4, the chronicle warns of the attack and the "Bandit raids" panel shows the arrival day with "Too few weapons". At the end of the next day wood, stone and food are halved (rounded down, never below zero), tools, weapons and pan flutes are unchanged, and the losses are shown in the chronicle and as "Last raid" in the panel.
2. **Successful defence at or above the threshold**
   - **Precondition:** At least 1 stored weapon before the return (forged, or from the Ominous Dungeon), so that the 4 from the Bandit Hold reach 5.
   - **Action:** Send an eligible resident to `Bandit Hold` and wait for the return and one more day. Repeat the trip once more.
   - **Expected:** The panel shows "Enough weapons". After the attack nothing is taken, the weapon count is unchanged (weapons are kept), and chronicle and panel report the defence. The second trip brings a second attack with the same outcome.
3. **Failed expedition never triggers attack**
   - **Precondition:** A resident is on the way to `Bandit Hold`. Stop the API before the return day.
   - **Expected:** The traveller returns with the failure message and no weapons. No attack is announced, no "Bandit raids" panel appears, and nothing is taken on the next day.
4. **Pause and refresh between return and attack**
   - **Action:** After a successful return from `Bandit Hold`, (a) pause the hold, (b) refresh the browser before the next day.
   - **Expected:** No attack while paused. After the refresh the pending raid is still shown, and the attack happens at the next day tick.