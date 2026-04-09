'use client'

import { nanoid } from 'nanoid'
import { sampleHeight, WATER_LEVEL, FLAT_RADIUS } from '@/world/Terrain'
import { generateHeightmap } from '@/world/Terrain'

const heightmap = generateHeightmap(1337)

export class CityEngine {
  constructor() {
    this.cities = []
    this.buildingQueue = []
    this.constructionSites = []
    this.lastSyncedProgress = {}
    this.initialized = false
  }

  initialize() {
    if (this.initialized) return
    // Start with one settlement
    this.cities.push({
      id: nanoid(),
      name: 'First Settlement',
      position: { x: 0, z: 0 },
      population: 6,
      capacity: 20,
      buildings: [],
      founded: -3000,
    })
    this.initialized = true
  }

  update(souls, year, era, store) {
    if (!this.initialized) this.initialize()

    for (const city of this.cities) {
      const citySouls = souls.filter((s) => s.isAlive)
      city.population = citySouls.length

      // Population drives growth
      const growthPressure = city.population / city.capacity
      if (growthPressure > 0.7 && Math.random() < 0.005) {
        this._planExpansion(city, era)
      }

      // Soul ambitions drive building
      for (const soul of citySouls) {
        if (soul.currentAmbition && Math.random() < 0.002) {
          this._processSoulAmbition(soul, city, era, year, store)
        }
      }

      // Process construction
      this._processConstruction(year, store)
    }
  }

  _planExpansion(city, era) {
    if (!era) return
    const availableTypes = era.buildingTypes || []
    if (availableTypes.length === 0) return

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    this._addToQueue(type, city, null, 10)
    city.capacity += 5
  }

  _processSoulAmbition(soul, city, era, year, store) {
    if (!soul.currentAmbition) return
    const buildingType = this._mapAmbitionToBuilding(soul.currentAmbition.goal, era)
    if (!buildingType) return

    // Check if already in queue
    if (this.buildingQueue.some((b) => b.builder === soul.id)) return

    this._addToQueue(buildingType, city, soul.id, soul.currentAmbition.timeline || 10)

    if (store) {
      store.getState().addEventLog({
        year: Math.round(year),
        text: `${soul.llmName} begins construction of a ${buildingType.replace(/_/g, ' ')}.`,
        type: 'construction',
        soulId: soul.id,
      })
    }
  }

  _addToQueue(type, city, builderId, duration) {
    // Find a dry land position for the building
    let position = null
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2
      const distance = 5 + Math.random() * (FLAT_RADIUS - 4)
      const x = city.position.x + Math.cos(angle) * distance
      const z = city.position.z + Math.sin(angle) * distance
      const y = sampleHeight(heightmap, x, z)
      if (y > WATER_LEVEL + 0.5) {
        position = { x, z, y }
        break
      }
    }
    if (!position) {
      // Fallback: place near center
      position = { x: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 8, y: 0 }
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

  _processConstruction(year, store) {
    let sitesChanged = false

    // Move queued items to active construction
    while (this.buildingQueue.length > 0 && this.constructionSites.length < 5) {
      const item = this.buildingQueue.shift()
      item.startYear = year
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

    // Update progress
    const completed = []
    for (const site of this.constructionSites) {
      if (!site.startYear) continue
      site.progress = Math.min(1.0, (year - site.startYear) / site.duration)

      // Sync to store throttled by 2% increments
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
      }

      if (store) {
        store.getState().addEventLog({
          year: Math.round(year),
          text: `A new ${site.type.replace(/_/g, ' ')} has been completed!`,
          type: 'building_complete',
        })
      }
    }

    // Expose construction sites to store for SoulEntity positioning
    if (sitesChanged && store) {
      store.getState().setConstructionSites(
        this.constructionSites.map((s) => ({
          id: s.id,
          position: s.position,
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

    // Keyword matching
    const keywords = {
      temple: ['temple', 'worship', 'prayer', 'sacred', 'divine', 'cathedral', 'church'],
      market: ['market', 'trade', 'sell', 'buy', 'commerce', 'goods'],
      farm: ['farm', 'food', 'grow', 'harvest', 'agriculture'],
      castle: ['castle', 'fort', 'defense', 'protect', 'stronghold'],
      university: ['learn', 'study', 'knowledge', 'school', 'educate', 'university'],
      hospital: ['heal', 'medicine', 'sick', 'health', 'hospital'],
      factory: ['build', 'make', 'produce', 'manufacture', 'factory'],
      theatre: ['art', 'music', 'perform', 'theatre', 'culture'],
      observatory: ['star', 'sky', 'observe', 'science', 'discover'],
    }

    for (const [buildingKey, words] of Object.entries(keywords)) {
      if (words.some((w) => text.includes(w))) {
        // Find matching building type in era
        const match = available.find((b) => b.includes(buildingKey.replace(/[_-]/g, ''))) ||
          available.find((b) => b.includes(buildingKey.split('_')[0]))
        if (match) return match
      }
    }

    // Fallback: random era-appropriate building
    return available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : null
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
}

export const cityEngine = new CityEngine()
