# CONCERNS — Project God Codebase Audit

**Analysis Date:** 2026-04-15
**Working directory:** `/Users/aykhan.shahbazov/Desktop/Dev/project-god`

## Stubs & Incomplete Systems (Verified)

### DiplomacySystem — partially wired, not a stub any more
- **File:** `src/engine/EconomySystem.js` (lines 62–243)
- Status: Has alliances, wars, treaties, leader election, serialization (toJSON/rehydrate). Wars are triggered by civil unrest or by historical events via `WorldEngine._triggerWarCombat` (`src/engine/WorldEngine.js:658-683`), which drives `interactionEngine._triggerCombat`.
- **Concern:** War effects are cosmetic-only — happiness/stress decrements (`EconomySystem.js:135-140`), no resource loss, no building destruction, no territory. Alliance compatibility rule `a.role !== b.role` (line 173) is naive. Leader influence is boosted by +20 on each "rise" detection (line 85) which can stack if the winning soul flip-flops.
- **File:** `src/ui/DiplomacyPanel.jsx` exists and reads state directly from singletons (`diplomacySystem.getAlliances()`), which means panel does NOT re-render on changes — only on Zustand subscription triggers from other state.

### God Powers — fully wired
- **File:** `src/engine/GodPowerEngine.js` (all 7 powers: lightning, speak, bless, plague, accelerate, matchmake, reveal)
- Every power has real consequences: lightning calls `worldEngine._killSoul`, plague drops all health 20–50, matchmake boosts `relationshipManager` affection/trust, reveal gates on Singularity era.
- **Concern:** `godFavor` cost is stored in store (`src/store/useGameStore.js:60`) but `GodPowerEngine.invoke` never checks or deducts it — powers appear to be free. `godPowerCooldown` map also never touched by engine.

### Audio — wired, files present
- **File:** `src/engine/AudioEngine.js` — Howler is imported and used. 10 SFX + 6 ambient loops exist in `public/audio/sfx/` and `public/audio/ambient/`.
- Probe via `fetch('/audio/sfx/birth.mp3', { method: 'HEAD' })` guards against missing assets cleanly.
- **Subscription wiring:** `src/screens/GameWorld.jsx:78-102` subscribes to store and plays SFX on new event log entries keyed by `latest.timestamp`. **Concern:** `latest.timestamp` is not set reliably — most call sites in `addEventLog` do not populate a `timestamp` field, so `latest.timestamp !== lastEventTimestamp` comparison is comparing `undefined !== 0` (true once) then `undefined !== undefined` (false) — SFX fire only on the very first event, then never again. This is a silent regression.
- **Concern:** `AudioEngine.playAmbient(state.currentEra)` is called with the era *id string* ('ancient', 'medieval', etc.) — that matches `ERA_IDS`, so that path works. But `SandboxWorld.jsx` does not call `audioEngine` at all, so sandbox is silent by design.

### Save/Load — wired, durability weak
- **File:** `src/engine/SaveLoadEngine.js`. Uses `localStorage` with `projectgod:` prefix. Schema `version: 1` is written but never checked on load — no migration path.
- Auto-save every 60s via `setInterval` in `GameWorld.jsx:105-109`.
- **Concerns:**
  - `localStorage` has a ~5 MB ceiling. A single WorldEngine snapshot includes up to 100 souls × episodic memories (up to 1000 each capped in `SoulMemory`) — can balloon past the quota. Failure is caught but only returns `{ success: false, reason }`; the user sees nothing.
  - `worldEngine.toJSON()` (`WorldEngine.js:738-754`) does not persist `warEndYear` correctly in the ordering if war starts mid-save (checked: line 752 does write it — actually fine).
  - `SaveLoadEngine.save` imports `diplomacySystem` (`EconomySystem.js`) but rehydrate passes `worldEngine.getSouls()` after `worldEngine.rehydrate(...)` — correct order.
  - **Bug:** `populationSystem` is never saved or loaded. `totalBorn/totalDied/generationStats` is lost across reloads (`PopulationSystem.js:44-52` has toJSON/rehydrate but no caller).
  - No UI in `GameWorld.jsx` surfaces save success/failure — auto-save is silent; manual save/load has no panel.

## Large Uncommitted Change Set

- **Scale:** ~30 modified + 10 new files. Includes core loop files (`WorldEngine.js` 811 LOC, `SoulBehavior.js` 362 LOC, `GameWorld.jsx` 147 LOC).
- **New engine modules** (all singletons, add global mutable state):
  - `src/engine/CampfireRegistry.js` (`campfires` Map shared globally)
  - `src/engine/HeightmapRegistry.js` (shared 1 MB Float32Array, generated at module load — top-level `generateHeightmap(WORLD_SEED)` runs on import, penalising SSR cost/cold start)
  - `src/engine/PopulationSystem.js` (singleton counters)
  - `src/engine/SoulPositionRegistry.js` (22 LOC live position cache)
  - `src/engine/ResourceNodeRegistry.js`
  - `src/engine/SoulActionIntent.js` (370 LOC — new action resolver)
- **New UI:** `src/ui/DiplomacyPanel.jsx`, `src/ui/OnboardingOverlay.jsx`, `src/ui/ErrorBoundary.jsx`, `src/world/CampfireRenderer.jsx`.
- **Merge risk:** WorldEngine now depends on CampfireRegistry, PopulationSystem, HeightmapRegistry, SoulPositionRegistry, SoulActionIntent, SoulBehavior — cross-module dependency graph is broad. One bad commit in any singleton silently breaks the tick loop.
- **No staged/committed safety net:** None of these changes have been verified in CI (no CI exists).

## Test Coverage — Just Added, Minimal

- **File:** `vitest.config.mjs` with `jsdom` env and `@` alias.
- **Tests exist:** `src/engine/__tests__/DailyRoutine.test.js` (72 lines), `EconomySystem.test.js` (132 lines), `SoulMemory.test.js` (87 lines), `SoulRelations.test.js` (123 lines). ~414 LOC of tests against ~4947 LOC of engine code — roughly 8%.
- **Critical untested surfaces:**
  - `WorldEngine.js` (811 LOC) — no tests. Core tick loop, death, birth, aging, event firing — all untested.
  - `SoulBehavior.js` (362 LOC) — the action decision tree. Untested.
  - `SoulActionIntent.js` (370 LOC) — untested.
  - `CityEngine.js` (474 LOC, including ambition mapping) — untested.
  - `AIQueue.js` — rate-limiter, fallback, queue priority — untested.
  - `SaveLoadEngine.js` — untested. Save/load round-trip bugs will only surface in play.
  - `GodPowerEngine.js` — untested.
  - `InteractionEngine.js` (363 LOC) — untested.
- **No snapshot/E2E for React components** — `@testing-library/react` is in devDependencies but no component test exists.
- **Run command:** `pnpm test` → `vitest run`.

## AI Cost & Rate-Limit Risk

- **File:** `src/engine/AIQueue.js`.
- **Limits:** 3 concurrent calls, 50/minute in client queue (`AIQueue.js:48,51`). Client backs off when limit hit (`break` out of processing).
- **Server-side limit:** `src/app/api/soul-think/route.js` — 60 req/min per IP. Origin check requires `origin.includes(host)` (line 38) — that check is skipped when `origin` header is empty, which happens for non-CORS (same-origin) browser fetches. That's intentional but weak: anyone making a server-to-server call with no origin bypasses it.
- **Cost risk:**
  - At 10Hz sim loop and 6–100 souls, worst case is every soul thinking every tick → 600–10000 calls/min, but the client queue caps to 50/min so real ceiling is 50 × 60 = 3000 Haiku calls/hour ≈ $1–2/hour with current pricing (mostly cheap Haiku).
  - Sonnet is used for 6 dramatic thought types (`AIQueue.js:197`): `last_words`, `self_awareness`, `god_communication`, `god_question`, `love_confession`, `life_decision` — priced ~10x. A war or Singularity era can spike Sonnet usage.
  - `_qualityProbed` flag (`AnthropicBridge.js:18,27`) — the probe is one-time global; if the first probe fails intermittently, quality model never retries without a server restart. It's also not per-model-cached beyond the first hit.
  - No per-soul call budget. A broken soul stuck in `EVENT_REACTION` could monopolize the queue.
  - No observability: no cost tracking, no dashboard, no circuit breaker on sustained errors. Anthropic errors fall straight through to `getFallbackThought` (`AIQueue.js:77-79`), silently degrading the experience without any warning.

## Secret Handling

- **File:** `src/engine/AnthropicBridge.js:21` reads `process.env.ANTHROPIC_API_KEY` *server-side only*. The module is imported exclusively from `src/app/api/soul-think/route.js` (Next.js App Router server route), never from a client component.
- **Verified:** No `NEXT_PUBLIC_` prefix anywhere; `.env.local` exists (contents not inspected). `.gitignore` has `.env*` — safe.
- **Concern:** `AnthropicBridge.js` throws `new Error(\`Anthropic API error: ${response.status} ${err}\`)` (line 51, 57) and the API route re-exposes `error.message` to the client on 500 (`route.js:81`). Anthropic error bodies *can* contain policy-violation context or account info. The client then ignores it and uses fallback, but the HTTP body still leaks to anyone inspecting Network tab. Redaction/generic-error would be prudent.

## Performance Hotspots

- **Sim loop:** 10Hz (100ms) in `GameWorld.jsx:41-76`. Every tick: WorldEngine.tick + weatherSystem (20% chance) + economySystem + diplomacySystem + cityEngine → 4+ subsystem updates per tick.
- **Soul processing:** `WorldEngine._processSoulTick` runs for every soul (up to 100 via `POPULATION.MAX_TOTAL_SOULS`). Inside the per-soul loop, `buildBehaviorWorldState(this.store, this.souls, cityEngine.constructionSites)` (`WorldEngine.js:225`) is **built per soul** — N×N cost pattern. For 100 souls that's 10000 world-state reconstructions per second.
- **Interaction check:** `InteractionEngine.checkProximityInteractions` is O(N²) over alive souls (`InteractionEngine.js:32-51`). Each pair samples heightmap twice (lines 43-44). At N=100: 4950 pairs × 2 `sampleHeight` calls = ~10k lookups per interaction tick.
- **R3F scene:** Per-frame `useFrame` in every `SoulEntity` (`src/souls/SoulEntity.jsx:151`) runs:
  - `setSoulPosition`, `sampleHeight`, `sampleNormal`, proximity check on all other souls for hearts (`useMemo` depends on `currentPos.x,z` — recalcs every frame).
  - At 60 fps × 100 souls = 6000 memo re-evaluations per second, each iterating `relationshipManager.getAllForSoul` and `allSouls.find`.
- **Building rendering:** 41 building types × procedural geometry per construction site; `BuildingsRenderer.jsx` updates on store changes, buildings array grows unbounded (`useGameStore.js:26-28`).
- **Trees / rocks:** `src/models/nature/Trees.jsx` uses noise-based placement, one instance per tree — no instanced mesh visible in the snippet I read. Likely large draw-call count.
- **Heightmap:** 1 MB Float32Array generated at module load (`HeightmapRegistry.js:25` — not lazy). Blocks initial hydration.

## Fragile Areas

### Stateless animation reset (`HumanModel.jsx:227-405`)
- `animateHuman(parts, animName, t)` starts each frame by zeroing rotations on `arms.L, arms.R, legs.L, legs.R, head`. The `parts` object must keep the same identity across frames.
- **Risk:** `buildHuman` returns references; if a soul's era changes the model is rebuilt (`useEffect` in HumanModel), losing ref identity mid-frame. Current code only swaps on mount/era change, but any future hot-swap would desync.
- No early-return for unknown `animName` — silent no-op means a typo in `SoulBehavior` animation field produces a static T-pose with no warning.

### Silent AI fallbacks
- `AIQueue.js:77-79, 119-128` swallow all API errors into `getFallbackThought`. The sim keeps running, but there is no signal to the user or logs when the AI is offline. 6 poetic fallback strings repeat forever. `route.js:79` comments "Silently handle" — but that means a misconfigured API key ships to production with zero observability.

### Soul ambition → CityEngine flakiness
- **File:** `CityEngine._mapAmbitionToBuilding` (`CityEngine.js:397-427`) does keyword matching on `soul.currentAmbition.goal`. Goal strings come from LLM and may not contain the expected keywords. Fallback is random era building — this masks the "doesn't always trigger" symptom by quietly picking something else.
- `_defaultAmbitionFor` (`WorldEngine.js:786-796`) populates a sensible default when LLM hasn't produced one, which partially mitigates.
- `processedAmbitions = new Set()` (`CityEngine.js:48`) is keyed by `soul.id + '::' + goal.text` — same goal text triggers only once. If LLM returns the same ambition twice (common), second won't build. But `_communityBuild` every 5–10 years (line 95) papers over this.
- **Concern:** `processedAmbitions` Set grows unbounded across game lifetime; minor memory leak.

### Singleton reuse across game sessions
- `WorldEngine` has `getWorldEngine(store)` / `destroyWorldEngine()` (`WorldEngine.js:798-811`) but peer singletons `cityEngine`, `economySystem`, `diplomacySystem`, `relationshipManager`, `interactionEngine`, `weatherSystem`, `populationSystem`, `audioEngine`, `saveLoadEngine`, `campfires` Map, `worldHeightmap`, `soulPositionRegistry` are exported as **instance singletons with no reset**.
- **Bug:** Returning to the main menu and starting a new game will reuse the old `cityEngine.cities` (First Settlement population keeps growing), `relationshipManager` state, `diplomacySystem.alliances`, etc. `SandboxWorld.jsx:24-41` manually clears store fields but not engine singletons.

### `_qualityProbed` global (`AnthropicBridge.js:18`)
- Probes once per Node process. A dev restart doesn't clear it for running sessions; intermittent API hiccup during probe locks the app to Haiku forever.

### Economy food balance
- `EconomySystem.update` (line 28) scales `(productionRate - consumptionRate) * 0.01` — the magic 0.01 fudge means food changes at geological rates. At 10Hz × 6 souls, food supply barely moves. This likely stalls famine mechanics in practice.

### `happiness` mutation inconsistency
- `EconomySystem` mutates `soul.happiness` directly (`EconomySystem.js:41-46`) bypassing any store update or event log. `DiplomacySystem` does the same (lines 137, 148). `WorldEngine` treats soul state as the source of truth and only pushes via `setSouls([...this.souls])` — so UI reflects these mutations, but any React consumer reading a memoized slice can become stale.

## Browser-Only Assumptions

- **Verified OK:** `src/app/page.js` uses `dynamic(() => import('@/screens/GameWorld'), { ssr: false })` and same for `SandboxWorld`. R3F scenes never reach SSR.
- **Concern:** `src/engine/HeightmapRegistry.js:25` eagerly generates the heightmap at module import **without** an `'use client'` guard on the module export itself (the file has `'use client'` at line 1). It's imported transitively from `WorldEngine`, `CityEngine`, `SoulEntity`, `WorldScene`. If any server component ever imports one of these (unlikely but possible in Next 16), module init runs on the server. The `'use client'` directive makes it a client module, so bundler should exclude it — but the top-level `generateHeightmap(WORLD_SEED)` call will run during **first client hydration**, blocking first paint by ~50–200ms (depending on noise resolution).
- `AudioEngine.js` uses `fetch()` at `_init()` — safe, deferred until first event.
- `OnboardingOverlay.jsx:17-20` does `typeof window === 'undefined'` guard — correct.

## Error Boundaries

- **File:** `src/ui/ErrorBoundary.jsx` — exports `CanvasErrorBoundary` and `UIErrorBoundary`. Both log to `console.error` and show recoverable UI.
- **Coverage:** Wrapped in `GameWorld.jsx:122-144` around `<Canvas>` and the UI overlay group. Same in `SandboxWorld.jsx:45-69`.
- **Gap:** `CanvasErrorBoundary` forces a full page reload button (`window.location.reload()`). `UIErrorBoundary` allows dismiss. Inconsistent recovery semantics.
- **Gap:** Error boundaries don't report to any telemetry — console only. Production errors invisible.
- **Gap:** `MainMenu` and `LoadingScreen` are *outside* any error boundary — a crash there locks the app at a white screen.

## Audio Integration State

- Wired end-to-end: `Howl`/`Howler` imports → engine singleton → subscribed from `GameWorld.jsx`.
- All 10 SFX files and 6 ambient loops present in `public/audio/`.
- **Blocked by:** `latest.timestamp` bug described under "Audio" above — SFX fire at most once. Ambient era-swap works because `state.currentEra !== prevEra` is a reliable trigger. Fix: set `timestamp: Date.now()` in every `addEventLog` payload (currently omitted in dozens of call sites across `WorldEngine`, `CityEngine`, `EconomySystem`, `GodPowerEngine`).

## Next.js 16 Specific Risks

Per `AGENTS.md`: "This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing any code."

Potentially-stale patterns in current code:
- `src/app/api/soul-think/route.js` uses `Response.json(...)` — OK in Next 16.
- `src/app/layout.js` exports a `metadata` object — OK.
- **No `runtime` export** on the API route — defaults to Node.js. `fetch` to Anthropic works but no explicit `export const runtime = 'nodejs'` may cause issues if Next 16 changed defaults.
- **`setInterval` at module top level** in `route.js:24-31` (rate-limit cleanup) — runs once per server process. In a serverless/edge deploy this would leak or never execute. Fine for self-hosted Node but problematic for Vercel.
- **`'use client'` directive present** in every engine file. Next 16 behaviour for `'use client'` in non-component JS modules is unchanged AFAIK but worth confirming against the bundled docs.
- **React 19 + React Compiler:** `babel-plugin-react-compiler` is in devDependencies. The per-frame `useMemo` bodies in `SoulEntity.jsx` rely on tuple dependency arrays that include computed values (`currentPos.x`). Under React Compiler these may be re-optimized; no verification that the compiler hasn't changed reactivity semantics of these memos.
- **Dynamic import without loading UI:** `dynamic(() => import('@/screens/GameWorld'), { ssr: false })` has no `loading` prop — user sees a blank screen for the JS chunk fetch. Was previously a `LoadingScreen` per CLAUDE.md; now that's gone.

## Other Concerns

### `console.error` in production
- `src/ui/ErrorBoundary.jsx` calls `console.error` (lines 17, 68) — pollutes browser devtools in production. No env guard.

### Magic numbers
- `POPULATION.MAX_RENDERED_SOULS = 100`, `MAX_TOTAL_SOULS = 100` — identical. The `isBackground` flag logic (`WorldEngine.js:140-142`) is dead code because total == rendered. Intended to cap rendering differently from sim; currently no-op.

### `setTimeout` in tick loop
- `AIQueue.js:62` — `setTimeout(() => this._processQueue(), 200)` — fire-and-forget timers accumulate if many finalizations race. No cleanup on `stop()`.

### Resource harvesting economy design flaw
- `HARVEST_MAP` in `WorldEngine.js:23-36` assigns negative rates for `craft_tools: -0.05` and `build_structure: -0.1` — meaning crafting or building **adds** wood/stone (negative of negative via `* yearsElapsed` with `harvestResource`)? Actually `harvestResource(type, amount)` calls `addResource(type, amount)` so negative amounts subtract. Check the sign convention — looks intentional (building consumes stone) but could invert if `addResource` floors at zero unexpectedly.

### Dev-mode exposure
- `src/ui/DevPanel.jsx` appears to always render in `GameWorld.jsx:141` without an env-guard. Player-facing builds will ship dev controls.

### Interaction O(N²) with water sample
- `InteractionEngine.checkProximityInteractions` samples heightmap for every pair of souls every `_checkInteractions` tick. At 100 souls = 9900 lookups/second during the pair loop.

### Memory growth
- `soul.actionLog` capped at 12 (`WorldEngine.js:288`) — good.
- `SoulMemory.episodic` — capped somewhere in `SoulMemory.js` per CLAUDE.md (1000).
- `eventLog` capped at 50 (save), but at runtime `useGameStore.addEventLog` — need to verify cap exists in the store.
- `cityEngine.processedAmbitions` — unbounded growth.
- `interactionCooldowns` (`InteractionEngine.js:12`) — keyed by soul-pair, grows with dead souls never pruned.

### Sandbox mode state pollution
- `SandboxWorld.jsx:23-41` resets store but does not stop `worldEngine` ticks, AI queue, or audio subscriptions; those all keep running until you enter `GameWorld`.

## File Paths Referenced

- `src/app/page.js`, `src/app/layout.js`, `src/app/api/soul-think/route.js`
- `src/engine/AIQueue.js`, `AnthropicBridge.js`, `AudioEngine.js`, `CampfireRegistry.js`, `CityEngine.js`, `DailyRoutine.js`, `EconomySystem.js`, `GodPowerEngine.js`, `HeightmapRegistry.js`, `InteractionEngine.js`, `PopulationSystem.js`, `SaveLoadEngine.js`, `SoulBehavior.js`, `SoulMind.js`, `WorldEngine.js`
- `src/engine/__tests__/DailyRoutine.test.js`, `EconomySystem.test.js`, `SoulMemory.test.js`, `SoulRelations.test.js`
- `src/screens/GameWorld.jsx`, `SandboxWorld.jsx`
- `src/souls/SoulEntity.jsx`, `SoulsRenderer.jsx`
- `src/models/humans/HumanModel.jsx`
- `src/ui/ErrorBoundary.jsx`, `DiplomacyPanel.jsx`, `OnboardingOverlay.jsx`, `DevPanel.jsx`
- `src/world/WorldScene.jsx`
- `src/store/useGameStore.js`
- `vitest.config.mjs`, `eslint.config.mjs`, `package.json`
