# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:** Vitest 4.1.4
- Config: `vitest.config.mjs`
- Environment: `jsdom` (configured via `test.environment: 'jsdom'`)
- Path alias: `@` → `src/` (matches Next.js resolution)
- No separate setup file configured; no global setup hooks.

**Assertion library:** Vitest's built-in `expect` (Jest-compatible API). `@testing-library/jest-dom` and `@testing-library/react` are installed as devDependencies but **not yet used** by any test (no DOM component tests exist).

**Run commands** (from `package.json:11`):
```bash
pnpm test           # runs `vitest run` — single-shot, no watch
```
No `test:watch`, `test:coverage`, or `test:ui` scripts exist. To watch or gather coverage, invoke Vitest directly: `pnpm exec vitest` or `pnpm exec vitest run --coverage` (a coverage provider is not currently installed — would need `@vitest/coverage-v8`).

## Test File Organization

**Location:** `src/engine/__tests__/` (a single co-located test directory for engine systems).

**Current test files:**
- `src/engine/__tests__/SoulMemory.test.js` — 88 lines, 8 specs
- `src/engine/__tests__/EconomySystem.test.js` — 132 lines, 10 specs (covers both `EconomySystem` and `DiplomacySystem`)
- `src/engine/__tests__/SoulRelations.test.js` — 123 lines, 11 specs (covers `SoulRelationship` and `RelationshipManager`)
- `src/engine/__tests__/DailyRoutine.test.js` — 72 lines, 13 specs (covers `getGameHour`, `getSoulSchedule`, `getCurrentScheduleEntry`)

**Naming:** `<SubjectClassOrModule>.test.js`. The tested file always lives one directory up at `src/engine/<Subject>.js`.

**Structure:** each file imports via relative path `from '../<Subject>'` (not the `@/engine/...` alias) and groups specs under one or more top-level `describe` blocks keyed by class/function name.

## Test Structure

**Canonical pattern** (from `src/engine/__tests__/SoulRelations.test.js`):
```js
import { describe, it, expect } from 'vitest'
import { SoulRelationship, RelationshipManager } from '../SoulRelations'

describe('SoulRelationship', () => {
  it('starts as stranger with zero stats', () => {
    const rel = new SoulRelationship('a', 'b')
    expect(rel.type).toBe('stranger')
    expect(rel.trust).toBe(0)
  })
  // ...
})
```

Observed conventions:
- Explicit imports from `'vitest'` — `describe, it, expect, beforeEach, vi` as needed. No globals relied on.
- `it` over `test`. Spec names are full sentences starting with a verb (`'stores and retrieves episodic memories'`, `'clamps values between -100 and 100'`).
- Arrange/Act/Assert is inlined per spec — no shared helpers, no custom matchers.
- `beforeEach(() => { econ = new EconomySystem() })` pattern used only in `EconomySystem.test.js:26-28` and `:97-99`; other files construct fresh instances inside each `it` block.
- No `afterEach` / teardown — engines are pure JS with no global state leak between specs (the one exception is mocked below).

## Mocking

**Used once**, in `src/engine/__tests__/EconomySystem.test.js:5-21`, to stub the Zustand store that `EconomySystem.harvestResource` reaches into:
```js
vi.mock('@/store/useGameStore', () => {
  let resources = { wood: 0, stone: 0, ore: 0 }
  return {
    useGameStore: {
      getState: () => ({
        addResource: (type, amount) => { resources[type] = (resources[type] || 0) + amount },
        foodSupply: 100,
        setWarOngoing: vi.fn(),
        addEventLog: vi.fn(),
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    },
    _getResources: () => resources,
    _resetResources: () => { resources = { wood: 0, stone: 0, ore: 0 } },
  }
})
```
Notes on this style:
- Uses the `@/` alias for the mock target (Vitest resolves it via `vitest.config.mjs`).
- Returns a synchronous module factory that mirrors the store's `getState` / `setState` / `subscribe` shape.
- Exposes non-public `_getResources` / `_resetResources` helpers for tests that want to read back writes.
- `vi.fn()` is used for anything whose return value the test does not care about.

**What is not mocked:** `SoulMemory`, `SoulRelations`, `DailyRoutine` tests operate entirely on plain JS classes/functions with no external dependencies — no Anthropic SDK calls, no store access, no Three.js. This is intentional: engines are designed to be instantiable without side effects.

**What tests avoid mocking:** the Anthropic API, `fetch`, `setInterval`, and Three.js. No fake timers are used anywhere.

## Fixtures and Factories

No shared fixtures directory. Test data is built inline per spec, usually as small object literals:
```js
const souls = [
  { isAlive: true, happiness: 50, stress: 30, health: 80,
    role: 'Farmer', currentActivity: 'work', currentLocation: 'farm' },
]
```
(`EconomySystem.test.js:36-38`)

Array factories via `Array.from({ length: 20 }, () => ({...}))` for population-stress tests (`EconomySystem.test.js:48-51`).

No `beforeAll` snapshots, no golden files, no fixture JSON under `src/engine/__tests__/`.

## Coverage

**No coverage enforcement.** No `coverage` block in `vitest.config.mjs`, no coverage provider installed, no CI gate. Coverage is **thin in absolute terms**: only 4 of ~20 engine modules have tests, and no UI, API route, data, store, or R3F component has a single test.

**View coverage** (would require installing a provider first):
```bash
pnpm add -D @vitest/coverage-v8
pnpm exec vitest run --coverage
```

## Test Types

**Unit tests only.** Every existing spec exercises a single class or pure function with direct instantiation and synchronous assertions.

**Integration tests:** none. `WorldEngine.tick` orchestrates most systems but has no integration test validating the 10Hz loop end-to-end.

**API route tests:** none. `src/app/api/soul-think/route.js` is untested; its Anthropic bridge (`src/engine/AnthropicBridge.js`) is also untested.

**Component tests:** none. `@testing-library/react` + `jsdom` are available but unused — no `.test.jsx` files exist.

**E2E tests:** none. No Playwright/Cypress/similar is installed.

## Common Patterns

**Async testing:** not currently needed — every engine method under test is synchronous. If adding async specs, prefer native `async/await`:
```js
it('enqueues and resolves a thought', async () => {
  const result = await aiQueue.enqueue(soul, 'EVENT_REACTION', {}, 5)
  expect(result).toBeDefined()
})
```

**Error testing:** no `expect(...).toThrow()` usage yet — engines are designed to not throw (see AI fallback pattern in `src/engine/AIQueue.js`). If testing the fallback path, assert the fallback string shape, not that an error was raised.

**Serialization round-trips** are a recurring pattern — every persistable class is tested with `toJSON` → fresh instance → `rehydrate/fromJSON` → deep-equal-ish assertions:
- `EconomySystem.test.js:82-91` (`EconomySystem.toJSON/rehydrate`)
- `EconomySystem.test.js:122-131` (`DiplomacySystem.toJSON/rehydrate`)
- `SoulRelations.test.js:109-122` (`RelationshipManager.toJSON/fromJSON`)
- `SoulMemory.test.js:78-86` (`SoulMemory.toJSON`)

**Clamp / invariant tests** — ranges are asserted explicitly (`SoulRelations.test.js:66-75` for [-100, 100] clamping). When adding numeric systems, follow this: set the stat near the edge, fire an interaction that would overshoot, assert the bound holds.

**State-transition tests** — relationship-type transitions are verified by setting prerequisite stats then firing one interaction (`SoulRelations.test.js:30-57`). Mirror this when testing other finite-state systems.

## Gaps (honest list)

- **Most engines have zero tests**: `WorldEngine`, `SoulMind`, `AIQueue`, `InteractionEngine`, `CityEngine`, `WeatherSystem`, `PopulationSystem`, `CampfireRegistry`, `HeightmapRegistry`, `SaveLoadEngine`, `GodPowerEngine`, `SoulBehavior`, `AudioEngine`, `AnthropicBridge`.
- **Zero UI tests** — `HUD`, `SoulInspector`, `GodPanel`, `OnboardingOverlay`, `DiplomacyPanel`, `ErrorBoundary`, etc.
- **Zero API route tests** — `src/app/api/soul-think/route.js` is not exercised.
- **Zero R3F / Three.js rendering tests** — the animation system (`animateHuman`), model builders, and scene composition are untested.
- **Zero store tests** — `useGameStore` actions are not unit-tested.
- **No CI config** observed (no `.github/workflows/`), so tests are only run locally on demand.
- **No coverage tooling** installed or configured.

---

*Testing analysis: 2026-04-15*
