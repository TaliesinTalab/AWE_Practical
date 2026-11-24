# Dwarfhold

Dwarfhold is a small browser-based colony and resource-management game. You are the warden of **Stonehome**, a new settlement beneath Emberpeak. Your three dwarves gather supplies, eat from the shared food stores, forge equipment, and explore locations beyond the hold.

This is a partially completed starter for the Advanced Web Development practical exam. It is already playable, but it is not yet a finished game. Investigate its existing behavior and extend it according to the [Requirements](REQUIREMENTS.md).

## How the game works

The colony advances in **days**. One day passes every ten seconds while the simulation is active. The Pause button stops this clock.

Each dwarf can have one of these local assignments:

| Assignment | Production per day |
|---|---:|
| Woodcutting | 3 wood |
| Deep Mining | 2 stone |
| Mushroom Farm | 4 food |
| Unassigned | No production |

At the end of each day, the colony consumes one food for every dwarf in the hold. With the initial company of three dwarves, daily meals therefore consume three food. A dwarf who is away on an expedition is not counted, because the rations for the journey are taken at departure. The Shift Ledger shows current assignments and expected production.

If the food cannot cover every meal, the stores drop to zero and the hold goes hungry: only the Mushroom Farm produces and no expedition can leave. The hold recovers as soon as a day ends with everyone fed. The Shift Ledger shows a notice for as long as the hold is hungry.

Use the assignment dropdown beside a dwarf to change their work. A changed assignment affects subsequent simulation days.

### Resources

The shared inventory contains:

- **Wood**, gathered by woodcutters.
- **Stone**, gathered by miners.
- **Food**, gathered by farmers and consumed by the company.
- **Tools**, produced at the forge or discovered on expeditions.
- **Weapons**, produced at the forge and kept as a colony resource for hostile events.
- **Pan flutes**, carved by the satyr and equipped like a tool.

A stored tool can be equipped to a dwarf in the roster and returned to the stores there. An equipped tool adds one unit of the dwarf's assigned resource per day on any local job (Woodcutting 3 -> 4, Deep Mining 2 -> 3, Mushroom Farm 4 -> 5). A dwarf carries at most one tool. A dwarf who leaves on an expedition keeps the tool, and it can only be returned by hand once the dwarf is back. Tools have no durability.

### Ember Forge

Forging is colony work. It needs materials, a free dwarf and time:

```text
3 wood + 2 stone -> 1 tool     (1 day)
4 wood + 3 stone -> 1 weapon   (2 days)
```

Open the **Forge** page, choose a crafter and press a recipe button. The materials are taken at once, and the item joins the stores when the stated day is reached. The forge handles one task at a time. The crafter does no local job and cannot leave on an expedition until the task is done. The page shows who is forging and on which day the result completes.

A recipe button is disabled, with the reason next to it, when the materials are missing, the chosen dwarf is busy, the forge is occupied or the hold is hungry.

### Expeditions

The expedition panel lets you select a dwarf and one destination. A journey lasts a number of days and takes one ration per day from the stores at departure. Without enough rations the expedition cannot start. Only one expedition is under way at a time, and none can leave while the hold is hungry.

The traveller is away until the return day: no local job, no forging, no reassignment. An equipped tool travels with its owner and can only be returned to the stores once they are home. On the return day the game asks the local API what the traveller found. A successful answer brings the dwarf home and adds the rewards to the inventory exactly once. A failed or unanswered request (the game stops waiting after 8 seconds) brings the dwarf home without rewards and is reported in the chronicle. The rations are not refunded.

The starter destinations:

| Destination | Days | Current outcome |
|---|---:|---|
| Crystal Cave | 1 | 8 stone and 1 tool |
| The Old Mine | 2 | 12 stone and 2 wood |
| Blocked Pass | 1 | A predictable failed expedition |
| Ominous Dungeon | 3 | 1 weapon and 2 food. The first success frees Marsyas |
| Bandit Hold | 4 | 4 weapons. Every success brings a bandit attack on the next day |

The short delay is deliberate, so that expedition behavior provides a realistic place to reason about promises, loading state, failures, and consistency between worker and resource state.

### Marsyas the satyr

The first successful expedition to the **Ominous Dungeon** frees Marsyas, a satyr whom a demon had locked away. He joins Stonehome once and stays. The expedition panel hints at the prisoner until he is found.

Marsyas eats one meal a day and can travel like a dwarf, but he works differently:

| | Dwarf | Marsyas |
|---|---:|---:|
| Mushroom Farm | 4 food | 8 food |
| Woodcutting | 3 wood | 2 wood |
| Deep Mining | 2 stone | not possible |
| Tools | can equip | cannot equip |
| Forge (tool, weapon) | can forge | cannot forge |
| Pan flute | cannot carve | carves |

Carving a pan flute costs 4 wood and takes 2 days. It is started on the Forge page, does not occupy the forge, and cannot start while the hold is hungry. While carving, Marsyas does no other work.

A pan flute is equipped in the roster like a tool, and a resident carries either a tool or a flute, never both. It gives a woodcutting dwarf 3 extra wood per day and any farmer 3 extra food per day (Marsyas farming with a flute: 8 + 3 = 11).

### Bandit raids

A successful expedition to the **Bandit Hold** brings home 4 weapons, and the bandits follow the tracks. They attack Stonehome at the end of the following day. This happens after every successful trip there. A failed expedition brings no attack.

- With **5 or more weapons** in the stores the gate holds. Nothing is taken and the weapons are kept.
- With fewer, the bandits take **half of the wood, stone and food**, rounded down. Tools, weapons and pan flutes are not touched, and nobody is harmed.

The rule is shown in the expedition panel when the Bandit Hold is selected. Once a raid is on its way, a "Bandit raids" panel on the colony page shows the arrival day and whether the current weapons are enough, and afterwards the result of the last raid. Both events are also written to the chronicle.

### Save and restore

The colony is saved in the browser's `localStorage` (key `dwarfhold-save`) after every change and restored when the page loads. Time does not pass while the page is closed, and a restored hold always starts running, even if it was paused.

A forge task or journey that was under way continues after a refresh and finishes on its stated day. The chronicle notes every restore.

Saved data carries a version and is checked when it is read. If it is damaged or comes from another version, the game starts a fresh colony and says so in the chronicle. To start over by hand, delete the key in the browser's developer tools.

## Current starter features

- Three named dwarves with assignments, status, and optional specialization.
- Woodcutting, mining, and farming jobs.
- An automatic ten-second simulation tick with pause/resume.
- Shared wood, stone, food, and tool inventories.
- Daily food consumption.
- One interactive forge recipe.
- Separate colony and forge routes sharing the same running simulation.
- A delayed local expedition API with success and failure outcomes.
- A recent-activity chronicle.
- Responsive fantasy-themed React interface.
- A small Vitest suite for pure simulation behavior.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:5174`; its API runs at `http://localhost:4200`. Available scripts are `dev`, `server`, `build`, `test`, and `preview`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite frontend and Express API together |
| `npm run server` | Start only the API on port 4200 |
| `npm run build` | Type-check and create a production frontend build |
| `npm run test` | Run the existing Vitest tests once |
| `npm run preview` | Preview a previously created production build |

## API

- `GET /api/health`
- `POST /api/expeditions` with `{ "dwarfId": "dwarf-2", "destination": "crystal-cave" }`

Destinations `crystal-cave`, `old-mine`, `ominous-dungeon` and `bandit-hold` have rewards. `blocked-pass` is the predictable failure case. Add `?fail=true` to force failure or `?latency=2500` to control delay. The delay is default to two seconds.

## Project orientation

- `src/App.tsx` defines the colony and forge routes.
- `src/state/ColonyProvider.tsx` owns shared colony state, the simulation timer, and game actions.
- `src/state/ColonyContext.ts` exposes the shared state through `useColony`.
- `src/pages/` contains the shared layout, colony page, and forge page.
- `src/simulation.ts` contains the production table and daily simulation transition.
- `src/types.ts` defines workers, jobs, statuses, resources, and activity records.
- `src/api.ts` contains the expedition HTTP request.
- `src/components/` contains the roster, resource display, and shared chronicle.
- `server/index.js` implements the local expedition service.


See [docs/API.md](docs/API.md) for contract details.
