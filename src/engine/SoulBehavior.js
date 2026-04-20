'use client'

import { relationshipManager } from './SoulRelations'
import { getSoulPosition } from './SoulPositionRegistry'
import { getGameHour } from './DailyRoutine'
import { getActiveCampfires, getNearestLitCampfire } from './CampfireRegistry'

// ─── Action definitions: id → { animation, location, eraLocOverride } ────────
const ACTIONS = {
  sleep:           { animation: 'sleep',     location: 'home' },
  eat:             { animation: 'idle',      location: 'market' },
  chop_trees:      { animation: 'chop_tree', location: 'forest_edge' },
  mine_ore:        { animation: 'mine',      location: 'quarry' },
  build_structure: { animation: 'build',     location: 'construction' },
  pray:            { animation: 'pray',      location: 'temple' },
  meditate:        { animation: 'pray',      location: 'temple' },
  training:        { animation: 'fight',     location: 'barracks' },
  patrol:          { animation: 'walk',      location: 'perimeter' },
  heal:            { animation: 'pray',      location: 'temple' },
  gather_herbs:    { animation: 'work',      location: 'forest_edge' },
  trade:           { animation: 'talk',      location: 'market' },
  open_stall:      { animation: 'work',      location: 'market' },
  study:           { animation: 'work',      location: 'university' },
  teach:           { animation: 'talk',      location: 'temple' },
  craft_tools:     { animation: 'craft',     location: 'workshop' },
  work:            { animation: 'work',      location: 'farm' },
  social:          { animation: 'talk',      location: 'plaza' },
  rest:            { animation: 'idle',      location: 'home' },
  reflect:         { animation: 'pray',      location: 'home' },
  build_campfire:  { animation: 'build',     location: 'campfire_spot' },
  warm_campfire:   { animation: 'idle',      location: 'campfire_spot' },
}

// Era-specific location overrides
const ERA_LOC = {
  medieval:    { pray: 'cathedral', teach: 'cathedral', study: 'cathedral' },
  renaissance: { study: 'university', social: 'theatre' },
  industrial:  { work: 'factory', trade: 'market' },
  modern:      { work: 'office', study: 'university', social: 'park' },
  singularity: { work: 'quantum_server', study: 'mind_palace', social: 'bio_dome', meditate: 'mind_palace', pray: 'bio_dome' },
}

// ─── Scoring functions — each returns 0-100 ──────────────────────────────────

function scoreSleep(soul, hour) {
  // Night (21-5): strong drive to sleep
  const isNight = hour >= 21 || hour < 5
  let s = isNight ? 70 : 0
  // Low energy pushes toward sleep regardless of time
  if (soul.energy < 20) s += 60
  else if (soul.energy < 40) s += 25
  // Already sleeping? inertia
  if (soul.currentActivity === 'sleep') s += 20
  return s
}

function scoreEat(soul, hour) {
  // Meal times: morning(7), midday(12), evening(18)
  const mealHours = [7, 12, 18]
  let s = 0
  for (const mh of mealHours) {
    if (Math.abs(hour - mh) <= 1) s = 35
  }
  // Low health/energy increases hunger
  if (soul.health < 50) s += 15
  if (soul.energy < 30) s += 10
  return s
}

function scoreChopTrees(soul, worldState) {
  let s = 10 // base interest
  // More important when wood is scarce
  if (worldState.wood < 20) s += 40
  else if (worldState.wood < 50) s += 20
  // Farmers and builders like this
  if (soul.role === 'Farmer' || soul.role === 'Builder') s += 15
  // Ambition trait
  s += (soul.traits?.ambition || 5) * 1.5
  return s
}

function scoreMineOre(soul, worldState) {
  let s = 8
  if (worldState.ore < 10) s += 40
  else if (worldState.ore < 30) s += 20
  if (worldState.stone < 10) s += 30
  // Warriors and builders prefer mining
  if (soul.role === 'Warrior' || soul.role === 'Builder') s += 15
  s += (soul.traits?.courage || 5)
  return s
}

function scoreBuild(soul, worldState) {
  if (!worldState.hasConstruction) return 0
  let s = 40
  if (soul.role === 'Builder') s += 40
  // Everyone pitches in a bit
  s += (soul.traits?.ambition || 5) * 2
  s += (soul.traits?.empathy || 5)
  return Math.max(0, s)
}

function scorePray(soul) {
  let s = 5
  if (soul.role === 'Priest') s += 40
  if (soul.role === 'Healer') s += 15
  // High stress → seek prayer
  if (soul.stress > 60) s += 25
  else if (soul.stress > 40) s += 10
  s += (soul.traits?.wisdom || 5) * 2
  return s
}

function scoreMeditate(soul) {
  let s = 3
  if (soul.stress > 70) s += 35
  else if (soul.stress > 50) s += 15
  s += (soul.traits?.wisdom || 5) * 2.5
  if (soul.role === 'Priest') s += 20
  return s
}

function scoreTraining(soul, worldState) {
  let s = 5
  if (soul.role === 'Warrior') s += 40
  if (worldState.warOngoing) s += 30
  s += (soul.traits?.courage || 5) * 2
  return s
}

function scorePatrol(soul, worldState) {
  let s = 3
  if (soul.role === 'Warrior') s += 25
  if (worldState.warOngoing) s += 25
  s += (soul.traits?.courage || 5)
  return s
}

function scoreHeal(soul, worldState) {
  if (soul.role !== 'Healer') return 0
  let s = 30
  if (worldState.woundedCount > 0) s += 40
  s += (soul.traits?.empathy || 5) * 3
  return s
}

function scoreGatherHerbs(soul) {
  let s = 3
  if (soul.role === 'Healer') s += 30
  if (soul.role === 'Priest') s += 10
  return s
}

function scoreTrade(soul) {
  let s = 3
  if (soul.role === 'Trader') s += 45
  s += (soul.traits?.ambition || 5) * 1.5
  return s
}

function scoreStudy(soul) {
  let s = 5
  s += (soul.traits?.wisdom || 5) * 3
  if (soul.role === 'Priest') s += 10
  return s
}

function scoreTeach(soul) {
  if (soul.age < 25) return 0
  let s = 3
  if (soul.role === 'Priest') s += 25
  s += (soul.traits?.wisdom || 5) * 2
  return s
}

function scoreCraft(soul, worldState) {
  let s = 5
  if (soul.role === 'Builder') s += 20
  // Need raw materials to craft
  if (worldState.wood > 20 || worldState.ore > 10) s += 15
  s += (soul.traits?.creativity || 5)
  return s
}

function scoreWork(soul) {
  let s = 15 // everyone works a bit
  if (soul.role === 'Farmer') s += 30
  s += (soul.traits?.ambition || 5)
  return s
}

function scoreSocial(soul) {
  let s = 10
  if (soul.happiness < 30) s += 30
  else if (soul.happiness < 50) s += 15
  s += (soul.traits?.empathy || 5) * 1.5
  // Low stress? feel like socializing
  if (soul.stress < 30) s += 10
  return s
}

function scoreRest(soul) {
  let s = 0
  if (soul.energy < 40) s += 25
  if (soul.health < 40) s += 30
  if (soul.stress > 70) s += 15
  return s
}

function scoreReflect(soul) {
  let s = 0
  if (soul.age > 40) s += 15
  s += (soul.traits?.wisdom || 5) * 1.5
  if (soul.stress > 50) s += 10
  return s
}

function scoreBuildCampfire(soul, worldState, hour) {
  const isNight = hour >= 19 || hour < 5
  if (!isNight) return 0
  // Only Builder or Farmer roles initiate campfire construction
  if (soul.role !== 'Builder' && soul.role !== 'Farmer') return 0

  const activeCfs = getActiveCampfires()
  if (activeCfs.filter((c) => c.state === 'lit').length >= 2) return 0

  // Already building one — absolute commitment, don't switch away
  if (activeCfs.find((c) => c.builderId === soul.id && c.state === 'building')) return 120

  // Someone else is already building — don't double up
  if (activeCfs.some((c) => c.state === 'building')) return 0

  // Must clearly beat sleep (70 base + 20 inertia + 10.5 random = ~100)
  return 110
}

function scoreWarmCampfire(soul, hour) {
  const isNight = hour >= 19 || hour < 5
  if (!isNight) return 0
  const litCampfires = getActiveCampfires().filter((c) => c.state === 'lit')
  if (litCampfires.length === 0) return 0
  // Compete with sleep — not everyone warms, creates natural variety
  let s = 75
  s += (soul.traits?.empathy || 5)
  return s
}

// ─── Main behavior resolver ─────────────────────────────────────────────────

/**
 * Decides what a soul should do right now based on needs, traits, and world state.
 * Returns { activity, animation, location }
 */
export function decideBehavior(soul, worldState, currentYear) {
  const hour = getGameHour(worldState.timeOfDay)
  const eraId = worldState.eraId || 'ancient'

  // Infants stay home
  if (soul.age < 2) {
    return { activity: 'rest', animation: 'idle', location: 'home' }
  }

  // Young children (2-7): simple activities
  if (soul.age < 8) {
    if (hour >= 21 || hour < 6) return { activity: 'sleep', animation: 'sleep', location: 'home' }
    if (hour >= 12 && hour < 13) return { activity: 'eat', animation: 'idle', location: 'home' }
    const roll = Math.random()
    if (roll < 0.3) return { activity: 'social', animation: 'idle', location: 'plaza' }
    if (roll < 0.5) return { activity: 'study', animation: 'idle', location: _eraLoc('study', eraId) }
    if (roll < 0.7) return { activity: 'gather_herbs', animation: 'work', location: 'forest_edge' }
    return { activity: 'rest', animation: 'idle', location: 'home' }
  }

  // Score all actions
  const scores = [
    { id: 'sleep',           score: scoreSleep(soul, hour) },
    { id: 'eat',             score: scoreEat(soul, hour) },
    { id: 'chop_trees',      score: scoreChopTrees(soul, worldState) },
    { id: 'mine_ore',        score: scoreMineOre(soul, worldState) },
    { id: 'build_structure', score: scoreBuild(soul, worldState) },
    { id: 'pray',            score: scorePray(soul) },
    { id: 'meditate',        score: scoreMeditate(soul) },
    { id: 'training',        score: scoreTraining(soul, worldState) },
    { id: 'patrol',          score: scorePatrol(soul, worldState) },
    { id: 'heal',            score: scoreHeal(soul, worldState) },
    { id: 'gather_herbs',    score: scoreGatherHerbs(soul) },
    { id: 'trade',           score: scoreTrade(soul) },
    { id: 'study',           score: scoreStudy(soul) },
    { id: 'teach',           score: scoreTeach(soul) },
    { id: 'craft_tools',     score: scoreCraft(soul, worldState) },
    { id: 'work',            score: scoreWork(soul) },
    { id: 'social',          score: scoreSocial(soul) },
    { id: 'rest',            score: scoreRest(soul) },
    { id: 'reflect',         score: scoreReflect(soul) },
    { id: 'build_campfire',  score: scoreBuildCampfire(soul, worldState, hour) },
    { id: 'warm_campfire',   score: scoreWarmCampfire(soul, hour) },
  ]

  // Daytime penalty for sleep (unless exhausted)
  const isDaytime = hour >= 6 && hour < 21
  if (isDaytime && soul.energy > 25) {
    const sleepEntry = scores.find((s) => s.id === 'sleep')
    if (sleepEntry) sleepEntry.score = Math.max(0, sleepEntry.score - 50)
  }

  // Night penalty for outdoor work (campfire activities exempt)
  const isNight = hour >= 21 || hour < 5
  if (isNight) {
    for (const s of scores) {
      if (['chop_trees', 'mine_ore', 'patrol', 'gather_herbs', 'build_structure'].includes(s.id)) {
        s.score *= 0.3
      }
    }
  }

  // Add some randomness so souls don't all do the same thing (±15)
  for (const s of scores) {
    s.score += (Math.random() - 0.3) * 15
  }

  // Inertia: bonus for continuing the same activity (prevents rapid flipping at high speed)
  const current = scores.find((s) => s.id === soul.currentActivity)
  if (current) current.score += 20

  // Pick highest-scoring action
  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]

  const action = ACTIONS[best.id] || ACTIONS.rest
  const location = _eraLoc(best.id, eraId) || action.location

  return {
    activity: best.id,
    animation: action.animation,
    location,
  }
}

/**
 * Build the worldState object needed by decideBehavior from store + engine data.
 */
export function buildBehaviorWorldState(store, souls, constructionSites) {
  const state = store.getState()
  const alive = souls.filter((s) => s.isAlive)
  return {
    wood: state.wood || 0,
    stone: state.stone || 0,
    ore: state.ore || 0,
    foodSupply: state.foodSupply || 100,
    warOngoing: state.warOngoing || false,
    hasConstruction: (constructionSites?.length || 0) > 0,
    constructionCount: constructionSites?.length || 0,
    woundedCount: alive.filter((s) => s.health < 30).length,
    eraId: state.currentEra || 'ancient',
    population: alive.length,
    timeOfDay: state.timeOfDay || 0,
  }
}

function _eraLoc(actionId, eraId) {
  return ERA_LOC[eraId]?.[actionId] || ACTIONS[actionId]?.location || 'home'
}
