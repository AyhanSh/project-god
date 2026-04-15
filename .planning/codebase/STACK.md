# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- JavaScript (ES Modules, `.js` / `.mjs`) — All engine logic in `src/engine/*.js`, API route in `src/app/api/soul-think/route.js`, Zustand store in `src/store/useGameStore.js`
- JSX (React 19) — All components in `src/**/*.jsx` (screens, ui, world, souls, models)

**Secondary:**
- CSS — Global theme in `src/app/globals.css`
- JSON/YAML — Config: `package.json`, `pnpm-workspace.yaml`, `jsconfig.json`

**Not Used:**
- TypeScript — Project is pure JavaScript. Path aliases configured via `jsconfig.json` only (no `tsconfig.json`).

## Runtime

**Environment:**
- Node.js — Required by Next.js 16; no `.nvmrc` pinned
- Browser (client-side) — React 19 with `'use client'` directives on all interactive modules (`src/screens/GameWorld.jsx`, `src/engine/AudioEngine.js`, `src/engine/AIQueue.js`)

**Package Manager:**
- pnpm — Lockfile `pnpm-lock.yaml` present; workspace declared in `pnpm-workspace.yaml` with `ignoredBuiltDependencies: [sharp, unrs-resolver]`

## Frameworks

**Core:**
- `next` `16.2.2` — App Router. Entry: `src/app/page.js`, `src/app/layout.js`. Config: `next.config.mjs` (enables `reactCompiler: true`).
- `react` `19.2.4` / `react-dom` `19.2.4` — React 19 with React Compiler via `babel-plugin-react-compiler` `1.0.0`.

**3D / Rendering:**
- `three` `^0.183.2` — Core WebGL engine, used throughout `src/models/**`, `src/world/**`
- `@react-three/fiber` `^9.5.0` — React renderer for Three.js. Canvas root in `src/world/WorldScene.jsx`.
- `@react-three/drei` `^10.7.7` — Helpers (OrbitControls, etc.) used in `src/world/WorldScene.jsx`, `src/world/FlyCamera.jsx`

**State Management:**
- `zustand` `^5.0.12` — Single store at `src/store/useGameStore.js`

**Animation:**
- `framer-motion` `^12.38.0` — UI animations in `src/ui/*.jsx`, `src/screens/LoadingScreen.jsx`
- `gsap` `^3.14.2` + `@gsap/react` `^2.1.2` — Cinematic timelines

**Audio:**
- `howler` `^2.2.4` — Wired via `src/engine/AudioEngine.js` (Howl + Howler global mute). Loads `/audio/sfx/*.mp3` and `/audio/ambient/*.mp3` on demand.

**Procedural:**
- `simplex-noise` `^4.0.3` — Terrain heightmap, tree/rock scatter (`src/world/Terrain.jsx`, `src/models/nature/*`)
- `nanoid` `^5.1.7` — ID generation for souls/events/memories

**AI SDK:**
- `@anthropic-ai/sdk` `^0.82.0` — Listed as dependency; actual calls use raw `fetch` to `https://api.anthropic.com/v1/messages` (see `src/engine/AnthropicBridge.js` line 65). SDK is currently not imported anywhere.

**Testing:**
- `vitest` `^4.1.4` — Runner. Config: `vitest.config.mjs` (jsdom environment, `@/*` alias → `src/*`). Tests live in `src/engine/__tests__/*.test.js`.
- `@testing-library/react` `^16.3.2`, `@testing-library/jest-dom` `^6.9.1`, `jsdom` `^29.0.2`

**Build / Lint / Format:**
- `eslint` `^9.39.4` + `eslint-config-next` `^16.2.3` + `eslint-config-prettier` `^10.1.8` — Flat config at `eslint.config.mjs` (ignores `node_modules/`, `.next/`, `out/`)
- `prettier` `^3.8.2` — Config at `.prettierrc`: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`, `printWidth: 100`
- `babel-plugin-react-compiler` `1.0.0` — Enables React 19 compiler optimizations

## Key Dependencies

**Critical (simulation cannot run without):**
- `next` `16.2.2` — Hosts both client UI and the `/api/soul-think` route
- `@react-three/fiber` `^9.5.0` + `three` `^0.183.2` — All world rendering
- `zustand` `^5.0.12` — Central mutable world state consumed by UI and engine
- `@anthropic-ai/sdk` `^0.82.0` — Declared for Claude API (actual implementation uses raw `fetch`)

**Infrastructure:**
- `simplex-noise` — Deterministic world generation
- `nanoid` — Event/memory/soul IDs
- `howler` — Audio subsystem (graceful degradation if assets missing)

## Configuration

**Environment:**
- `.env.local` — Holds `ANTHROPIC_API_KEY` (required by `src/engine/AnthropicBridge.js` line 21). Contents never read by tooling.
- `.env.example` — Template checked into repo (contents not inspected here; existence only)

**Build / Framework:**
- `next.config.mjs` — Minimal config, only enables `reactCompiler: true`
- `jsconfig.json` — Path alias `@/*` → `./src/*`
- `vitest.config.mjs` — Mirrors `@/*` alias; `environment: 'jsdom'`

**Code Quality:**
- `eslint.config.mjs` — Flat config extending `eslint-config-next/core-web-vitals` + `eslint-config-prettier`
- `.prettierrc` — Project-wide formatting rules
- No `tsconfig.json` — JavaScript-only project

**Package Manager:**
- `pnpm-workspace.yaml` — Declares `ignoredBuiltDependencies: [sharp, unrs-resolver]`
- `pnpm-lock.yaml` — Committed for reproducible installs

## Platform Requirements

**Development:**
- Node.js compatible with Next.js 16 (Node 20+)
- pnpm installed globally
- `ANTHROPIC_API_KEY` set in `.env.local` (without it, `/api/soul-think` returns 500 and the client transparently falls back to poetic offline thoughts — see `src/engine/AIQueue.js` `getFallbackThought`)

**Production:**
- Any Node.js host running `pnpm build && pnpm start`
- No container / Dockerfile / CI pipeline checked in
- Static audio assets served from `public/audio/**` by Next.js

## Commands

```bash
pnpm dev        # next dev
pnpm build      # next build
pnpm start      # next start
pnpm lint       # eslint src/ --fix
pnpm format     # prettier --write src/
pnpm test       # vitest run
```

---

*Stack analysis: 2026-04-15*
