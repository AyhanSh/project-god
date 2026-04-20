'use client'

export const POPULATION = {
  MAX_RENDERED_SOULS: 100,
  MAX_TOTAL_SOULS: 100,
  BACKGROUND_THRESHOLD: 100,
  BREEDING_COOLDOWN_MIN: 2,
  BREEDING_COOLDOWN_MAX: 5,
  MAX_CHILDREN_PER_COUPLE: 8,
  BREEDING_CHANCE: 0.5,
}

export class PopulationSystem {
  constructor() {
    this.totalBorn = 0
    this.totalDied = 0
    this.generationStats = {}
  }

  reset() {
    this.totalBorn = 0
    this.totalDied = 0
    this.generationStats = {}
  }

  registerBirth(soul) {
    this.totalBorn++
    const gen = soul.generation || 1
    if (!this.generationStats[gen]) this.generationStats[gen] = { born: 0, alive: 0, died: 0 }
    this.generationStats[gen].born++
    this.generationStats[gen].alive++
  }

  registerDeath(soul) {
    this.totalDied++
    const gen = soul.generation || 1
    if (!this.generationStats[gen]) this.generationStats[gen] = { born: 0, alive: 0, died: 0 }
    this.generationStats[gen].alive = Math.max(0, this.generationStats[gen].alive - 1)
    this.generationStats[gen].died++
  }

  getStats() {
    return {
      totalBorn: this.totalBorn,
      totalDied: this.totalDied,
      generationStats: { ...this.generationStats },
    }
  }

  toJSON() {
    return { totalBorn: this.totalBorn, totalDied: this.totalDied, generationStats: { ...this.generationStats } }
  }

  rehydrate(data) {
    this.totalBorn = data.totalBorn || 0
    this.totalDied = data.totalDied || 0
    this.generationStats = data.generationStats || {}
  }
}

export const populationSystem = new PopulationSystem()
