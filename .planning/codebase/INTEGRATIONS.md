# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**AI / LLM (sole external service):**
- **Anthropic Claude API** — Powers all 6 soul "minds". The entire game loop depends on this single integration.
  - Endpoint: `https://api.anthropic.com/v1/messages` (hardcoded in `src/engine/AnthropicBridge.js` line 65)
  - SDK dependency: `@anthropic-ai/sdk` `^0.82.0` declared in `package.json` but NOT imported — the bridge uses raw `fetch` with headers `x-api-key`, `anthropic-version: 2023-06-01`.
  - Auth: `ANTHROPIC_API_KEY` env var, read server-side only (`process.env.ANTHROPIC_API_KEY` in `src/engine/AnthropicBridge.js` line 21).
  - Tiered model selection (see `src/engine/AnthropicBridge.js` lines 6–15):
    - `HAIKU = 'claude-haiku-4-5-20251001'` — `fast` tier. Used for routine thoughts (inner monologue, conversation turns, ambient decisions). Bulk of calls.
    - `QUALITY_CANDIDATES = ['claude-sonnet-4-5-20241022', 'claude-3-5-sonnet-20241022']` — `quality` tier. Probed once on first quality call; first reachable candidate wins, result cached in `MODELS.quality`. Falls back to Haiku if both probes fail.
  - Tier selection logic in `src/engine/AIQueue.js` lines 195–199 (`getModelTier`): `quality` is requested only for dramatic thought types — `last_words`, `self_awareness`, `god_communication`, `god_question`, `love_confession`, `life_decision`. Every other thought type uses `fast` (Haiku).
  - Quality → Haiku fallback: if the quality model call fails mid-request, `callAnthropic` automatically retries with Haiku (`src/engine/AnthropicBridge.js` lines 46–55).
  - Offline fallback: if `/api/soul-think` returns non-OK or throws, the client substitutes a poetic `getFallbackThought` (`src/engine/AIQueue.js` lines 120–128, 201–210) so the simulation never stalls.

## Data Storage

**Databases:**
- None. Project is fully in-memory.

**File Storage:**
- Local filesystem only. Static assets served from `public/` by Next.js.

**Caching:**
- In-process only:
  - Per-IP rate-limit map in `src/app/api/soul-think/route.js` (lines 4–31) — 60 req/min/IP, swept every 5 minutes
  - Quality-model probe result cached in module scope of `src/engine/AnthropicBridge.js` (`_qualityProbed`, `MODELS.quality`)
  - Soul memories, relationships, world state cached in Zustand store (`src/store/useGameStore.js`)

**Persistence:**
- No save/load system implemented. `src/engine/SaveLoadEngine.js` exists but no DB/filesystem writes occur. All state is lost on refresh.

## Authentication & Identity

**Auth Provider:**
- None. No user accounts, no sessions, no OAuth, no JWT. The game is single-player local.

**API Route Protection (`/api/soul-think`):**
Lightweight defenses only — see `src/app/api/soul-think/route.js`:
- Origin/host equality check (lines 36–40) — rejects cross-origin requests with 403
- Per-IP rate limit — 60 requests / 60 s window, keyed on `x-forwarded-for` → `x-real-ip` → `'unknown'` (lines 43–51)
- Body size cap — 10 KB via `content-length` header and `body.length` (lines 53–62)
- Required fields validation — 400 if `systemPrompt` or `userPrompt` missing (lines 66–68)

## Monitoring & Observability

**Error Tracking:**
- None. Errors are swallowed silently in several places:
  - `src/app/api/soul-think/route.js` line 79 — "Silently handle — the client falls back to offline thoughts"
  - `src/engine/AIQueue.js` catches and returns `getFallbackThought` (lines 120–128)
  - `src/engine/AudioEngine.js` swallows missing-audio errors

**Logs:**
- Ad-hoc `console.log` / `console.warn` sprinkled in engine files; no structured logger, no log shipping.

**Analytics:**
- None.

## CI/CD & Deployment

**Hosting:**
- Not configured. No `vercel.json`, no Dockerfile, no Procfile, no deploy scripts.

**CI Pipeline:**
- None. No `.github/workflows`, no `.gitlab-ci.yml`, no `.circleci/`.

**Test Runner:**
- Local only via `pnpm test` → `vitest run`. Tests in `src/engine/__tests__/` (`DailyRoutine.test.js`, `EconomySystem.test.js`, `SoulMemory.test.js`, `SoulRelations.test.js`).

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` — **Required** for AI thought generation. Read only in `src/engine/AnthropicBridge.js` line 21. Absence causes `/api/soul-think` to throw, which gracefully degrades to fallback thoughts on the client.

**Optional env vars:**
- None detected in source. No `process.env.*` references outside `ANTHROPIC_API_KEY`.

**Secrets location:**
- `.env.local` (gitignored; existence confirmed, contents never inspected)
- `.env.example` (committed template)

**Server-only boundary:**
- The Anthropic API key never touches the client. All Claude calls flow through `POST /api/soul-think` → `callAnthropic()` → `fetch('https://api.anthropic.com/v1/messages')`. Client code (e.g., `src/ui/SoulInspector.jsx` line 98, `src/engine/AIQueue.js` line 108) only calls the relative `/api/soul-think` endpoint.

## API Routes (Internal)

**`POST /api/soul-think`** — `src/app/api/soul-think/route.js`
- Accepts JSON: `{ systemPrompt, userPrompt, maxTokens, model }` where `model` is `'fast'` or `'quality'` (defaults to `'fast'`).
- Returns: `{ result: string }` on success or `{ error: string }` with 400/403/413/429/500.
- Consumers:
  - `src/engine/AIQueue.js` line 108 — batched soul thought generation (max 3 concurrent, 50/min internal cap)
  - `src/ui/SoulInspector.jsx` line 98 — "Ask the soul a question" feature (God → soul direct dialogue, `maxTokens: 150`)

## Webhooks & Callbacks

**Incoming:** None.
**Outgoing:** None.

## Audio Assets

**Static audio served from `public/audio/`:**
- `public/audio/sfx/` — 10 event-triggered MP3s: `birth.mp3`, `death.mp3`, `combat.mp3`, `marriage.mp3`, `era_change.mp3`, `building_complete.mp3`, `lightning.mp3`, `plague.mp3`, `god_power.mp3`, `blessing.mp3`
- `public/audio/ambient/` — 6 looping era ambiences: `ancient.mp3`, `medieval.mp3`, `renaissance.mp3`, `industrial.mp3`, `modern.mp3`, `singularity.mp3`
- `public/audio/soul-think/` — Directory present, currently empty (reserved for future per-soul TTS or think-sound cues)

**Loader:** `src/engine/AudioEngine.js` probes `/audio/sfx/birth.mp3` with a HEAD request before instantiating Howl objects (lines 26–35) to avoid noisy 404s. If the probe fails, the engine runs in silent mode — no external audio CDN, no streaming.

---

*Integration audit: 2026-04-15*
