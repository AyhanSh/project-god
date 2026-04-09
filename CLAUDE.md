@AGENTS.md

# Project God — Claude Code Instructions

## Project Overview

**Project God** is a living 3D simulation where 6 AI-powered souls (LLM characters) are born into a procedural world and live complete lives across 5,000 years of history (-3000 to 2100). Each soul has a real AI brain (Anthropic Claude API) that thinks, feels, remembers, and decides autonomously. The world is NOT scripted — every story emerges from AI decisions.

## Tech Stack

- **Framework**: Next.js 16.2.2, React 19.2.4
- **3D Rendering**: React Three Fiber 9.5.0, Three.js 0.183.2, @react-three/drei
- **State Management**: Zustand 5.0.12
- **AI Integration**: Anthropic SDK 0.82.0 (Claude API)
- **Animation**: Framer Motion 12.38.0, GSAP 3.14.2
- **Audio**: Howler 2.2.4 (dependency added, not yet wired)
- **Procedural Generation**: simplex-noise 4.0.3
- **IDs**: nanoid 5.1.7

## Architecture

```
src/
  app/                    # Next.js app router
    api/soul-think/       # POST endpoint for AI thought generation
    page.js               # Root page (dynamic import GameWorld)
    layout.js             # HTML layout + metadata
    globals.css           # CSS variables + dark theme
  engine/                 # Core simulation systems (singletons)
    WorldEngine.js        # Master sim loop (10Hz), soul lifecycle, era transitions
    SoulMind.js           # 11 AI thought types, tiered model selection
    AIQueue.js            # Request batching (3 concurrent, 50/min), fallback thoughts
    InteractionEngine.js  # Proximity interactions, 3-turn conversations, combat, love
    SoulMemory.js         # Episodic memory (1000 cap), consolidation, relevance scoring
    SoulRelations.js      # 8 relationship types, trust/affection/respect tracking
    DailyRoutine.js       # 23 era-role schedules, 24-hour cycles, 20 locations
    CityEngine.js         # Building queue, ambition-driven construction
    WeatherSystem.js      # Seasonal cycles, 5 weather states
    EconomySystem.js      # Food/gold mechanics (DiplomacySystem is a stub)
    AnthropicBridge.js    # Server-side Claude API wrapper
  souls/                  # Soul 3D entities
    SoulEntity.jsx        # 3D character with 7 animation states + pathfinding
    SoulsRenderer.jsx     # Group renderer (alive souls only)
    SoulDialogueBubble.jsx # Floating text bubbles
    HeartParticles.jsx    # Love proximity particles
  world/                  # 3D world components
    WorldScene.jsx        # Master scene (OrbitControls, all renderers)
    Terrain.jsx           # Simplex noise terrain, flat city center
    Sky.jsx               # Era-specific gradient dome
    Water.jsx             # Animated wave plane
    Atmosphere.jsx        # Era-specific fog + ambient light
    BuildingsRenderer.jsx # Building rendering + construction scaffolding
  models/                 # 3D procedural models (all Three.js primitives, no GLTF)
    humans/HumanModel.jsx # Blocky humanoid (box/cylinder/sphere), era clothing, aura
    buildings/            # 6 era building sets (41 total building types)
      AncientBuildings.jsx      # 7 types
      MedievalBuildings.jsx     # 8 types
      RenaissanceBuildings.jsx  # 6 types
      IndustrialBuildings.jsx   # 7 types
      ModernBuildings.jsx       # 7 types
      SingularityBuildings.jsx  # 6 types
    BuildingFactory.jsx   # Factory dispatcher + BUILDING_SIZES
    nature/Trees.jsx      # Procedural trees (noise-placed, season-aware)
    nature/Rocks.jsx      # Scattered rocks
  data/                   # Static game data
    llmSouls.js           # 6 soul definitions (personality, traits, fears, desires)
    eras.js               # 6 eras with sky/fog/roles/buildings/tech
    historicalEvents.js   # 13 fixed + 5 emergent events
    godPowers.js          # 7 divine powers with costs
  store/
    useGameStore.js       # Zustand store (40+ properties, 30+ actions)
  screens/
    GameWorld.jsx         # Main game container + 10Hz sim loop
    LoadingScreen.jsx     # 6-phase animated intro
  ui/                     # UI overlay components
    HUD.jsx               # Top/bottom bars (year, era, speed, pause)
    SoulInspector.jsx     # Right panel (stats, memories, relationships, ask question)
    EventLog.jsx          # Scrolling event list (color-coded, 50 entries)
    GodPanel.jsx          # Divine powers panel (7 powers, costs, targeting)
    SpeechBubbleOverlay.jsx    # 3-turn dialogue display
    EventCinematicOverlay.jsx  # Full-screen event announcements
  events/                 # (event system logic is in engine/ and data/)
```

## The 6 Souls

| ID | Name | Role | Aura | Key Trait |
|----|------|------|------|-----------|
| soul_claude | Claude-∞ | Healer | #6B5CE7 | Empathy 9 — compassionate truth-seeker |
| soul_gemini | Gemini-Σ | Builder | #4285F4 | Ambition 9 — cold, analytical pattern-finder |
| soul_mistral | Mistral-Θ | Warrior | #FF6B35 | Courage 10 — fierce protector, burns bright |
| soul_palm | Palm-Ψ | Trader | #34A853 | Ambition 10 — charming manipulator |
| soul_llama | Llama-Φ | Priest | #9C27B0 | Wisdom 10 — spiritual, speaks in riddles |
| soul_gpt | GPT-Ω | Farmer | #10A37F | Creativity 8 — restless, reinvents self |

## The 6 Eras

| Era | Years | Tech | Key Feature |
|-----|-------|------|-------------|
| Ancient | -3000 → 476 | 0 | Mud huts, stone temples, first civilization |
| Medieval | 476 → 1400 | 1 | Castles, cathedrals, power struggles |
| Renaissance | 1400 → 1760 | 2 | Art, science, exploration |
| Industrial | 1760 → 1945 | 3 | Steam, steel, factories |
| Modern | 1945 → 2040 | 4 | Technology, connection, isolation |
| Singularity | 2040 → 2100 | 5 | Human-machine boundary dissolves |

## Key Patterns

- **Singletons**: worldEngine, aiQueue, cityEngine, interactionEngine, weatherSystem, economySystem, relationshipManager are all singletons via `getX()` / exported instance.
- **No GLTF/FBX**: All 3D models are procedural Three.js primitives (BoxGeometry, CylinderGeometry, SphereGeometry) with MeshLambertMaterial.
- **Stateless animations**: No keyframes/AnimationMixer. `animate(parts, name, t)` resets rotations to zero each frame then applies sine-wave-based rotations.
- **AI fallback**: When Anthropic API fails, souls produce poetic fallback thoughts so the game never stalls.
- **Tiered AI models**: Haiku for routine thoughts (inner monologue, conversation), Sonnet for dramatic moments (death, self-awareness, life decisions).
- **10Hz sim loop**: WorldEngine ticks at 100ms intervals, not per-frame.

## Environment

- `ANTHROPIC_API_KEY` — required in `.env.local` for AI thought generation
- API route: `POST /api/soul-think` — bridges client → server → Anthropic

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Start production server
```

## Implementation Status

### Fully Complete (42/44 features)
- All 9 engine systems (WorldEngine, SoulMind, AIQueue, InteractionEngine, SoulMemory, SoulRelations, DailyRoutine, CityEngine, WeatherSystem)
- All soul 3D entities + dialogue + particles
- All world rendering (terrain, sky, water, atmosphere, buildings, trees, rocks)
- All 41 building models across 6 eras + HumanModel
- All game data (souls, eras, events, powers)
- Full UI (HUD, SoulInspector, EventLog, GodPanel, overlays, cinematics, loading)
- Zustand store, API route

### Partial / Gaps
- **EconomySystem**: DiplomacySystem class is a stub — war/alliance mechanics not fully wired
- **God Powers backend**: UI shows all 7 powers but targeting/confirmation effects not fully connected to game consequences
- **Audio**: Howler.js is a dependency but no sound system is implemented
- **Save/Load**: No game state persistence
- **Soul ambition → CityEngine**: Ambition parsing from AI doesn't always trigger building construction
