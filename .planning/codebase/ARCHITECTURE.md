# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Singleton engine cores orchestrated by a fixed-timestep simulation loop, decoupled from a React Three Fiber (R3F) render layer via a single Zustand store. AI thought generation is bridged through a Next.js App Router API route that calls the Anthropic SDK server-side.

**Key Characteristics:**
- **Simulation / render separation** — The sim advances at a fixed 10Hz (100ms ticks) inside `src/screens/GameWorld.jsx`, completely independent of the React render tree. R3F re-renders are driven only by Zustand state changes.
- **Singleton engine systems** — Every cross-cutting system (`worldEngine`, `aiQueue`, `cityEngine`, `interactionEngine`, `weatherSystem`, `economySystem`, `diplomacySystem`, `godPowerEngine`, `saveLoadEngine`, `audioEngine`, `populationSystem`, `relationshipManager`, `soulMind`) is instantiated once and exported as a module-level instance. WorldEngine uses the `getWorldEngine(store)` / `destroyWorldEngine()` factory pattern so it can be bound to the store at boot.
- **Client-side AI orchestration, server-side API calls** — `SoulMind` enqueues thought requests into `AIQueue`, which `fetch()`es the same-origin `/api/soul-think` route. The route (`src/app/api/soul-think/route.js`) enforces origin check + per-IP rate limiting + body size cap, then defers to `AnthropicBridge.callAnthropic()` which holds the `ANTHROPIC_API_KEY` and speaks directly to `https://api.anthropic.com/v1/messages`.
- **Two parallel front-ends** — Same engine/store/models are reused in a secondary Sandbox mode (`src/screens/SandboxWorld.jsx` + `src/world/SandboxScene.jsx`) for feature testing.
- **Procedural-only 3D** — No GLTF/FBX assets. All geometry is constructed from Three.js primitives (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`) at render time.
- **Heightmap + position registries** — Shared world data (`worldHeightmap` in `src/engine/HeightmapRegistry.js`, soul positions in `src/engine/SoulPositionRegistry.js`, resource nodes in `src/engine/ResourceNodeRegistry.js`, campfires in `src/engine/CampfireRegistry.js`) live in module-scoped singletons accessed by both engines and renderers.
- **Fallback-first AI** — Every failing API call resolves to a poetic fallback string via `getFallbackThought()` in `AIQueue.js`, so the simulation never stalls on network errors.

## Layers

**Entry & App Shell (Next.js App Router):**
- Purpose: Hydrate the client, pick game mode, mount one of three screens.
- Location: `src/app/`
- Contains: `layout.js` (root HTML), `page.js` (mode dispatcher that dynamically imports `GameWorld` / `SandboxWorld` with `ssr: false`), `globals.css`, `api/soul-think/route.js`.
- Depends on: `useGameStore`, screen components.
- Used by: Next.js runtime.

**Screens (Game Orchestrators):**
- Purpose: Own the main effect that starts/stops engine singletons and runs the tick loop.
- Location: `src/screens/`
- Contains: `GameWorld.jsx` (full simulation), `SandboxWorld.jsx` (parallel test mode), `LoadingScreen.jsx`, `MainMenu.jsx`.
- Depends on: engine singletons, `useGameStore`, R3F `Canvas`, world scene, UI overlays.

**Engine (Simulation Core):**
- Purpose: Pure state/logic systems. No React imports. Mutates store via exposed setters.
- Location: `src/engine/`
- Contains: `WorldEngine.js` (master loop, soul lifecycle, events, era transitions), `SoulMind.js` (11 THOUGHT_TYPES + model tier routing), `AIQueue.js` (3 concurrent / 50 per minute batching, priority queue, fallback), `InteractionEngine.js` (proximity, 3-turn conversations, combat, love), `SoulMemory.js` (1000-cap episodic memory + consolidation), `SoulRelations.js` (8 relationship types, trust/affection/respect), `DailyRoutine.js` (23 era-role schedules, 20 locations), `CityEngine.js` (building queue, ambition-driven construction), `WeatherSystem.js` (5 states, seasonal), `EconomySystem.js` (`EconomySystem` + `DiplomacySystem` classes in one file), `GodPowerEngine.js` (7 divine powers), `AnthropicBridge.js` (server-only Anthropic fetch wrapper), `SaveLoadEngine.js` (localStorage slots, auto-save), `AudioEngine.js` (Howler-based SFX + ambient), `SoulBehavior.js` (utility-AI action scorer), `SoulActionIntent.js` (intent resolver), `PopulationSystem.js` (birth/death stats), plus registries (`CampfireRegistry`, `HeightmapRegistry`, `ResourceNodeRegistry`, `SoulPositionRegistry`).
- Depends on: `src/data/` (static game data), each other.
- Used by: Screens (tick driver), UI panels (read-only inspection), renderers (position/heightmap lookups).

**Store (State Snapshot):**
- Purpose: Single reactive source of truth bridging engine → React.
- Location: `src/store/useGameStore.js`
- Contains: ~40 properties (time, era, souls, cities, buildings, conversations, weather, economy, god favor, UI flags, sandbox state, campfires, audio) + ~30 action setters.
- Depends on: Zustand `create`.
- Used by: Every screen, UI panel, and renderer via `useGameStore((s) => …)`.

**Rendering (R3F Scene Graph):**
- Purpose: Declarative 3D rendering from store state.
- Location: `src/world/`, `src/souls/`, `src/models/`
- Contains:
  - `src/world/WorldScene.jsx` — Master scene (camera, `OrbitControls` or `FlyCamera`, `Atmosphere`, `Sky`, `Terrain`, `Water`, `Trees`, `Rocks`, `Caves`, `SoulsRenderer`, `BuildingsRenderer`, `CampfireRenderer`).
  - `src/world/SandboxScene.jsx` — Parallel sandbox scene (flat 200-unit plane, drag-to-place).
  - `src/souls/SoulsRenderer.jsx` — Renders alive souls, capped at `POPULATION.MAX_RENDERED_SOULS` (100).
  - `src/souls/SoulEntity.jsx` — Per-soul 3D character with pathfinding and 7 animation states.
  - `src/models/` — Procedural 3D model library (humans, 41 buildings across 6 era sets, trees, rocks, campfires).
- Depends on: store, engine registries (heightmap, positions, campfires), `@react-three/fiber`, `@react-three/drei`.

**UI Overlay:**
- Purpose: DOM-layer HUD, panels, overlays that sit above the R3F canvas.
- Location: `src/ui/`, `src/events/`
- Contains: `HUD.jsx` (top/bottom bars), `SoulInspector.jsx`, `EventLog.jsx`, `GodPanel.jsx`, `DevPanel.jsx`, `DiplomacyPanel.jsx`, `OnboardingOverlay.jsx`, `ErrorBoundary.jsx` (exports `CanvasErrorBoundary` + `UIErrorBoundary`), `SandboxPanel.jsx`, `SpeechBubbleOverlay.jsx`, `src/events/EventCinematicOverlay.jsx`.
- Depends on: store, engine singletons (for actions like save/load, god power invocation).

## Data Flow

**Simulation tick (`GameWorld.jsx` useEffect, 10Hz):**

1. `setInterval` fires every 100ms.
2. Read `store.getState()`. Bail if `paused`.
3. Advance `timeOfDay` by `HOURS_PER_TICK_1X * speedMultiplier` (24h per 600 ticks = 60s at 1x).
4. Advance `currentYear` by `YEARS_PER_TICK_1X * speedMultiplier` (1 year per 6 seconds at 1x).
5. Resolve era via `getEraForYear(newYear)`; if changed call `setEra(...)` and push era_change log entry.
6. `worldEngine.tick(newYear)` — runs soul lifecycle, interactions, AI thought triggers, events, deaths/births.
7. 20% chance per tick: `weatherSystem.update(newYear, store)`.
8. Every tick: `economySystem.update(...)`, `diplomacySystem.update(...)`, `cityEngine.update(...)`.
9. Engines call store setters (`updateSoul`, `addEventLog`, `addBuilding`, `setConstructionSites`, etc.).
10. Zustand notifies subscribers → R3F components re-render → scene updates.

**Audio subscription (parallel):**
- `store.subscribe` watches `eventLog[0]` timestamp, `currentEra`, `muted`. New event → `audioEngine.playEvent(type)`; era change → `audioEngine.playAmbient(era)`; mute toggle → `mute/unmute`.

**Auto-save:**
- Separate `setInterval(60000)` inside `GameWorld.jsx` calls `saveLoadEngine.save('auto')` while unpaused.

**State Management:**
- Engines never hold React state; they hold plain JS state and push into Zustand.
- UI components pull narrow slices via selectors to avoid unnecessary re-renders.

## AI Request Flow

**Path:** Soul lifecycle → `SoulMind.think(soul, THOUGHT_TYPES.X, context)` → `aiQueue.enqueue(...)` → internal priority queue (sorted ascending, lower = higher priority) → worker respects `maxConcurrent=3` and `callsThisMinute<50` (reset each 60s by `start()`) → `soulThinkAPI()` builds system prompt via `buildSoulSystemPrompt(soul, world)` (identity + emotional state + recent 12 memories + relationships + world context) → `fetch('/api/soul-think', ...)` → route handler `src/app/api/soul-think/route.js` validates origin/size/rate → `callAnthropic({systemPrompt, userPrompt, maxTokens, model})` in `src/engine/AnthropicBridge.js` → `POST https://api.anthropic.com/v1/messages` → text returned up the chain → `SoulMind` logs to `soul.memory` if `thoughtType.logToMemory`, returns shaped object `{text, displayAs, soulId, soulName, thoughtType, year}` → caller updates store (`updateSoul` mood/memory, `addEventLog`, trigger cinematic, etc.).

**Tiered Model Selection (`getModelTier` in `AIQueue.js` + `AnthropicBridge.js`):**
- `fast` tier → `claude-haiku-4-5-20251001` (Haiku) — default for all thoughts.
- `quality` tier → `claude-sonnet-4-5-20241022` with probe fallback to `claude-3-5-sonnet-20241022`, then to Haiku. Applied to thought IDs: `last_words`, `self_awareness`, `god_communication`, `god_question`, `love_confession`, `life_decision`.
- Quality model is probed once on first quality call and cached in module-level `MODELS.quality`.

**Fallback guarantee:**
- Any throw inside `_executeCall` resolves the promise with `getFallbackThought(soul, thoughtType)` — one of four poetic stock lines. Network errors, API failures, malformed prompts all degrade gracefully.
- Server route catches all errors and returns HTTP 500; client treats non-OK as a fallback trigger.

## Key Abstractions

**Soul:**
- Purpose: Autonomous agent with identity, mood, memory, relationships, position, daily schedule, and an AI brain.
- Definition source: `src/data/llmSouls.js` (6 seed souls + `createChildSoul()`).
- Runtime home: `worldEngine.souls` array; also mirrored into `store.souls` for rendering.
- Brain: `SoulMind` + `SoulMemory` (per-soul instance) + `SoulRelations` entries in `relationshipManager`.
- Pattern: Plain object with attached `memory` instance and method `getRelationshipWith(id)`.

**Engine Singleton:**
- Purpose: Stateful subsystem with `update(...)` or `tick(...)` entry point, called every 10Hz tick.
- Examples: `src/engine/WorldEngine.js`, `src/engine/CityEngine.js`, `src/engine/InteractionEngine.js`.
- Pattern: Either `export const name = new Class()` (most) or factory `export function getWorldEngine(store)` + `destroyWorldEngine()` for store-bound instances.

**Registry:**
- Purpose: Shared mutable lookup tables accessed across engines and renderers.
- Examples: `src/engine/HeightmapRegistry.js` (cached Float32Array to avoid re-generating ~1MB per consumer), `src/engine/SoulPositionRegistry.js`, `src/engine/CampfireRegistry.js`, `src/engine/ResourceNodeRegistry.js`.
- Pattern: Module-level `Map` or typed-array plus exported getter/setter functions.

**Thought Type:**
- Purpose: Declarative AI prompt template + display policy.
- Location: `THOUGHT_TYPES` object in `src/engine/SoulMind.js`.
- Shape: `{id, prompt(soul, ...), maxTokens, displayAs, logToMemory, hasGameConsequence?, triggersDeathCinematic?}`.
- Examples: `EVENT_REACTION`, `CONVERSATION_OPENER`, `CONVERSATION_REPLY`, `LIFE_DECISION`, `LAST_WORDS`, `SELF_AWARENESS`.

## Entry Points

**Next.js root page:**
- Location: `src/app/page.js`
- Triggers: Browser request to `/`.
- Responsibilities: Read `gameMode` from store; dynamic-import `GameWorld` / `SandboxWorld` with `ssr: false`, or render `MainMenu`.

**Game simulation:**
- Location: `src/screens/GameWorld.jsx`
- Triggers: `gameMode === 'game'` (after user clicks start on `MainMenu`).
- Responsibilities: Start `aiQueue`, instantiate `worldEngine`, run 10Hz tick interval, wire audio subscription, run 60s auto-save interval, mount R3F `Canvas` + UI overlays, clean up on unmount (`destroyWorldEngine`, `aiQueue.stop()`, clear intervals).

**Sandbox simulation:**
- Location: `src/screens/SandboxWorld.jsx`
- Triggers: `gameMode === 'sandbox'`.
- Responsibilities: Mount `SandboxScene` + `SandboxPanel`; no tick loop — sandbox is driven by user actions (drag to place, force animation).

**AI API endpoint:**
- Location: `src/app/api/soul-think/route.js`
- Triggers: `POST /api/soul-think` from `AIQueue.soulThinkAPI`.
- Responsibilities: Origin check, per-IP rate limit (60/min), 10KB body cap, forward to `callAnthropic`, return `{result}` or `{error}`.

## Error Handling

**Strategy:** Degrade gracefully; never let a subsystem failure freeze the sim or crash the scene.

**Patterns:**
- **AI failures** → `getFallbackThought()` resolves with a poetic stock line. Both `AIQueue._executeCall` and `soulThinkAPI` wrap calls in try/catch.
- **Render crashes** → React error boundaries: `CanvasErrorBoundary` wraps `<Canvas>`, `UIErrorBoundary` wraps overlay panels (`src/ui/ErrorBoundary.jsx`).
- **Land placement** → `findLandPosition()` in `WorldEngine` retries 50 times, falls back to flat city center.
- **Quality model unavailable** → `AnthropicBridge` probes candidates once, retries with Haiku on 4xx/5xx.
- **Missing audio files** → `AudioEngine._init()` probes `/audio/sfx/birth.mp3` with `HEAD`; disables itself silently if absent.
- **Malformed save** → `SaveLoadEngine.load` is version-tagged (`version: 1`) for forward compatibility.

## Cross-Cutting Concerns

**Logging:**
- `store.addEventLog({year, text, type, timestamp})` is the canonical event feed; UI `EventLog.jsx` renders the top 50. Caps at 200 entries via slice.
- No logger library; engines use `console.*` sparingly (mostly silent on AI failures to avoid noise).

**Validation:**
- Server route validates `systemPrompt`/`userPrompt` presence, size, origin.
- No client-side schema validation; engines trust in-process calls.

**Authentication:**
- None. Single-player game. `ANTHROPIC_API_KEY` is server-only via `process.env.ANTHROPIC_API_KEY`.

**Persistence:**
- `SaveLoadEngine` serializes to `localStorage` with prefix `projectgod:`. Auto-save every 60s, manual save/load slots.

**Audio:**
- `AudioEngine` (Howler) subscribes to store via `store.subscribe` inside `GameWorld.jsx`; gated on probe for `/public/audio/` directory.

**Concurrency / Throttling:**
- `AIQueue`: `maxConcurrent = 3`, `callsThisMinute` cap = 50, resets every 60s.
- Server route: per-IP 60 req/min rolling window.
- `WorldEngine` uses year-based cooldowns (`lastInteractionCheck`, `lastBreedingCheck`, `lastDeepThink[soulId]`, `lastAmbitionUpdate[soulId]`, `coupleBirthCooldowns`) to avoid AI spam.

---

*Architecture analysis: 2026-04-15*
