# Expedition API

`POST /api/expeditions` accepts JSON containing string `dwarfId` and `destination`. A successful response contains an expedition id, `completed` status, a partial resource reward, and a narrative message. Invalid input returns 400, an unknown destination returns 404, and `blocked-pass` or `?fail=true` returns 503.

The deterministic result arrives after a configurable delay and there is no polling or server-side persisted task. Restarting the server resets expedition numbering. During Vite development, `/api` is proxied to port 4200.

Destinations with a reward: `crystal-cave` (8 stone, 1 tool), `old-mine` (12 stone, 2 wood), `ominous-dungeon` (1 weapon, 2 food) and `bandit-hold` (4 weapons). The server only reports what the traveller found. What follows from a success (the newcomer after `ominous-dungeon`, the bandit attack after `bandit-hold`) is decided by the client's game rules.
