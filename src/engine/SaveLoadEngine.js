'use client'

import { useGameStore } from '@/store/useGameStore'
import { getWorldEngine } from './WorldEngine'
import { cityEngine } from './CityEngine'
import { economySystem, diplomacySystem } from './EconomySystem'
import { relationshipManager } from './SoulRelations'

const STORAGE_PREFIX = 'projectgod:'

export class SaveLoadEngine {
  save(slot = 'auto') {
    const store = useGameStore
    const state = store.getState()
    const worldEngine = getWorldEngine(store)

    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      // Store state (excluding UI transients and terrain)
      store: {
        currentYear: state.currentYear,
        timeOfDay: state.timeOfDay,
        currentEra: state.currentEra,
        speedMultiplier: state.speedMultiplier,
        weather: state.weather,
        season: state.season,
        temperature: state.temperature,
        worldState: state.worldState,
        techLevel: state.techLevel,
        lastMajorEvent: state.lastMajorEvent,
        population: state.population,
        eventLog: state.eventLog.slice(0, 50),
        foodSupply: state.foodSupply,
        happinessAvg: state.happinessAvg,
        warOngoing: state.warOngoing,
        wood: state.wood,
        stone: state.stone,
        ore: state.ore,
        godFavor: state.godFavor,
        buildings: state.buildings,
      },
      // Engine states
      worldEngine: worldEngine.toJSON(),
      cityEngine: cityEngine.toJSON(),
      economySystem: economySystem.toJSON(),
      diplomacySystem: diplomacySystem.toJSON(),
      relationships: relationshipManager.toJSON(),
    }

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(payload))
      return { success: true, slot, year: Math.round(state.currentYear) }
    } catch (e) {
      return { success: false, reason: e.message }
    }
  }

  load(slot = 'auto') {
    const store = useGameStore
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slot}`)
    if (!raw) return { success: false, reason: 'No save found' }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return { success: false, reason: 'Corrupted save' }
    }

    const worldEngine = getWorldEngine(store)

    // Restore store state
    const s = payload.store
    store.setState({
      currentYear: s.currentYear,
      timeOfDay: s.timeOfDay || 0,
      currentEra: s.currentEra,
      speedMultiplier: s.speedMultiplier,
      weather: s.weather,
      season: s.season,
      temperature: s.temperature,
      worldState: s.worldState,
      techLevel: s.techLevel,
      lastMajorEvent: s.lastMajorEvent,
      population: s.population,
      eventLog: s.eventLog || [],
      foodSupply: s.foodSupply,
      happinessAvg: s.happinessAvg,
      warOngoing: s.warOngoing,
      wood: s.wood || 0,
      stone: s.stone || 0,
      ore: s.ore || 0,
      godFavor: s.godFavor,
      buildings: s.buildings || [],
      paused: true, // always pause on load
    })

    // Restore engines
    worldEngine.rehydrate(payload.worldEngine)
    cityEngine.rehydrate(payload.cityEngine)
    economySystem.rehydrate(payload.economySystem)
    diplomacySystem.rehydrate(payload.diplomacySystem, worldEngine.getSouls())
    relationshipManager.fromJSON(payload.relationships || {})

    // Sync construction sites to store
    store.getState().setConstructionSites(
      cityEngine.constructionSites.map((s) => ({
        id: s.id,
        position: s.position,
        builder: s.builder,
        progress: s.progress,
      }))
    )

    return { success: true, slot, year: Math.round(s.currentYear) }
  }

  list() {
    const saves = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key.startsWith(STORAGE_PREFIX)) continue
      const slot = key.slice(STORAGE_PREFIX.length)
      try {
        const data = JSON.parse(localStorage.getItem(key))
        saves.push({
          slot,
          savedAt: data.savedAt,
          year: Math.round(data.store?.currentYear || 0),
        })
      } catch {
        // skip corrupted
      }
    }
    return saves
  }

  delete(slot) {
    localStorage.removeItem(`${STORAGE_PREFIX}${slot}`)
  }
}

export const saveLoadEngine = new SaveLoadEngine()
