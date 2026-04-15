# Coding Conventions

**Analysis Date:** 2026-04-15

## Language

**JavaScript (ESM), no TypeScript.** The entire codebase uses plain `.js` / `.jsx` with native ES modules. No `tsconfig.json`, no `.ts` files — JSDoc is not widely used either. All modules use `import` / `export` (never CommonJS `require`).

**File extensions:**
- `.js` — engine systems, data, store, API routes (e.g. `src/engine/WorldEngine.js`, `src/store/useGameStore.js`)
- `.jsx` — React components including R3F scene nodes (e.g. `src/models/humans/HumanModel.jsx`, `src/world/WorldScene.jsx`)
- `.mjs` — root tool configs (`eslint.config.mjs`, `vitest.config.mjs`)

## Naming Patterns

**Files:**
- React components: `PascalCase.jsx` — `HumanModel.jsx`, `SoulEntity.jsx`, `GameWorld.jsx`
- Engine classes / singleton modules: `PascalCase.js` — `WorldEngine.js`, `SoulMemory.js`, `AIQueue.js`
- Data / utility modules: `camelCase.js` — `llmSouls.js`, `eras.js`, `historicalEvents.js`, `godPowers.js`
- Store: `camelCase.js` with `use`-prefixed hook — `useGameStore.js`
- Tests: `<Subject>.test.js` in `src/engine/__tests__/`
- kebab-case is **not used** anywhere observed.

**Identifiers:**
- Components: `PascalCase` — `function HumanModel(...)`, `function SoulsRenderer(...)`
- Engine classes: `PascalCase` — `class AIQueueManager`, `class SoulMemory`, `class EconomySystem`
- Singleton instances: `camelCase` — `export const aiQueue = new AIQueueManager()`
- Functions / variables: `camelCase` — `buildHuman`, `animateHuman`, `findLandPosition`
- Constants (module-level frozen tables): `SCREAMING_SNAKE_CASE` — `ERA_CLOTH`, `DEFAULT_SKIN`, `LIFE_EXPECTANCY`, `THOUGHT_TYPES`, `HARVEST_MAP`
- Private-ish class members: leading underscore — `this._minuteResetInterval`, `this._processQueue()` in `src/engine/AIQueue.js`
- Soul / entity IDs: `snake_case` string literals — `soul_claude`, `soul_gemini` (in `src/data/llmSouls.js`)

## React Patterns

**Function components + hooks only.** No class components exist anywhere in `src/`. Each component that needs DOM/browser APIs begins with the `'use client'` directive (e.g. `src/models/humans/HumanModel.jsx:1`, `src/store/useGameStore.js:1`, every engine file).

**Typical component shape** (see `HumanModel.jsx:429`):
- Default export, destructured props with inline defaults: `export default function HumanModel({ position = [0,0,0], era = 'ancient', ... })`
- `useRef` for Three.js object handles (`outerRef`, `partsRef`, `timeRef`)
- `useEffect` for building/disposing imperative Three.js groups
- `useFrame` (from `@react-three/fiber`) for per-frame animation — never `requestAnimationFrame` directly in components
- Props threaded through JSX as-is; side effects isolated to refs

**Zero R3F `<primitive>` usage for built-up groups** — humans are built imperatively via `buildHuman()` and attached with `parent.add(parts.group)` inside `useEffect`, with a cleanup function that calls `disposeGroup()`.

## Engine Pattern (Singletons)

Every engine system is a class instantiated once at the module bottom and exported as a named constant. Consumers import the instance, not the class.

```js
// src/engine/AIQueue.js:212
export const aiQueue = new AIQueueManager()

// src/engine/EconomySystem.js:275
export const economySystem = new EconomySystem()

// src/engine/SoulRelations.js:218
export const relationshipManager = new RelationshipManager()

// src/engine/CityEngine.js:474       → cityEngine
// src/engine/InteractionEngine.js:363 → interactionEngine
// src/engine/PopulationSystem.js:55   → populationSystem
```

Classes themselves are also exported (named exports `AIQueueManager`, `EconomySystem`, `SoulRelationship`, `RelationshipManager`) so tests can instantiate fresh copies — see every file under `src/engine/__tests__/`.

**Rehydration contract:** stateful engines expose `toJSON()` + `rehydrate(json)` (or `fromJSON(json)`) for save/load. See `EconomySystem.toJSON/rehydrate`, `RelationshipManager.toJSON/fromJSON`, `SoulMemory.toJSON`.

## State Management

**Single Zustand store** at `src/store/useGameStore.js`:
- Created with `create((set, get) => ({...}))`, no middleware, no slices
- 40+ top-level properties (time, souls, cities, weather, eventLog, etc.) followed by 30+ action methods
- Actions named as verbs: `setPopulationStats`, `addResource`, `setWarOngoing`, `addEventLog`
- Consumers read via selectors: `useGameStore((s) => s.souls)` — full-state subscriptions are avoided in hot paths
- Engines access store imperatively via `useGameStore.getState()` / `useGameStore.setState()` from outside React

## Animation Pattern

**Stateless per-frame animation.** Canonical reference: `src/models/humans/HumanModel.jsx:227` (`animateHuman(parts, animName, t)`).

Rules observed:
1. **Reset every frame first** — `arms.L.rotation.x = 0; arms.L.rotation.z = 0; ...` before any animation branch runs. No residual state between frames.
2. **Switch on animation name** — `switch (animName) { case 'idle': ... case 'walk': ... }`. Each case writes rotations/positions for that frame only.
3. **Sine-wave driven** — motion derives from `Math.sin(t * freq) * amplitude`, where `t` is a manually accumulated time ref (`timeRef.current += delta`). No `THREE.Clock`, no `AnimationMixer`, no keyframes.
4. **Time source:** `useFrame((_state, delta) => { timeRef.current += delta; animateHuman(partsRef.current, animRef.current, timeRef.current) })` — `HumanModel.jsx:473`.
5. **Tool visibility is part of animation** — `parts.axe.visible = (animName === 'chop_tree')` etc., toggled inside `animateHuman`.
6. **Animation state read via ref** (`animRef.current`), kept in sync with the `animation` prop through a `useEffect` to stay React-Compiler-safe (`HumanModel.jsx:446`).

When adding a new animation: add a `case` to the switch, write sine-based rotations, do not add any persistent state.

## 3D Models

**Procedural Three.js primitives only — no GLTF, no FBX, no loaders.** All 41 building models and the human model are composed of:
- `THREE.BoxGeometry`, `THREE.CylinderGeometry`, `THREE.SphereGeometry`, `THREE.ConeGeometry`, `THREE.RingGeometry`
- `THREE.MeshLambertMaterial` for nearly all surfaces (see `HumanModel.jsx:24-31`)
- `MeshBasicMaterial` only for unlit overlays (e.g. the selection ring, `HumanModel.jsx:501`)
- Emissive materials for singularity-era glow (`HumanModel.jsx:101-105`)

**Build / dispose contract:** imperative groups must implement disposal. See `disposeGroup()` in `HumanModel.jsx:213` — traverses the group and calls `geometry.dispose()` and `material.dispose()` (handling material arrays). Always pair `parent.add(group)` with a cleanup returning `parent.remove(group); disposeGroup(group)`.

Shadows are opt-in per mesh: `head.castShadow = true`, `torso.castShadow = true`. Do not blanket-enable shadows on every primitive.

## Error Handling

**AI calls never throw into game logic — they fall back to poetic stubs.**

- `src/engine/AIQueue.js:78-80` — `_executeCall` catches and resolves with `getFallbackThought(soul, thoughtType)` rather than rejecting
- `src/engine/AIQueue.js:100, 104, 121, 125, 127` — `soulThinkAPI` returns fallback on non-OK HTTP, malformed JSON, and network errors
- `src/engine/AIQueue.js:201` — `getFallbackThought()` returns era-appropriate poetic strings keyed by `thoughtType`
- Rate limiting is silent: queue processing short-circuits when `callsThisMinute >= 50` or `activeCallCount >= maxConcurrent` (no throw, just defers)

**General rule:** simulation tick code catches its own errors and logs via `useGameStore.getState().addEventLog(...)`; no `try/catch` wrappers in UI components.

## AI Model Selection (Tiered)

**Two tiers, resolved in `src/engine/AnthropicBridge.js`:**
```js
const HAIKU = 'claude-haiku-4-5-20251001'
const SONNET_CANDIDATES = ['claude-sonnet-4-5-20241022', 'claude-3-5-sonnet-20241022']
const MODELS = { fast: HAIKU, quality: HAIKU /* resolved dynamically */ }
```
- **Haiku** — routine thoughts (inner monologue, conversation replies); the bulk of calls
- **Sonnet** — dramatic moments (`LAST_WORDS`, `SELF_AWARENESS`, `LIFE_DECISION`, `LOVE_CONFESSION`)
- If a `quality` call fails, `_callModel` retries once with `HAIKU` (`AnthropicBridge.js:47-48`)

When adding a new `THOUGHT_TYPES` entry in `src/engine/SoulMind.js`, default to Haiku; only promote to the quality tier when the thought is narratively one-shot and high-stakes.

## Simulation Loop (10Hz, not per-frame)

The world ticks at 10Hz via `setInterval`, decoupled from the render loop:
```js
// src/screens/GameWorld.jsx:37
const TICK_MS = 100 // 10Hz
// :41
const interval = setInterval(() => { worldEngine.tick(...) }, TICK_MS)
```
- Per-frame work (`useFrame`) is reserved for visuals (animation, camera).
- Game logic (aging, interactions, economy, AI dispatch) runs inside `worldEngine.tick()` at fixed 100 ms cadence.
- A second `setInterval` handles autosave (`GameWorld.jsx:105`).

When adding new simulation logic, hang it off `WorldEngine.tick` or a subsystem's `update(souls, ..., dt, store)` called from there — never from `useFrame`.

## Imports

- ES modules exclusively. No `require`, no dynamic `import()` except for `next/dynamic` page-level code splitting in `src/app/page.js`.
- Path alias: `@/` → `src/` (configured in `vitest.config.mjs:9-11`; Next.js resolves it through its default `jsconfig`/`tsconfig` behavior). Example: `import { LLM_SOULS } from '@/data/llmSouls'` (`WorldEngine.js:3`).
- Named exports preferred for engines, data, and hooks. Default exports reserved for React components (one per file).
- Relative imports for sibling engine files: `import { soulMind } from './SoulMind'`.

## Formatting (Prettier)

`.prettierrc`:
```json
{ "semi": false, "singleQuote": true, "trailingComma": "all", "tabWidth": 2, "printWidth": 100 }
```
- No semicolons
- Single quotes for JS strings (double quotes still used inside JSX attributes per Prettier defaults)
- Trailing commas everywhere (including function args)
- 2-space indent, 100-col target
- Run via `pnpm format` (invokes `prettier --write src/`)

## Linting (ESLint)

`eslint.config.mjs` uses the flat-config format:
```js
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettierConfig from 'eslint-config-prettier'
export default [
  ...nextCoreWebVitals,
  prettierConfig,
  { ignores: ['node_modules/', '.next/', 'out/'] },
]
```
- Extends Next.js 16 core-web-vitals rules (React hooks, Next-specific)
- `eslint-config-prettier` disables stylistic rules that conflict with Prettier — formatting is Prettier's job, not ESLint's
- Run via `pnpm lint` (invokes `eslint src/ --fix`)

## Comments

- Section headers use box-drawn dividers: `// ─── Era clothing palettes ───...` (see `HumanModel.jsx:8, 17, 20, 212, 226, 428`)
- Inline comments explain intent, not mechanics — e.g. `// Reset all rotations each frame` (`HumanModel.jsx:232`), `// 10Hz` (`GameWorld.jsx:37`)
- No JSDoc `@param`/`@returns` blocks observed. Avoid introducing them unless a public engine API deserves formal docs.

## Function Design

- Helpers live at module top (`buildHuman`, `disposeGroup`, `animateHuman` before the component)
- Early-return guards: `if (!arms.L || !arms.R || !legs.L || !legs.R) return` (`HumanModel.jsx:230`)
- Optional chaining for soul methods that may not exist yet: `soul.getRelationshipWith?.(otherSoul?.id)` (`SoulMind.js:19`)
- Nullish fallbacks: `event?.name || 'A great event'` (`SoulMind.js:8`)

## Module Design

- One responsibility per engine file; all systems singletons.
- Barrel files (`index.js` re-exports) are **not used** — import directly from the source module.
- Data modules (`src/data/*.js`) export frozen-shape constants and pure factory functions (`createChildSoul` in `llmSouls.js`).

---

*Convention analysis: 2026-04-15*
