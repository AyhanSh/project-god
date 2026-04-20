'use client'

import { LLM_SOULS, createChildSoul } from '@/data/llmSouls'
import { HISTORICAL_EVENTS, EMERGENT_EVENTS } from '@/data/historicalEvents'
import { getEraForYear } from '@/data/eras'
import { SoulMemory } from './SoulMemory'
import { relationshipManager } from './SoulRelations'
import { soulMind, THOUGHT_TYPES } from './SoulMind'
import { interactionEngine } from './InteractionEngine'
import { economySystem } from './EconomySystem'
import { resolveActionIntent } from './SoulActionIntent'
import { decideBehavior, buildBehaviorWorldState } from './SoulBehavior'
import { cityEngine } from './CityEngine'
import { sampleHeight, WATER_LEVEL, FLAT_RADIUS } from '@/world/Terrain'
import { worldHeightmap } from './HeightmapRegistry'
import { getSoulPosition } from './SoulPositionRegistry'
import {
  tickCampfires, extinguishCampfires, requestCampfire,
  getActiveCampfires, clearAllCampfires,
} from './CampfireRegistry'
import { populationSystem, POPULATION } from './PopulationSystem'

const HARVEST_MAP = {
  chop_trees:      { type: 'wood',  rate: 0.3   },
  mine_ore:        { type: 'ore',   rate: 0.2   },
  work:            { type: 'wood',  rate: 0.15  },
  gather_herbs:    { type: 'wood',  rate: 0.1   },
  open_stall:      { type: 'stone', rate: 0.1   },
  trade:           { type: 'stone', rate: 0.15  },
  craft_tools:     { type: 'wood',  rate: -0.05 },
  copy_texts:      { type: 'wood',  rate: 0.05  },
  build_structure: { type: 'stone', rate: -0.1  },
  training:        { type: 'ore',   rate: 0.05  },
  patrol:          { type: 'ore',   rate: 0.03  },
  process:         { type: 'ore',   rate: 0.2   },
}

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
    this.lastBreedingCheck = -3000
    this.coupleBirthCooldowns = {}
    this.lastDeepThink = {}
    this.lastAmbitionUpdate = {}
    this.initialized = false
  }

  initialize() {
    if (this.initialized) return

    // Create the starter souls
    this.souls = LLM_SOULS.map((soulData) => this._makeLiveSoul(soulData))

    this.store.getState().setSouls(this.souls)
    this.initialized = true
  }

  _makeLiveSoul(soulData, position) {
    return {
      ...soulData,
      isAlive: false,
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
      position: position || findLandPosition(12),
      memory: new SoulMemory(soulData.id),
      memories: [],
      relationships: [],
      currentAmbition: null,
      lifespan: null,
      deathYear: null,
      actionLog: [],
    }
  }

  tick(currentYear) {
    if (!this.initialized) this.initialize()

    const yearsElapsed = currentYear - this.lastTickYear
    if (yearsElapsed < 0.005) return // Don't process tiny ticks

    this.lastTickYear = currentYear
    const era = getEraForYear(currentYear)
    const worldContext = this._getWorldContext(currentYear, era)

    // Process each soul
    for (const soul of this.souls) {
      this._processSoulTick(soul, currentYear, era, worldContext, yearsElapsed)
    }

    // Mark background souls (beyond render threshold)
    const aliveSouls = this.souls.filter((s) => s.isAlive)
    aliveSouls.forEach((soul, index) => {
      soul.isBackground = index >= POPULATION.MAX_RENDERED_SOULS
    })

    // Check interactions (every ~1 game year)
    if (currentYear - this.lastInteractionCheck >= 1) {
      this.lastInteractionCheck = currentYear
      this._checkInteractions(currentYear, worldContext)
    }

    // Check breeding (every ~1 game year)
    if (currentYear - this.lastBreedingCheck >= 1) {
      this.lastBreedingCheck = currentYear
      this._checkBreeding(currentYear, era)
    }

    // Check historical events
    this._checkHistoricalEvents(currentYear, era, worldContext)

    // Check emergent events
    this._checkEmergentEvents(currentYear, worldContext)

    // Clean up stale conversations and combats
    interactionEngine.cleanup()

    // Check if war has ended
    if (this.warEndYear && currentYear > this.warEndYear) {
      this.warEndYear = null
      this.store.getState().setWorldState('Peace returns')
    }

    // === Campfire lifecycle ===
    const hour = Math.floor(this.store.getState().timeOfDay)

    // Souls requesting campfires create them at the gathering spot
    for (const soul of this.souls) {
      if (!soul.isAlive) continue
      if (soul.currentActivity === 'build_campfire') {
        requestCampfire(soul.id)
      }
    }

    // Advance campfire build progress + state
    tickCampfires()

    // Dawn: extinguish campfires
    if (hour >= 6 && hour < 7) {
      extinguishCampfires()
    }

    // Sync campfires to store for rendering
    this.store.getState().setCampfires(getActiveCampfires())

    // Update store
    this._updateStore(currentYear, era)
  }

  _processSoulTick(soul, currentYear, era, worldContext, yearsElapsed) {
    // Birth check
    if (!soul.isAlive && currentYear >= soul.birthYear) {
      this._birthSoul(soul, currentYear, era)
    }

    if (!soul.isAlive) return

    // Background souls: only age and check death, no AI thoughts or animations
    if (soul.isBackground) {
      soul.age += yearsElapsed
      soul.currentYear = currentYear
      soul.currentEra = era.name
      if (!soul.lifespan) {
        const expectancy = LIFE_EXPECTANCY[era.id] || LIFE_EXPECTANCY.ancient
        soul.lifespan = expectancy.base + (Math.random() - 0.5) * expectancy.variance * 2
      }
      this._checkDeath(soul, currentYear, era)
      return
    }

    // Age
    soul.age += yearsElapsed
    soul.currentYear = currentYear
    soul.currentEra = era.name
    soul.weather = worldContext.weather

    // AI behavior: decide action based on needs, traits, and world state
    const behaviorWorld = buildBehaviorWorldState(this.store, this.souls, cityEngine.constructionSites)
    const behavior = decideBehavior(soul, behaviorWorld, currentYear)
    soul.currentActivity = behavior.activity
    soul.currentLocation = behavior.location
    soul.currentAnimation = behavior.animation

    // Sync live 3D position back to engine soul data
    const livePos = getSoulPosition(soul.id)
    if (livePos) {
      soul.position.x = livePos.x
      soul.position.z = livePos.z
    }

    // Resource harvesting (location-aware for generic 'work')
    let harvest = HARVEST_MAP[soul.currentActivity]
    if (soul.currentActivity === 'work') {
      if (soul.currentLocation === 'farm' || soul.role === 'Farmer') {
        harvest = { type: 'wood', rate: 0.25 }
      } else if (soul.currentLocation === 'factory') {
        harvest = { type: 'ore', rate: 0.2 }
      }
    }
    if (harvest) {
      economySystem.harvestResource(harvest.type, harvest.rate * yearsElapsed)
    }

    // Natural stat changes over time
    soul.energy = Math.max(10, Math.min(100, soul.energy + (soul.currentActivity === 'sleep' ? 5 : -0.5) * yearsElapsed))
    soul.happiness = Math.max(0, Math.min(100, soul.happiness + (Math.random() - 0.5) * yearsElapsed))
    soul.stress = Math.max(0, Math.min(100, soul.stress + (Math.random() - 0.55) * yearsElapsed))
    soul.influence += yearsElapsed * 0.1 * (soul.traits?.ambition || 5) / 5

    // Life stage updates
    this._updateLifeStage(soul)


    // Give new souls a default ambition immediately so they start building
    if (!soul.currentAmbition && soul.age > 8) {
      soul.currentAmbition = {
        goal: _defaultAmbitionFor(soul),
        timeline: 8,
        raw: 'default',
      }
    }

    // Ambition update (every 8-15 game years)
    const lastAmbition = this.lastAmbitionUpdate[soul.id] || -9999
    if (currentYear - lastAmbition > 8 + Math.random() * 7) {
      this.lastAmbitionUpdate[soul.id] = currentYear
      this._updateAmbition(soul, worldContext)
    }

    // Update action intent log
    const conversations = this.store.getState().activeConversations
    const combats = this.store.getState().activeCombats
    const intent = resolveActionIntent(soul, this.souls, conversations, combats)
    intent.year = Math.round(currentYear)
    intent.hour = Math.floor(this.store.getState().timeOfDay)

    // Only log if the action text changed (avoid spamming identical entries)
    const lastEntry = soul.actionLog[0]
    if (!lastEntry || lastEntry.text !== intent.text) {
      soul.actionLog.unshift(intent)
      if (soul.actionLog.length > 12) soul.actionLog.length = 12
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
    populationSystem.registerBirth(soul)

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
    if (soul.age < 2) soul.lifeStage = 'infant'
    else if (soul.age < 8) soul.lifeStage = 'child'
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
    populationSystem.registerDeath(soul)

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

    // Update all relationships — notify living souls
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

    // Pass legacy to living children
    const children = this.souls.filter(
      (s) => s.isAlive && s.parentIds?.includes(soul.id)
    )
    if (children.length > 0 && soul.memory) {
      const topMemories = [...soul.memory.episodic]
        .sort((a, b) => Math.abs(b.emotionalWeight) - Math.abs(a.emotionalWeight))
        .slice(0, 3)
      for (const child of children) {
        for (const mem of topMemories) {
          child.memory?.addMemory({
            year: currentYear,
            type: 'parent_legacy',
            text: `[${soul.llmName}'s dying memory] ${mem.text}`,
            emotionalWeight: mem.emotionalWeight * 0.7,
          })
        }
      }
    }
  }

  // ─── Breeding system ────────────────────────────────────────────────────────
  _checkBreeding(currentYear, era) {
    const aliveCount = this.souls.filter((s) => s.isAlive).length
    if (aliveCount >= POPULATION.MAX_TOTAL_SOULS) return

    // Only check females who are alive and of childbearing age
    const females = this.souls.filter(
      (s) => s.isAlive && s.sex === 'female' && s.age >= 18 && s.age <= 45
    )

    for (const female of females) {
      const partner = this._findPartner(female)
      if (!partner || !partner.isAlive || partner.age < 18 || partner.sex !== 'male') continue

      // Couple cooldown — 3-7 game years between children
      const coupleKey = [female.id, partner.id].sort().join(':')
      const lastBirth = this.coupleBirthCooldowns[coupleKey] || -9999
      if (currentYear - lastBirth < POPULATION.BREEDING_COOLDOWN_MIN + Math.random() * (POPULATION.BREEDING_COOLDOWN_MAX - POPULATION.BREEDING_COOLDOWN_MIN)) continue

      // Max 6 children per couple
      const childCount = this.souls.filter(
        (s) => s.parentIds?.includes(female.id) && s.parentIds?.includes(partner.id)
      ).length
      if (childCount >= POPULATION.MAX_CHILDREN_PER_COUPLE) continue

      // Breeding chance per check
      if (Math.random() > POPULATION.BREEDING_CHANCE) continue

      this.coupleBirthCooldowns[coupleKey] = currentYear
      this._birthChild(female, partner, currentYear, era)
    }
  }

  _findPartner(soul) {
    for (const other of this.souls) {
      if (other.id === soul.id || !other.isAlive) continue
      const rel = relationshipManager.get(soul.id, other.id)
      if (rel && (rel.type === 'spouse' || rel.type === 'lover')) {
        return other
      }
    }
    return null
  }

  _birthChild(parentA, parentB, currentYear, era) {
    const childData = createChildSoul(parentA, parentB, currentYear)
    const child = this._makeLiveSoul(childData, { ...parentA.position })

    // Child is born alive immediately
    child.isAlive = true
    child.age = 0
    child.currentYear = currentYear
    child.currentEra = era.name

    this.souls.push(child)
    populationSystem.registerBirth(child)

    this.store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${parentA.llmName} and ${parentB.llmName} have a child: ${child.llmName}!`,
      type: 'birth',
      soulId: child.id,
    })

    // Parent memories
    parentA.memory?.addMemory({
      year: currentYear,
      type: 'child_born',
      text: `My child ${child.llmName} is born.`,
      emotionalWeight: 9,
      personsInvolved: [child.id, parentB.id],
    })
    parentB.memory?.addMemory({
      year: currentYear,
      type: 'child_born',
      text: `My child ${child.llmName} is born.`,
      emotionalWeight: 9,
      personsInvolved: [child.id, parentA.id],
    })

    // Child's birth memory
    child.memory.addMemory({
      year: currentYear,
      type: 'birth',
      text: `I am born to ${parentA.llmName} and ${parentB.llmName}.`,
      emotionalWeight: 8,
    })

    // Inherit ancestral wisdom as early memories
    if (child.inheritedWisdom && child.inheritedWisdom.length > 0) {
      for (const wisdom of child.inheritedWisdom) {
        child.memory.addMemory({
          year: currentYear,
          type: 'ancestral_wisdom',
          text: wisdom,
          emotionalWeight: 5,
        })
      }
    }

    // Initial parent-child relationships
    const relA = relationshipManager.getOrCreate(child.id, parentA.id)
    relA.affection = 70
    relA.trust = 80
    relA._updateType()

    const relB = relationshipManager.getOrCreate(child.id, parentB.id)
    relB.affection = 70
    relB.trust = 80
    relB._updateType()
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

    // If AI didn't produce a parseable ambition, synthesise a default from role
    if (!soul.currentAmbition) {
      soul.currentAmbition = {
        goal: _defaultAmbitionFor(soul),
        timeline: 15,
        raw: 'default',
      }
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
        })
      }
    }

    // Self-awareness trigger
    if (event.triggersSelfAwareness) {
      for (const soul of this.souls.filter((s) => s.isAlive)) {
        soulMind.think(soul, THOUGHT_TYPES.SELF_AWARENESS, {
          world: worldContext,
          priority: 1,
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
    state.setPopulationStats(populationSystem.getStats())
  }

  destroy() {
    this.souls = []
    this.firedEvents.clear()
    this.emergentCooldowns = {}
    this.lastDeepThink = {}
    this.lastAmbitionUpdate = {}
    this.coupleBirthCooldowns = {}
    this.initialized = false
    this.store = null
    clearAllCampfires()
  }

  getSouls() {
    return this.souls
  }

  toJSON() {
    return {
      souls: this.souls.map((s) => ({
        ...s,
        memory: s.memory?.toJSON() || null,
      })),
      firedEvents: [...this.firedEvents],
      emergentCooldowns: { ...this.emergentCooldowns },
      lastTickYear: this.lastTickYear,
      lastInteractionCheck: this.lastInteractionCheck,
      lastBreedingCheck: this.lastBreedingCheck,
      coupleBirthCooldowns: { ...this.coupleBirthCooldowns },
      lastDeepThink: { ...this.lastDeepThink },
      lastAmbitionUpdate: { ...this.lastAmbitionUpdate },
      warEndYear: this.warEndYear || null,
    }
  }

  rehydrate(data) {
    this.firedEvents = new Set(data.firedEvents || [])
    this.emergentCooldowns = data.emergentCooldowns || {}
    this.lastTickYear = data.lastTickYear || -3000
    this.lastInteractionCheck = data.lastInteractionCheck || -3000
    this.lastBreedingCheck = data.lastBreedingCheck || -3000
    this.coupleBirthCooldowns = data.coupleBirthCooldowns || {}
    this.lastDeepThink = data.lastDeepThink || {}
    this.lastAmbitionUpdate = data.lastAmbitionUpdate || {}
    this.warEndYear = data.warEndYear || null

    // Restore souls with live SoulMemory instances
    this.souls = (data.souls || []).map((sd) => {
      const mem = new SoulMemory(sd.id)
      if (sd.memory) {
        mem.episodic = sd.memory.episodic || []
        mem.beliefs = sd.memory.beliefs || []
        mem.traumas = sd.memory.traumas || []
        mem.joys = sd.memory.joys || []
        mem.consolidatedWisdom = sd.memory.consolidatedWisdom || []
        if (sd.memory.relational) mem.relational = sd.memory.relational
      }
      return { ...sd, memory: mem }
    })

    this.initialized = true
    this.store.getState().setSouls([...this.souls])
  }
}

function _defaultAmbitionFor(soul) {
  const map = {
    Farmer: 'grow more food and build a farm',
    Healer: 'build a temple to heal the sick',
    Priest: 'build a temple for worship',
    Warrior: 'build a castle for defense',
    Trader: 'build a market for trade',
    Builder: 'build a great factory',
  }
  return map[soul.role] || 'build something meaningful for the community'
}

let _worldEngine = null
export function getWorldEngine(store) {
  if (!_worldEngine) {
    _worldEngine = new WorldEngine(store)
  }
  return _worldEngine
}

export function destroyWorldEngine() {
  if (_worldEngine) {
    _worldEngine.destroy()
    _worldEngine = null
  }
}
