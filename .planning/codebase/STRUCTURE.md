# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
project-god/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   └── soul-think/
│   │   │       └── route.js          # POST endpoint → Anthropic bridge
│   │   ├── favicon.ico
│   │   ├── globals.css               # CSS variables, dark theme
│   │   ├── layout.js                 # Root HTML layout + metadata
│   │   └── page.js                   # Mode dispatcher (menu/game/sandbox)
│   │
│   ├── data/                         # Static game data (no logic)
│   │   ├── eras.js                   # 6 eras: ancient → singularity
│   │   ├── godPowers.js              # 7 divine powers + costs
│   │   ├── historicalEvents.js       # 13 fixed + 5 emergent events
│   │   └── llmSouls.js               # 6 seed souls + createChildSoul()
│   │
│   ├── engine/                       # Simulation core (singletons)
│   │   ├── AIQueue.js                # Priority queue, 3 concurrent / 50 per min, fallback
│   │   ├── AnthropicBridge.js        # Server-only Anthropic fetch wrapper
│   │   ├── AudioEngine.js            # Howler SFX + ambient (probes /public/audio/)
│   │   ├── CampfireRegistry.js       # Campfire lifecycle (building/lit/dying)
│   │   ├── CityEngine.js             # Building queue, ambition-driven construction
│   │   ├── DailyRoutine.js           # 23 era-role schedules, 20 locations
│   │   ├── EconomySystem.js          # EconomySystem + DiplomacySystem classes
│   │   ├── GodPowerEngine.js         # 7 god powers invocation
│   │   ├── HeightmapRegistry.js      # Cached shared heightmap Float32Array
│   │   ├── InteractionEngine.js      # Proximity, 3-turn conversations, combat, love
│   │   ├── PopulationSystem.js       # Birth/death stats, generation tracking
│   │   ├── ResourceNodeRegistry.js   # Tree/rock/ore node lookup for AI harvesting
│   │   ├── SaveLoadEngine.js         # localStorage save slots (projectgod: prefix)
│   │   ├── SoulActionIntent.js       # Intent text resolver for UI display
│   │   ├── SoulBehavior.js           # Utility-AI action scoring
│   │   ├── SoulMemory.js             # Episodic memory (1000 cap) + consolidation
│   │   ├── SoulMind.js               # 11 THOUGHT_TYPES, tiered model selection
│   │   ├── SoulPositionRegistry.js   # Shared soul x/z lookup table
│   │   ├── SoulRelations.js          # 8 relationship types, trust/affection/respect
│   │   ├── WeatherSystem.js          # 5 states, seasonal cycles
│   │   ├── WorldEngine.js            # Master tick loop, lifecycle, events (811 lines)
│   │   └── __tests__/                # Vitest unit tests
│   │       ├── DailyRoutine.test.js
│   │       ├── EconomySystem.test.js
│   │       ├── SoulMemory.test.js
│   │       └── SoulRelations.test.js
│   │
│   ├── events/
│   │   └── EventCinematicOverlay.jsx # Full-screen event announcements
│   │
│   ├── models/                       # Procedural Three.js primitives (no GLTF)
│   │   ├── Campfire.jsx              # Campfire model (logs + flame)
│   │   ├── buildings/
│   │   │   ├── AncientBuildings.jsx      # 7 types
│   │   │   ├── BuildingFactory.jsx       # Dispatcher + BUILDING_SIZES
│   │   │   ├── IndustrialBuildings.jsx   # 7 types
│   │   │   ├── MedievalBuildings.jsx     # 8 types
│   │   │   ├── ModernBuildings.jsx       # 7 types
│   │   │   ├── RenaissanceBuildings.jsx  # 6 types
│   │   │   └── SingularityBuildings.jsx  # 6 types
│   │   ├── city/                     # (reserved, currently empty)
│   │   ├── humans/
│   │   │   └── HumanModel.jsx        # Blocky humanoid, era clothing, aura
│   │   └── nature/
│   │       ├── Rocks.jsx             # Scattered rocks
│   │       └── Trees.jsx             # Noise-placed, season-aware trees
│   │
│   ├── screens/                      # Top-level mode containers
│   │   ├── GameWorld.jsx             # 10Hz sim loop + R3F canvas + UI overlays
│   │   ├── LoadingScreen.jsx         # 6-phase animated intro
│   │   ├── MainMenu.jsx              # Mode selection (game / sandbox)
│   │   └── SandboxWorld.jsx          # Parallel sandbox mode container
│   │
│   ├── souls/                        # Soul 3D entity layer
│   │   ├── HeartParticles.jsx        # Love proximity particles
│   │   ├── SoulDialogueBubble.jsx    # Floating text bubbles
│   │   ├── SoulEntity.jsx            # Character model + pathfinding + animation
│   │   └── SoulsRenderer.jsx         # Alive-souls group renderer (capped at 100)
│   │
│   ├── store/
│   │   └── useGameStore.js           # Zustand store (40+ props, 30+ actions)
│   │
│   ├── ui/                           # DOM overlay UI
│   │   ├── DevPanel.jsx              # Dev overrides (weather, fog, time)
│   │   ├── DiplomacyPanel.jsx        # Diplomacy UI
│   │   ├── ErrorBoundary.jsx         # CanvasErrorBoundary + UIErrorBoundary
│   │   ├── EventLog.jsx              # Scrolling color-coded log (top 50)
│   │   ├── GodPanel.jsx              # 7 divine powers panel
│   │   ├── HUD.jsx                   # Top/bottom bars (year, era, speed, pause)
│   │   ├── OnboardingOverlay.jsx     # First-run guidance
│   │   ├── SandboxPanel.jsx          # Sandbox tools
│   │   ├── SoulInspector.jsx         # Right panel (stats/memories/relationships)
│   │   └── SpeechBubbleOverlay.jsx   # 3-turn dialogue display
│   │
│   └── world/                        # R3F scene components
│       ├── Atmosphere.jsx            # Era fog + ambient light
│       ├── BuildingsRenderer.jsx     # Buildings + construction scaffolds
│       ├── CampfireRenderer.jsx      # Campfire R3F group
│       ├── Caves.jsx                 # Cave geometry
│       ├── FlyCamera.jsx             # WASD fly camera (alt to OrbitControls)
│       ├── SandboxScene.jsx          # Sandbox R3F scene (flat 200-unit plane)
│       ├── SandboxSoulsRenderer.jsx  # Sandbox souls with drag handles
│       ├── Sky.jsx                   # Era-specific gradient dome
│       ├── Terrain.jsx               # Simplex noise terrain (exports sampleHeight, WATER_LEVEL, FLAT_RADIUS, generateHeightmap)
│       ├── Water.jsx                 # Animated wave plane
│       └── WorldScene.jsx            # Master scene (camera, atmosphere, renderers)
│
├── public/
│   └── audio/                        # Optional SFX + ambient assets (engine auto-disables if absent)
├── docs/                             # Project documentation
├── AGENTS.md                         # Agent/Claude instructions
├── CLAUDE.md                         # Project-level Claude instructions
├── eslint.config.mjs                 # ESLint flat config
├── .prettierrc                       # Prettier config
├── vitest.config.mjs                 # Vitest config
└── package.json
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router entry. Holds the root layout, global CSS, the `/` page, and all API routes.
- Contains: `layout.js`, `page.js`, `globals.css`, `api/soul-think/route.js`.
- Key files: `src/app/page.js` (mode dispatcher), `src/app/api/soul-think/route.js` (AI endpoint with rate limit + origin check).

**`src/engine/`:**
- Purpose: Pure simulation logic. No React, no JSX. Each file exports a singleton instance (or factory for store-bound ones).
- Contains: 21 `.js` files + `__tests__/`. Every cross-cutting subsystem lives here.
- Key files: `src/engine/WorldEngine.js` (811 lines — master sim), `src/engine/SoulMind.js` (prompt templates), `src/engine/AIQueue.js` (throttling), `src/engine/CityEngine.js`, `src/engine/InteractionEngine.js`.
- New since last map: `src/engine/CampfireRegistry.js`, `src/engine/HeightmapRegistry.js`, `src/engine/PopulationSystem.js`, `src/engine/ResourceNodeRegistry.js`, `src/engine/SoulActionIntent.js`, `src/engine/SoulBehavior.js`, `src/engine/SoulPositionRegistry.js`, `src/engine/GodPowerEngine.js`, `src/engine/SaveLoadEngine.js`, `src/engine/AudioEngine.js`, and the `__tests__/` folder.

**`src/store/`:**
- Purpose: Single Zustand store, the bridge between engines and React.
- Contains: Just `useGameStore.js`.
- Key file: `src/store/useGameStore.js` — 40+ properties, 30+ action setters. Stores time, era, souls, cities, buildings, weather, economy, god favor, UI flags, sandbox state, campfires, audio mute.

**`src/screens/`:**
- Purpose: Top-level mode containers. Each owns a `useEffect` that wires engines to the tick loop and handles cleanup.
- Contains: `GameWorld.jsx`, `SandboxWorld.jsx`, `MainMenu.jsx`, `LoadingScreen.jsx`.
- Key files: `src/screens/GameWorld.jsx` (the 10Hz tick + auto-save + audio subscription), `src/screens/SandboxWorld.jsx` (parallel sandbox).

**`src/world/`:**
- Purpose: R3F 3D scene composition. Scenes, terrain, sky, water, atmosphere, cameras, world-level renderers.
- Contains: 12 `.jsx` files.
- Key files: `src/world/WorldScene.jsx` (main scene graph), `src/world/Terrain.jsx` (exports `sampleHeight`, `WATER_LEVEL`, `FLAT_RADIUS`, `generateHeightmap` used by `HeightmapRegistry`), `src/world/FlyCamera.jsx` (WASD fly mode), `src/world/SandboxScene.jsx`, `src/world/CampfireRenderer.jsx`.

**`src/souls/`:**
- Purpose: Per-soul 3D rendering (model + animations + dialogue + particles).
- Contains: `SoulEntity.jsx`, `SoulsRenderer.jsx`, `SoulDialogueBubble.jsx`, `HeartParticles.jsx`.
- Key file: `src/souls/SoulEntity.jsx` (pathfinding, 7 animation states).

**`src/models/`:**
- Purpose: Procedural 3D model library. No GLTF/FBX — all Three.js primitives.
- Structure:
  - `src/models/humans/HumanModel.jsx` — single blocky humanoid with era clothing.
  - `src/models/buildings/` — 6 era sets (41 total building types) + `BuildingFactory.jsx` dispatcher + `BUILDING_SIZES` map.
  - `src/models/nature/` — `Trees.jsx`, `Rocks.jsx`.
  - `src/models/Campfire.jsx` — top-level campfire model.
  - `src/models/city/` — reserved, currently empty.

**`src/ui/`:**
- Purpose: DOM overlay UI (absolute-positioned panels, HUD, error boundaries).
- Contains: 10 `.jsx` files.
- Key files: `src/ui/HUD.jsx`, `src/ui/SoulInspector.jsx`, `src/ui/GodPanel.jsx`, `src/ui/EventLog.jsx`, `src/ui/ErrorBoundary.jsx` (named exports `CanvasErrorBoundary` + `UIErrorBoundary`), `src/ui/DevPanel.jsx`, `src/ui/SandboxPanel.jsx`, `src/ui/DiplomacyPanel.jsx` (new), `src/ui/OnboardingOverlay.jsx` (new).

**`src/events/`:**
- Purpose: Full-screen cinematic overlays (distinct from chrome UI).
- Contains: `EventCinematicOverlay.jsx` only.

**`src/data/`:**
- Purpose: Static read-only game data. No side effects, no classes.
- Contains: `eras.js`, `llmSouls.js`, `historicalEvents.js`, `godPowers.js`.
- Key pattern: Exports plain constants + pure helpers like `getEraForYear(year)` and `createChildSoul(parents)`.

**`src/engine/__tests__/`:**
- Purpose: Vitest unit tests for pure engine logic.
- Contains: `DailyRoutine.test.js`, `EconomySystem.test.js`, `SoulMemory.test.js`, `SoulRelations.test.js`.

## Key File Locations

**Entry Points:**
- `src/app/page.js` — Next.js root route. Picks game mode.
- `src/app/layout.js` — HTML document shell.
- `src/screens/GameWorld.jsx` — Simulation bootstrap + 10Hz tick loop.
- `src/screens/SandboxWorld.jsx` — Sandbox bootstrap.
- `src/app/api/soul-think/route.js` — AI API endpoint.

**Configuration:**
- `package.json` — Dependencies and scripts (`pnpm dev`, `pnpm build`, `pnpm start`).
- `eslint.config.mjs` — ESLint flat config.
- `.prettierrc` — Formatter config.
- `vitest.config.mjs` — Test runner config.
- `.env.local` — Contains `ANTHROPIC_API_KEY` (not committed, read server-side only).

**Core Logic:**
- `src/engine/WorldEngine.js` — Soul lifecycle, event firing, era transitions, tick orchestration.
- `src/engine/SoulMind.js` — THOUGHT_TYPES registry + `think(soul, type, context)` method.
- `src/engine/AIQueue.js` — Priority queue + rate limiting + fallback.
- `src/engine/InteractionEngine.js` — Conversations, combat, love.
- `src/engine/CityEngine.js` — Building construction.
- `src/store/useGameStore.js` — All shared state.

**Testing:**
- `src/engine/__tests__/` — Vitest specs co-located with engines under test.
- `vitest.config.mjs` — Test runner config at repo root.

## Naming Conventions

**Files:**
- **React components** → `PascalCase.jsx`. Examples: `src/ui/SoulInspector.jsx`, `src/souls/SoulEntity.jsx`, `src/world/WorldScene.jsx`, `src/models/buildings/AncientBuildings.jsx`.
- **Engine modules (non-React)** → `PascalCase.js`. Examples: `src/engine/WorldEngine.js`, `src/engine/CityEngine.js`, `src/engine/SoulMind.js`.
- **Hook / store modules** → `camelCase.js` with `use` prefix. Example: `src/store/useGameStore.js`.
- **Next.js reserved files** → lowercase as mandated. Examples: `src/app/page.js`, `src/app/layout.js`, `src/app/api/soul-think/route.js`, `src/app/globals.css`.
- **Test files** → `<Module>.test.js` in `__tests__/`. Example: `src/engine/__tests__/SoulMemory.test.js`.
- **Data modules** → `camelCase.js`. Examples: `src/data/eras.js`, `src/data/llmSouls.js`, `src/data/godPowers.js`, `src/data/historicalEvents.js`.

**Directories:**
- All lowercase: `src/engine/`, `src/models/humans/`, `src/models/buildings/`, `src/souls/`, `src/ui/`, `src/world/`, `src/data/`, `src/app/api/soul-think/`.

**Engine singleton exports:**
- **Class + instance pattern** (most): `export class CityEngine { ... }` + `export const cityEngine = new CityEngine()`. Seen in `CityEngine.js`, `EconomySystem.js` (two classes → two instances), `GodPowerEngine.js`, `SaveLoadEngine.js`, `WeatherSystem.js`, `SoulMind.js`, `InteractionEngine.js`, `SoulRelations.js` (exports `relationshipManager`), `PopulationSystem.js`.
- **Factory pattern** (store-bound): `export function getWorldEngine(store)` + `export function destroyWorldEngine()`. Used only by `src/engine/WorldEngine.js` because it needs the store handle at construction.
- **Module-scope registry pattern**: pure exported functions over a hidden `Map` / `Float32Array`. Used by `CampfireRegistry.js`, `HeightmapRegistry.js` (also exports `worldHeightmap` default), `SoulPositionRegistry.js`, `ResourceNodeRegistry.js`.
- **Default export object**: `AudioEngine.js` exports `audioEngine`; `AIQueue.js` exports `aiQueue` + `buildSoulSystemPrompt`.

**React components:**
- Default export, named function: `export default function WorldScene() { ... }`. Seen in all `src/world/`, `src/souls/`, `src/ui/`, `src/screens/` files.
- Named exports for boundary components: `ErrorBoundary.jsx` exports `CanvasErrorBoundary` and `UIErrorBoundary`.

**Zustand store:**
- Single named export `useGameStore`. Actions are camelCase: `setYear`, `setEra`, `togglePause`, `addEventLog`, `updateSoul`, `selectSoul`, `triggerCinematic`, `toggleFlyMode`, `toggleMute`, `toggleDiplomacyPanel`.

## Where to Add New Code

**New Soul Thought Type:**
- Add to `THOUGHT_TYPES` in `src/engine/SoulMind.js` with `{id, prompt, maxTokens, displayAs, logToMemory}`.
- If it's a dramatic moment, add the `id` string to `qualityTypes` in `getModelTier()` in `src/engine/AIQueue.js`.

**New Engine System:**
- Create `src/engine/<Name>.js` following the class-plus-instance pattern: `export class FooEngine { update(souls, year, store) {...} }` and `export const fooEngine = new FooEngine()`.
- Wire it into the tick loop in `src/screens/GameWorld.jsx` (`useEffect` setInterval callback).
- Add any new persisted state to `src/engine/SaveLoadEngine.js`.

**New UI Panel:**
- Create `src/ui/<Name>Panel.jsx` with default export.
- Add visibility flag to `src/store/useGameStore.js` (e.g., `showFooPanel: false` + `toggleFooPanel`).
- Mount in `src/screens/GameWorld.jsx` inside `<UIErrorBoundary>`.

**New 3D Model:**
- Procedural geometry only — no GLTF/FBX loaders.
- Humans → `src/models/humans/`.
- Buildings → `src/models/buildings/<Era>Buildings.jsx`; register in `BuildingFactory.jsx` and `BUILDING_SIZES`.
- Nature → `src/models/nature/`.

**New Scene Component:**
- Create `src/world/<Name>.jsx` as an R3F component.
- Mount in `src/world/WorldScene.jsx` inside the returned fragment.
- For sandbox variant, mount in `src/world/SandboxScene.jsx`.

**New Data Constant:**
- `src/data/<name>.js` — pure module, exports constants and pure helpers only (no runtime state).

**New Test:**
- `src/engine/__tests__/<Module>.test.js` using Vitest. Run via `pnpm test` (see `vitest.config.mjs`).

**New API Route:**
- `src/app/api/<name>/route.js` — export `POST` / `GET` async functions per Next.js App Router convention. Follow the origin-check + rate-limit + size-cap pattern in `src/app/api/soul-think/route.js`.

**New God Power:**
- Add entry to `src/data/godPowers.js` (id, cost, targeting).
- Implement invocation logic in `src/engine/GodPowerEngine.js` (`invoke()` switch case).
- Wire UI into `src/ui/GodPanel.jsx`.

## Special Directories

**`public/audio/`:**
- Purpose: Optional SFX + ambient `.mp3` files. Loaded lazily by `AudioEngine`.
- Generated: No (manually added assets).
- Committed: The `public/audio/` subtree is committed but may be empty; `AudioEngine._init()` probes `/audio/sfx/birth.mp3` and silently disables if absent.

**`src/models/city/`:**
- Purpose: Reserved for future city-scale composed models.
- Generated: No.
- Committed: Directory exists but currently empty.

**`src/engine/__tests__/`:**
- Purpose: Vitest specs for pure-logic engine modules.
- Generated: No.
- Committed: Yes.

**`docs/`:**
- Purpose: Project documentation beyond `CLAUDE.md` / `AGENTS.md`.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-04-15*
