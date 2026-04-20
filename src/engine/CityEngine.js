'use client'

import { nanoid } from 'nanoid'
import { sampleHeight, WATER_LEVEL, FLAT_RADIUS } from '@/world/Terrain'
import { worldHeightmap } from './HeightmapRegistry'
import { getSoulPosition } from './SoulPositionRegistry'
import { useGameStore } from '@/store/useGameStore'

// Lower costs so buildings actually get built in early game
const BUILDING_COSTS = {
  small:  { wood: 3, stone: 2,  ore: 0 },
  medium: { wood: 8, stone: 5,  ore: 2 },
  large:  { wood: 15, stone: 10, ore: 5 },
}

function _getBuildingSize(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('castle') || t.includes('cathedral') || t.includes('factory') || t.includes('university') || t.includes('arcology') || t.includes('skyscraper')) return 'large'
  if (t.includes('temple') || t.includes('market') || t.includes('theatre') || t.includes('hospital') || t.includes('observatory') || t.includes('manor')) return 'medium'
  return 'small'
}

function _canAfford(cost) {
  const s = useGameStore.getState()
  return s.wood >= cost.wood && s.stone >= cost.stone && (s.ore || 0) >= cost.ore
}

function _deductResources(cost) {
  const s = useGameStore.getState()
  useGameStore.setState({
    wood: Math.max(0, s.wood - cost.wood),
    stone: Math.max(0, s.stone - cost.stone),
    ore: Math.max(0, (s.ore || 0) - cost.ore),
  })
}

const heightmap = worldHeightmap

// Minimum distance between buildings to avoid overlap
const MIN_BUILDING_GAP = 6

export class CityEngine {
  constructor() {
    this.cities = []
    this.buildingQueue = []
    this.constructionSites = []
    this.lastSyncedProgress = {}
    this.processedAmbitions = new Set()
    this.lastCommunityBuild = -9999
    this.initialized = false
  }

  reset() {
    this.cities = []
    this.buildingQueue = []
    this.constructionSites = []
    this.lastSyncedProgress = {}
    this.processedAmbitions = new Set()
    this.lastCommunityBuild = -9999
    this.initialized = false
  }

  initialize() {
    if (this.initialized) return
    this.cities.push({
      id: nanoid(),
      name: 'First Settlement',
      position: { x: 0, z: 0 },
      population: 6,
      capacity: 15,
      buildings: [],
      founded: -3000,
    })
    this.initialized = true
  }

  update(souls, year, era, store) {
    if (!this.initialized) this.initialize()

    const aliveSouls = souls.filter((s) => s.isAlive)

    for (const city of this.cities) {
      const citySouls = this._soulsNearCity(aliveSouls, city)
      city.population = citySouls.length

      // Population pressure → expand existing city
      const growthPressure = city.population / city.capacity
      if (growthPressure > 0.6 && Math.random() < 0.01) {
        this._planExpansion(city, era)
      }

      // Soul ambitions drive building (once per ambition)
      for (const soul of citySouls) {
        if (soul.currentAmbition) {
          const ambKey = soul.id + '::' + soul.currentAmbition.goal
          if (!this.processedAmbitions.has(ambKey)) {
            this.processedAmbitions.add(ambKey)
            this._processSoulAmbition(soul, city, era, year, store)
          }
        }
      }
      // Cap processedAmbitions to avoid unbounded growth over millennia.
      if (this.processedAmbitions.size > 500) {
        const keep = [...this.processedAmbitions].slice(-400)
        this.processedAmbitions = new Set(keep)
      }
    }

    // Community building — periodically queue era-appropriate buildings
    if (year - this.lastCommunityBuild > 5 + Math.random() * 5) {
      this.lastCommunityBuild = year
      this._communityBuild(aliveSouls, era, year, store)
    }

    // Found new villages when population grows
    this._checkNewVillage(aliveSouls, year, era, store)

    // Process construction across all cities
    this._processConstruction(year, store, souls)
  }

  // Souls within ~80 units of a city center belong to it
  _soulsNearCity(aliveSouls, city) {
    return aliveSouls.filter((s) => {
      const dx = (s.position?.x || 0) - city.position.x
      const dz = (s.position?.z || 0) - city.position.z
      return Math.sqrt(dx * dx + dz * dz) < 80
    })
  }

  _planExpansion(city, era) {
    if (!era) return
    const availableTypes = era.buildingTypes || []
    if (availableTypes.length === 0) return

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const cost = BUILDING_COSTS[_getBuildingSize(type)]
    if (!_canAfford(cost)) return

    _deductResources(cost)
    this._addToQueue(type, city, null, 6)
    city.capacity += 4
  }

  // Periodic community-driven construction (no ambition needed)
  _communityBuild(aliveSouls, era, year, store) {
    if (!era || aliveSouls.length < 3) return
    const availableTypes = era.buildingTypes || []
    if (availableTypes.length === 0) return

    // Pick a random era building
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const cost = BUILDING_COSTS[_getBuildingSize(type)]
    if (!_canAfford(cost)) return

    // Pick the city with fewest buildings (encourages spreading)
    const city = this.cities.reduce((best, c) =>
      c.buildings.length < best.buildings.length ? c : best
    , this.cities[0])

    _deductResources(cost)

    // Pick a builder — prefer souls with Builder role
    const builder = aliveSouls.find((s) => s.role === 'Builder' && s.age > 8)
      || aliveSouls.find((s) => s.age > 8)
    this._addToQueue(type, city, builder?.id || null, 5 + Math.random() * 5)

    if (store) {
      store.getState().addEventLog({
        year: Math.round(year),
        text: `The community begins building a ${type.replace(/_/g, ' ')}.`,
        type: 'construction',
      })
    }
  }

  // When population is large enough, souls far from any city found a new village
  _checkNewVillage(aliveSouls, year, era, store) {
    if (aliveSouls.length < 8) return
    if (this.cities.length >= 6) return // cap at 6 villages

    // Find souls far from all cities
    const farSouls = aliveSouls.filter((s) => {
      if (s.age < 15) return false
      const pos = getSoulPosition(s.id)
      if (!pos) return false
      return this.cities.every((c) => {
        const dx = pos.x - c.position.x
        const dz = pos.z - c.position.z
        return Math.sqrt(dx * dx + dz * dz) > 40
      })
    })

    if (farSouls.length < 2) return
    if (Math.random() > 0.02) return // 2% chance per tick when conditions are met

    const founder = farSouls[Math.floor(Math.random() * farSouls.length)]
    const pos = getSoulPosition(founder.id)
    if (!pos) return

    // Check that the position is on dry land
    const y = sampleHeight(heightmap, pos.x, pos.z)
    if (y < WATER_LEVEL + 0.5) return

    const villageName = _villageNameForEra(era, this.cities.length)
    const village = {
      id: nanoid(),
      name: villageName,
      position: { x: pos.x, z: pos.z },
      population: 1,
      capacity: 10,
      buildings: [],
      founded: year,
    }
    this.cities.push(village)

    // Place a starter building at the new village
    const availableTypes = era?.buildingTypes || []
    if (availableTypes.length > 0) {
      const starterType = availableTypes[0] // simplest building
      this._addToQueue(starterType, village, founder.id, 4)
    }

    if (store) {
      store.getState().addEventLog({
        year: Math.round(year),
        text: `${founder.llmName} founds a new settlement: ${villageName}!`,
        type: 'village_founded',
        soulId: founder.id,
      })
    }
  }

  _processSoulAmbition(soul, city, era, year, store) {
    if (!soul.currentAmbition) return
    const buildingType = this._mapAmbitionToBuilding(soul.currentAmbition.goal, era)
    if (!buildingType) return

    // Check if already in queue
    if (this.buildingQueue.some((b) => b.builder === soul.id)) return
    if (this.constructionSites.some((s) => s.builder === soul.id)) return

    const cost = BUILDING_COSTS[_getBuildingSize(buildingType)]
    if (!_canAfford(cost)) return

    _deductResources(cost)
    this._addToQueue(buildingType, city, soul.id, soul.currentAmbition.timeline || 8)

    if (store) {
      store.getState().addEventLog({
        year: Math.round(year),
        text: `${soul.llmName} begins building a ${buildingType.replace(/_/g, ' ')}.`,
        type: 'construction',
        soulId: soul.id,
      })
    }
  }

  _addToQueue(type, city, builderId, duration) {
    // Place building on dry land, spread around the city
    let position = null
    const existingPositions = [
      ...city.buildings.map((b) => b.position),
      ...this.constructionSites.filter((s) => s.cityId === city.id).map((s) => s.position),
      ...this.buildingQueue.filter((b) => b.cityId === city.id).map((b) => b.position),
    ]

    for (let attempt = 0; attempt < 50; attempt++) {
      const angle = Math.random() * Math.PI * 2
      // Spread buildings across a wider area — 8 to 65 units from city center
      const distance = 8 + Math.random() * 57
      const x = city.position.x + Math.cos(angle) * distance
      const z = city.position.z + Math.sin(angle) * distance
      const y = sampleHeight(heightmap, x, z)

      if (y <= WATER_LEVEL + 0.5) continue

      // Check gap from existing buildings
      const tooClose = existingPositions.some((p) => {
        const dx = (p.x ?? p[0] ?? 0) - x
        const dz = (p.z ?? p[2] ?? 0) - z
        return Math.sqrt(dx * dx + dz * dz) < MIN_BUILDING_GAP
      })
      if (tooClose) continue

      position = { x, z, y }
      break
    }

    if (!position) {
      // Fallback: offset from city center
      const angle = Math.random() * Math.PI * 2
      const dist = 10 + Math.random() * 20
      position = {
        x: city.position.x + Math.cos(angle) * dist,
        z: city.position.z + Math.sin(angle) * dist,
        y: 0,
      }
    }

    this.buildingQueue.push({
      id: nanoid(),
      type,
      position,
      cityId: city.id,
      builder: builderId,
      startYear: null,
      duration,
      progress: 0,
    })
  }

  _processConstruction(year, store, souls) {
    let sitesChanged = false

    // Allow up to 10 concurrent construction sites
    while (this.buildingQueue.length > 0 && this.constructionSites.length < 10) {
      const item = this.buildingQueue.shift()
      item.startYear = year
      item._lastProgressYear = year
      this.constructionSites.push(item)
      sitesChanged = true

      if (store) {
        store.getState().addBuilding({
          id: item.id,
          type: item.type,
          position: [item.position.x, item.position.y || 0, item.position.z],
          progress: 0,
        })
      }
    }

    // Update progress (builder-presence-aware)
    const completed = []
    for (const site of this.constructionSites) {
      if (!site.startYear) continue

      let builderMultiplier = 0.5 // base community effort
      if (souls) {
        for (const soul of souls) {
          if (!soul.isAlive) continue
          if (soul.currentActivity !== 'build_structure' && soul.currentActivity !== 'work') continue
          const pos = getSoulPosition(soul.id)
          if (!pos) continue
          const dx = pos.x - site.position.x
          const dz = pos.z - site.position.z
          if (Math.sqrt(dx * dx + dz * dz) < 35) {
            builderMultiplier += 0.5
          }
        }
        builderMultiplier = Math.min(3.0, builderMultiplier)
      }

      const lastYear = site._lastProgressYear || site.startYear
      const elapsed = year - lastYear
      site._lastProgressYear = year
      const baseRate = 1.0 / site.duration
      site.progress = Math.min(1.0, site.progress + baseRate * builderMultiplier * elapsed)

      if (store) {
        const lastSynced = this.lastSyncedProgress[site.id] || 0
        if (site.progress - lastSynced >= 0.02 || site.progress >= 1.0) {
          this.lastSyncedProgress[site.id] = site.progress
          store.getState().updateBuilding(site.id, { progress: site.progress })
        }
      }

      if (site.progress >= 1.0) {
        completed.push(site)
      }
    }

    // Complete buildings
    for (const site of completed) {
      this.constructionSites = this.constructionSites.filter((s) => s.id !== site.id)
      delete this.lastSyncedProgress[site.id]
      sitesChanged = true
      const city = this.cities.find((c) => c.id === site.cityId)
      if (city) {
        city.buildings.push({
          id: site.id,
          type: site.type,
          position: site.position,
          builtYear: year,
        })
        city.capacity += 3
      }

      if (store) {
        store.getState().addEventLog({
          year: Math.round(year),
          text: `A new ${site.type.replace(/_/g, ' ')} has been completed!`,
          type: 'building_complete',
        })
      }
    }

    if (sitesChanged && store) {
      store.getState().setConstructionSites(
        this.constructionSites.map((s) => ({
          id: s.id,
          position: s.position,
          type: s.type,
          builder: s.builder,
          progress: s.progress,
        }))
      )
    }
  }

  _mapAmbitionToBuilding(ambitionText, era) {
    if (!ambitionText || !era) return null
    const text = ambitionText.toLowerCase()
    const available = era.buildingTypes || []
    if (available.length === 0) return null

    // 1) Direct name hit: LLM sometimes names the building outright.
    for (const b of available) {
      const tokens = b.toLowerCase().split('_').filter((t) => t.length > 3)
      if (tokens.some((t) => text.includes(t))) return b
    }

    // 2) Concept keywords → building tokens.
    const keywords = {
      temple:      ['temple', 'worship', 'prayer', 'sacred', 'divine', 'cathedral', 'church', 'shrine', 'ritual', 'priest'],
      market:      ['market', 'trade', 'sell', 'buy', 'commerce', 'goods', 'stall', 'bazaar', 'merchant', 'shop'],
      farm:        ['farm', 'food', 'grow', 'harvest', 'agriculture', 'field', 'crop', 'grain'],
      castle:      ['castle', 'fort', 'defense', 'defend', 'protect', 'stronghold', 'wall', 'keep', 'guard'],
      university:  ['learn', 'study', 'knowledge', 'school', 'educate', 'university', 'scholar', 'wisdom', 'library', 'teach'],
      hospital:    ['heal', 'medicine', 'sick', 'health', 'hospital', 'cure', 'remedy', 'care'],
      factory:     ['forge', 'make', 'produce', 'manufacture', 'factory', 'workshop', 'craft', 'industry'],
      theatre:     ['art', 'music', 'perform', 'theatre', 'theater', 'culture', 'song', 'dance', 'story'],
      observatory: ['star', 'sky', 'observe', 'science', 'discover', 'astronomy', 'cosmos', 'telescope', 'experiment'],
      hut:         ['home', 'house', 'shelter', 'hut', 'cottage', 'dwell', 'live', 'family'],
      tavern:      ['tavern', 'inn', 'drink', 'ale', 'feast', 'gather'],
      mine:        ['mine', 'dig', 'ore', 'coal', 'excavate'],
      bank:        ['bank', 'gold', 'wealth', 'coin', 'treasury', 'finance'],
      tower:       ['tower', 'skyscraper', 'rise', 'tall', 'apartment'],
      server:      ['data', 'server', 'network', 'compute', 'digital', 'machine', 'mind', 'quantum', 'ai'],
    }

    for (const [buildingKey, words] of Object.entries(keywords)) {
      if (!words.some((w) => text.includes(w))) continue
      const match = available.find((b) => b.includes(buildingKey))
      if (match) return match
    }

    // No confident match — don't silently build a random building. Community
    // build still supplies era-appropriate structures on its own cadence.
    return null
  }

  getCities() {
    return this.cities
  }

  getActiveConstruction() {
    return this.constructionSites
  }

  getAllBuildings() {
    return this.cities.flatMap((c) => c.buildings)
  }

  toJSON() {
    return {
      cities: this.cities,
      buildingQueue: this.buildingQueue,
      constructionSites: this.constructionSites,
      processedAmbitions: [...this.processedAmbitions],
      lastCommunityBuild: this.lastCommunityBuild,
    }
  }

  rehydrate(data) {
    this.cities = data.cities || []
    this.buildingQueue = data.buildingQueue || []
    this.constructionSites = data.constructionSites || []
    this.processedAmbitions = new Set(data.processedAmbitions || [])
    this.lastCommunityBuild = data.lastCommunityBuild || -9999
    this.initialized = true
  }
}

function _villageNameForEra(era, index) {
  const names = {
    ancient: ['River Bend', 'High Stones', 'Sun Hollow', 'Dawn Ridge', 'Ember Hill'],
    medieval: ['Thornfield', 'Ironhold', 'Northmere', 'Ashford', 'Stonebridge'],
    renaissance: ['Porto Nuovo', 'Bella Vista', 'Golden Shore', 'Starpoint', 'Crown Hill'],
    industrial: ['Milltown', 'Ironworks', 'Bridgeport', 'Steamhaven', 'Forge Creek'],
    modern: ['New Haven', 'Westpark', 'Silicon Grove', 'Lakeview', 'Metro Heights'],
    singularity: ['Node Alpha', 'Quantum Gate', 'Neural Point', 'Nexus Prime', 'Zero Dawn'],
  }
  const pool = names[era?.id] || names.ancient
  return pool[(index - 1) % pool.length] || `Settlement ${index}`
}

export const cityEngine = new CityEngine()
