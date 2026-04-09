'use client'

import { LLM_SOULS } from '@/data/llmSouls'
import { HISTORICAL_EVENTS, EMERGENT_EVENTS } from '@/data/historicalEvents'
import { getEraForYear } from '@/data/eras'
import { SoulMemory } from './SoulMemory'
import { relationshipManager } from './SoulRelations'
import { soulMind, THOUGHT_TYPES } from './SoulMind'
import { interactionEngine } from './InteractionEngine'
import { getSoulSchedule, getCurrentScheduleEntry, getGameHour } from './DailyRoutine'
import { sampleHeight, WATER_LEVEL, FLAT_RADIUS } from '@/world/Terrain'
import { generateHeightmap } from '@/world/Terrain'

// Shared heightmap — same seed as WorldScene
const worldHeightmap = generateHeightmap(1337)

// Find a valid land position (above water, within flat building zone)
function findLandPosition(radius = FLAT_RADIUS - 2) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 3 + Math.random() * radius
    const x = Math.cos(angle) * dist
    const z = Math.sin(angle) * dist
    const y = sampleHeight(worldHeightmap, x, z)
    if (y > WATER_LEVEL + 0.5) {
      return { x, z, y }
    }
  }
  // Fallback: center is always flat/dry
  return { x: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 6, y: 0 }
}

// Life expectancy by era
const LIFE_EXPECTANCY = {
  ancient: { base: 40, variance: 15 },
  medieval: { base: 50, variance: 15 },
  renaissance: { base: 55, variance: 15 },
  industrial: { base: 65, variance: 12 },
  modern: { base: 78, variance: 10 },
  singularity: { base: 120, variance: 30 },
}

export class WorldEngine {
  constructor(store) {
    this.store = store
    this.souls = []
    this.firedEvents = new Set()
    this.emergentCooldowns = {}
    this.lastTickYear = -3000
    this.lastInteractionCheck = -3000
    this.lastDeepThink = {}
    this.lastAmbitionUpdate = {}
    this.initialized = false
  }

  initialize() {
    if (this.initialized) return

    // Create the 6 souls
    this.souls = LLM_SOULS.map((soulData) => ({
      ...soulData,
      isAlive: false, // Born when year reaches birthYear
      age: 0,
      health: 100,
      happiness: 60,
      stress: 20,
      energy: 80,
      wisdom: soulData.traits.wisdom * 5,
      influence: 0,
      mood: 'neutral',
      moodIntensity: 5,
      lastEmotionalEvent: 'The world is new',
      currentLocation: 'home',
      currentActivity: 'resting',
      perception: 'The world stretches before you',
      nearbySouls: [],
      currentYear: -3000,
      currentEra: 'Ancient Era',
      lastMajorEvent: 'The dawn of civilization',
      techLevel: 'stone tools and fire',
      weather: 'clear',
      position: findLandPosition(12),
      memory: new SoulMemory(soulData.id),
      memories: [],
      relationships: [],
      currentAmbition: null,
      lifespan: null,
      deathYear: null,
      generation: 1,
      latestThought: null,
    }))

    this.store.getState().setSouls(this.souls)
    this.initialized = true
  }

  tick(currentYear) {
    if (!this.initialized) this.initialize()

    const yearsElapsed = currentYear - this.lastTickYear
    if (yearsElapsed < 0.05) return // Don't process tiny ticks

    this.lastTickYear = currentYear
    const era = getEraForYear(currentYear)
    const worldContext = this._getWorldContext(currentYear, era)

    // Process each soul
    for (const soul of this.souls) {
      this._processSoulTick(soul, currentYear, era, worldContext, yearsElapsed)
    }

    // Check interactions (every ~1 game year)
    if (currentYear - this.lastInteractionCheck >= 1) {
      this.lastInteractionCheck = currentYear
      this._checkInteractions(currentYear, worldContext)
    }

    // Check historical events
    this._checkHistoricalEvents(currentYear, era, worldContext)

    // Check emergent events
    this._checkEmergentEvents(currentYear, worldContext)

    // Check if war has ended
    if (this.warEndYear && currentYear > this.warEndYear) {
      this.warEndYear = null
      this.store.getState().setWorldState('Peace returns')
    }

    // Update store
    this._updateStore(currentYear, era)
  }

  _processSoulTick(soul, currentYear, era, worldContext, yearsElapsed) {
    // Birth check
    if (!soul.isAlive && currentYear >= soul.birthYear) {
      this._birthSoul(soul, currentYear, era)
    }

    if (!soul.isAlive) return

    // Age
    soul.age += yearsElapsed
    soul.currentYear = currentYear
    soul.currentEra = era.name
    soul.weather = worldContext.weather

    // Update schedule
    const schedule = getSoulSchedule(soul, era)
    const hour = getGameHour(currentYear % 1)
    const entry = getCurrentScheduleEntry(schedule, hour)
    if (entry) {
      soul.currentActivity = entry.activity
      soul.currentLocation = entry.location
    }

    // Natural stat changes over time
    soul.energy = Math.max(10, Math.min(100, soul.energy + (entry?.activity === 'sleep' ? 5 : -0.5) * yearsElapsed))
    soul.happiness = Math.max(0, Math.min(100, soul.happiness + (Math.random() - 0.5) * yearsElapsed))
    soul.stress = Math.max(0, Math.min(100, soul.stress + (Math.random() - 0.55) * yearsElapsed))
    soul.influence += yearsElapsed * 0.1 * (soul.traits?.ambition || 5) / 5

    // Life stage updates
    this._updateLifeStage(soul)

    // Deep thinking (every 5-15 game years)
    if (soulMind.shouldThinkDeeply(soul, currentYear)) {
      soulMind.markThought(soul, currentYear)
      this._triggerDeepThought(soul, worldContext)
    }

    // Ambition update (every 20-30 game years)
    const lastAmbition = this.lastAmbitionUpdate[soul.id] || -9999
    if (currentYear - lastAmbition > 20 + Math.random() * 10) {
      this.lastAmbitionUpdate[soul.id] = currentYear
      this._updateAmbition(soul, worldContext)
    }

    // Death check
    this._checkDeath(soul, currentYear, era)

    // Set lifespan if not set
    if (!soul.lifespan) {
      const expectancy = LIFE_EXPECTANCY[era.id] || LIFE_EXPECTANCY.ancient
      soul.lifespan = expectancy.base + (Math.random() - 0.5) * expectancy.variance * 2
    }
  }

  _birthSoul(soul, currentYear, era) {
    soul.isAlive = true
    soul.age = 0
    soul.currentYear = currentYear

    this.store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${soul.llmName} is born into the world.`,
      type: 'birth',
      soulId: soul.id,
    })

    soul.memory.addMemory({
      year: currentYear,
      type: 'birth',
      text: 'I am born. The world is vast and unknown.',
      emotionalWeight: 8,
    })
  }

  _updateLifeStage(soul) {
    if (soul.age < 5) soul.lifeStage = 'infant'
    else if (soul.age < 13) soul.lifeStage = 'child'
    else if (soul.age < 18) soul.lifeStage = 'adolescent'
    else if (soul.age < 40) soul.lifeStage = 'adult'
    else if (soul.age < 60) soul.lifeStage = 'middle_aged'
    else soul.lifeStage = 'elder'
  }

  _checkDeath(soul, currentYear, era) {
    if (!soul.isAlive) return

    // Combat death: health dropped to 0
    if (soul.health <= 0) {
      this._killSoul(soul, currentYear, 'combat')
      return
    }

    const expectancy = LIFE_EXPECTANCY[era.id] || LIFE_EXPECTANCY.ancient

    // Base death chance increases with age
    const ageRatio = soul.age / (soul.lifespan || expectancy.base)
    let deathChance = 0

    if (ageRatio > 0.8) deathChance = (ageRatio - 0.8) * 0.01
    if (ageRatio > 1.0) deathChance = 0.05
    if (ageRatio > 1.2) deathChance = 0.15
    if (soul.health < 20) deathChance += 0.02

    if (deathChance > 0 && Math.random() < deathChance) {
      this._killSoul(soul, currentYear, 'old_age')
    }
  }

  async _killSoul(soul, currentYear, cause = 'old_age') {
    soul.isAlive = false
    soul.deathYear = currentYear

    const causeText = cause === 'combat' ? 'has fallen in battle' : 'has died'
    this.store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${soul.llmName} ${causeText} at age ${Math.round(soul.age)}.`,
      type: 'death',
      soulId: soul.id,
    })

    // Trigger last words
    const worldContext = this._getWorldContext(currentYear, getEraForYear(currentYear))
    soulMind.think(soul, THOUGHT_TYPES.LAST_WORDS, { world: worldContext, priority: 1 })
      .then((thought) => {
        soul.latestThought = thought
      })

    // Rebirth after some years
    const rebirthDelay = 50 + Math.random() * 100
    soul.birthYear = currentYear + rebirthDelay
    soul.generation++
    soul.health = 100

    // Update all relationships
    for (const otherSoul of this.souls.filter((s) => s.id !== soul.id && s.isAlive)) {
      const rel = relationshipManager.get(soul.id, otherSoul.id)
      if (rel) {
        rel.isAlive[soul.id] = false
        otherSoul.memory?.addMemory({
          year: currentYear,
          type: 'death_of_known',
          text: `${soul.llmName} ${causeText}. We shared ${rel.type === 'stranger' ? 'nothing' : 'a bond'}.`,
          emotionalWeight: -7,
          personsInvolved: [soul.id],
        })
      }
    }
  }

  async _triggerDeepThought(soul, worldContext) {
    try {
      const thought = await soulMind.think(soul, THOUGHT_TYPES.INNER_MONOLOGUE, {
        world: worldContext,
        priority: 5,
      })
      soul.latestThought = thought
    } catch (e) {
      // Non-critical, fail silently
    }
  }

  async _updateAmbition(soul, worldContext) {
    try {
      const result = await soulMind.think(soul, THOUGHT_TYPES.AMBITION_UPDATE, {
        world: worldContext,
        priority: 7,
      })

      // Parse ambition from AI response
      const text = result.text || ''
      const ambitionMatch = text.match(/AMBITION:\s*(.+?)(?:TIMELINE|WHY|$)/i)
      const timelineMatch = text.match(/TIMELINE:\s*(.+?)(?:WHY|$)/i)

      if (ambitionMatch) {
        soul.currentAmbition = {
          goal: ambitionMatch[1].trim(),
          timeline: timelineMatch ? parseInt(timelineMatch[1]) || 10 : 10,
          raw: text,
        }
      }
    } catch (e) {
      // Non-critical
    }
  }

  _checkInteractions(currentYear, worldContext) {
    const aliveSouls = this.souls.filter((s) => s.isAlive && s.age > 5)
    if (aliveSouls.length < 2) return

    // Pick two random souls that are "nearby"
    interactionEngine.checkProximityInteractions(aliveSouls, currentYear, worldContext)
  }

  _checkHistoricalEvents(currentYear, era, worldContext) {
    for (const event of HISTORICAL_EVENTS) {
      if (this.firedEvents.has(event.id)) continue

      const targetYear = event.year + (Math.random() - 0.5) * event.variance * 2
      if (Math.abs(currentYear - targetYear) < 1) {
        this.firedEvents.add(event.id)
        this._fireEvent(event, currentYear, worldContext)
      }
    }
  }

  _checkEmergentEvents(currentYear, worldContext) {
    for (const event of EMERGENT_EVENTS) {
      const cooldownEnd = this.emergentCooldowns[event.id] || -9999
      if (currentYear < cooldownEnd) continue

      const worldState = {
        foodSupply: this.store.getState().foodSupply,
        population: this.store.getState().population,
        happinessAvg: this._getAverageHappiness(),
        techLevel: this.store.getState().techLevel,
        warOngoing: this.store.getState().warOngoing,
      }

      if (event.trigger(worldState, this.souls)) {
        this.emergentCooldowns[event.id] = currentYear + (event.cooldown || 100)
        this._fireEvent(event, currentYear, worldContext)
      }
    }
  }

  _fireEvent(event, currentYear, worldContext) {
    const eventName = typeof event.name === 'function'
      ? event.name(this.souls.find((s) => s.isAlive))
      : event.name

    this.store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${eventName}: ${event.description}`,
      type: 'historical_event',
      eventId: event.id,
    })

    // Apply effects
    if (event.effect) {
      if (event.effect.happiness) {
        for (const soul of this.souls.filter((s) => s.isAlive)) {
          soul.happiness = Math.max(0, Math.min(100, soul.happiness + event.effect.happiness))
        }
      }
      if (event.effect.stress) {
        for (const soul of this.souls.filter((s) => s.isAlive)) {
          soul.stress = Math.max(0, Math.min(100, soul.stress + event.effect.stress))
        }
      }
      if (event.effect.populationEffect) {
        const state = this.store.getState()
        state.setPopulation(Math.max(1, Math.round(state.population * (1 + event.effect.populationEffect))))
      }
      if (event.effect.techBonus) {
        const state = this.store.getState()
        state.setTechLevel(state.techLevel + event.effect.techBonus / 20)
      }
    }

    // Trigger soul reactions
    if (event.soulReaction) {
      for (const soul of this.souls.filter((s) => s.isAlive)) {
        soulMind.think(soul, THOUGHT_TYPES.EVENT_REACTION, {
          event: { name: eventName, description: event.description },
          world: worldContext,
          priority: 2,
        }).then((thought) => {
          soul.latestThought = thought
        })
      }
    }

    // Self-awareness trigger
    if (event.triggersSelfAwareness) {
      for (const soul of this.souls.filter((s) => s.isAlive)) {
        soulMind.think(soul, THOUGHT_TYPES.SELF_AWARENESS, {
          world: worldContext,
          priority: 1,
        }).then((thought) => {
          soul.latestThought = thought
        })
      }
    }

    // War events cause actual combat between souls
    if (event.animation?.startsWith('war_')) {
      this._triggerWarCombat(currentYear, worldContext)
    }

    this.store.getState().setWorldState(event.description.slice(0, 60))
  }

  _triggerWarCombat(currentYear, worldContext) {
    const aliveSouls = this.souls.filter((s) => s.isAlive && s.age > 10)
    if (aliveSouls.length < 2) return

    // Create 1-2 enemy pairs and force combat
    const pairCount = Math.min(2, Math.floor(aliveSouls.length / 2))
    const shuffled = [...aliveSouls].sort(() => Math.random() - 0.5)

    for (let i = 0; i < pairCount; i++) {
      const sA = shuffled[i * 2]
      const sB = shuffled[i * 2 + 1]
      if (!sA || !sB) continue

      // Increase resentment to push toward enemy status
      const rel = relationshipManager.getOrCreate(sA.id, sB.id)
      rel.resentment = Math.min(100, rel.resentment + 40)
      rel._updateType()

      // Force combat
      interactionEngine._triggerCombat(sA, sB, currentYear, worldContext)
    }

    // Track war end (20 game years)
    this.warEndYear = currentYear + 20
    this.store.getState().setWorldState('War rages across the land')
  }

  _getWorldContext(currentYear, era) {
    const state = this.store.getState()
    return {
      currentYear: Math.round(currentYear),
      currentEra: era?.name || 'Ancient Era',
      lastMajorEvent: state.eventLog[0]?.text || 'The dawn of civilization',
      worldState: state.worldState,
      techLevel: this._getTechLevelDescription(era),
      weather: state.weather,
    }
  }

  _getTechLevelDescription(era) {
    const descriptions = {
      ancient: 'stone tools, bronze, early agriculture',
      medieval: 'iron, windmills, castles, basic medicine',
      renaissance: 'printing press, telescopes, gunpowder, navigation',
      industrial: 'steam engines, railroads, factories, telegraph',
      modern: 'electricity, computers, internet, space travel',
      singularity: 'artificial intelligence, quantum computing, neural interfaces',
    }
    return descriptions[era?.id] || 'basic tools'
  }

  _getAverageHappiness() {
    const alive = this.souls.filter((s) => s.isAlive)
    if (alive.length === 0) return 50
    return alive.reduce((s, a) => s + a.happiness, 0) / alive.length
  }

  _updateStore(currentYear, era) {
    const state = this.store.getState()
    state.setSouls([...this.souls])
    state.setPopulation(this.souls.filter((s) => s.isAlive).length)
  }

  getSouls() {
    return this.souls
  }
}

let _worldEngine = null
export function getWorldEngine(store) {
  if (!_worldEngine) {
    _worldEngine = new WorldEngine(store)
  }
  return _worldEngine
}
