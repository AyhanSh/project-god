<div align="center">

# ⚡ PROJECT GOD

### *You are not playing a game. You are watching life happen.*

A browser-based AI civilization simulation where every human has a real mind — powered by Claude.
Watch souls be born, fall in love, go to war, build cities, and die across 5,000 years of history.

![Project God Banner](./public/banner.png)

</div>

---

## What is this?

Project God is a civilization simulator — but unlike any other.

Every person in this world is powered by a real AI (Claude by Anthropic). They don't follow scripts. They **think**. They have personalities, goals, fears, families, and opinions. They make decisions based on what's happening around them. When a plague breaks out, some people panic. Some pray. Some become doctors. Some take advantage of it.

You are God. You can observe, nudge, or stay silent — but the world moves on its own.

The simulation spans **6 historical eras** — from ancient tribes to the modern age — and every year brings new births, deaths, discoveries, wars, and revolutions.

---

## Features

### 🧠 Real AI Minds
Each soul has a 5-layer consciousness architecture — personality, memory, desires, fears, and relationships. They make decisions through real Anthropic API calls. No two souls think alike.

### 🌍 Living 3D World
Built with Three.js and React Three Fiber. Watch a tiny village grow into a sprawling city over centuries. Buildings go up. Roads form. Cities rise and fall.

### 👤 Animated Human Models
Minecraft-style blocky characters with fully procedural animations — idle, walking, working, praying, fighting, and celebrating. Every soul has a unique aura color.

### 🏛️ 6 Historical Eras
- **Ancient** — tribes, shamans, early settlements
- **Classical** — empires, philosophers, legions
- **Medieval** — knights, plagues, cathedrals
- **Renaissance** — artists, explorers, gunpowder
- **Industrial** — factories, revolutions, steam engines
- **Modern** — technology, global conflict, the internet

### ⚡ Autonomous Events
Wars, plagues, discoveries, famines, golden ages — all trigger organically based on the world's state. Nobody scripts them. They just... happen.

### 🕹️ God Mode Controls
Intervene or observe. Send a vision. Trigger a disaster. Bless a soul. Or just watch and see what they do without you.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 |
| 3D Engine | Three.js + React Three Fiber |
| Animations | GSAP + Framer Motion |
| State | Zustand |
| AI Engine | Anthropic API (Claude Sonnet) |
| Styling | Tailwind CSS |
| Package Manager | pnpm |

---

## Installation

**Prerequisites:** Node.js 18+, pnpm, Anthropic API key

```bash
# Clone the repo
git clone https://github.com/AyhanSh/project-god.git
cd project-god

# Install dependencies
pnpm install

# Add your Anthropic API key
cp .env.example .env.local
# Then open .env.local and add:
# ANTHROPIC_API_KEY=your_key_here

# Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and watch your world come alive.

---

## How It Works

```
Year ticks forward
      ↓
World state updates (population, resources, threats)
      ↓
Each soul receives context about their life + world
      ↓
Claude generates their decision / action / thought
      ↓
Action affects world state
      ↓
Events trigger based on accumulated world state
      ↓
Repeat — forever
```

The soul's "mind" is a structured prompt containing their personality traits, current emotions, memories of recent events, relationships, and goals. Claude responds with what they do next. That action feeds back into the simulation.

---

## Project Structure

```
src/
├── app/                    # Next.js app router
├── engine/
│   ├── SoulEngine.js       # Soul lifecycle: birth → aging → death
│   ├── TimeEngine.js       # Year/era progression
│   ├── CityEngine.js       # City growth algorithms
│   ├── EventEngine.js      # Historical event triggers
│   └── AnthropicBridge.js  # AI decision layer
├── world/                  # 3D world components (R3F)
├── characters/             # Human models + animations
├── store/                  # Zustand state management
└── ui/                     # HUD, panels, menus
```

---

## Roadmap

- [x] Character models with procedural animation
- [x] 5-layer soul consciousness architecture
- [x] 3D world with terrain and city generation
- [x] 6 era visual system
- [ ] Full Anthropic API soul decisions in-browser
- [ ] Multiplayer God mode (two players, one world)
- [ ] Soul memory that persists across sessions
- [ ] Mobile support

---

## About

Built by [@AyhanSh](https://github.com/AyhanSh) [Link.me](link.me/aykhanium)as part of a tech blog / creator project exploring what happens when you give AI real agency inside a simulated world.

---

<div align="center">

**If you star this repo, a soul somewhere in the simulation gets a good harvest.**

⭐

</div>
