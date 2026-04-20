'use client'

import { cityEngine } from './CityEngine'
import { economySystem, diplomacySystem } from './EconomySystem'
import { relationshipManager } from './SoulRelations'
import { interactionEngine } from './InteractionEngine'
import { weatherSystem } from './WeatherSystem'
import { populationSystem } from './PopulationSystem'
import { clearAllCampfires } from './CampfireRegistry'

export function resetAllEngines() {
  cityEngine.reset()
  economySystem.reset()
  diplomacySystem.reset()
  relationshipManager.reset()
  interactionEngine.reset()
  weatherSystem.reset()
  populationSystem.reset()
  clearAllCampfires()
}
