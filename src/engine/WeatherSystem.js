'use client'

export class WeatherSystem {
  constructor() {
    this.currentWeather = 'clear'
    this.season = 'spring'
    this.temperature = 20
    this.drought = false
    this.stormActive = false
    this.stormChance = 0.1
  }

  update(year, store) {
    // Season cycles: every 25 game years represents one season cycle
    const cyclePos = ((year % 100) + 100) % 100 / 100
    if (cyclePos < 0.25) this.season = 'spring'
    else if (cyclePos < 0.5) this.season = 'summer'
    else if (cyclePos < 0.75) this.season = 'autumn'
    else this.season = 'winter'

    // Temperature by season
    const seasonTemps = { spring: 18, summer: 30, autumn: 14, winter: 2 }
    this.temperature = seasonTemps[this.season] + (Math.random() - 0.5) * 10

    // Random weather events (per tick, so keep probability low)
    const rand = Math.random()

    if (rand < 0.002) {
      this.currentWeather = 'storm'
      this.stormActive = true
    } else if (rand < 0.01 && this.season === 'winter') {
      this.currentWeather = 'snow'
    } else if (rand < 0.02) {
      this.currentWeather = 'rain'
    } else if (rand < 0.04 && this.season === 'summer') {
      this.currentWeather = 'heatwave'
      this.drought = true
    } else if (rand < 0.95 && this.currentWeather !== 'clear') {
      // Weather gradually clears
      if (Math.random() < 0.1) {
        this.currentWeather = 'clear'
        this.stormActive = false
        this.drought = false
      }
    }

    // Update store
    if (store) {
      store.getState().setWeather(this.currentWeather)
      store.getState().setSeason(this.season)
    }
  }

  getSkyTint() {
    const tints = {
      clear: { r: 1, g: 1, b: 1 },
      rain: { r: 0.7, g: 0.7, b: 0.8 },
      storm: { r: 0.4, g: 0.4, b: 0.5 },
      snow: { r: 0.9, g: 0.92, b: 0.95 },
      heatwave: { r: 1.1, g: 1.0, b: 0.85 },
    }
    return tints[this.currentWeather] || tints.clear
  }

  getSeasonTreeColor() {
    const colors = {
      spring: '#7CCD7C',
      summer: '#228B22',
      autumn: '#CD853F',
      winter: '#8B8682',
    }
    return colors[this.season] || colors.spring
  }

  getAmbientModifier() {
    const mods = {
      clear: 1.0,
      rain: 0.7,
      storm: 0.4,
      snow: 0.85,
      heatwave: 1.1,
    }
    return mods[this.currentWeather] || 1.0
  }

  getFogModifier() {
    const mods = {
      clear: 1.0,
      rain: 1.5,
      storm: 2.5,
      snow: 2.0,
      heatwave: 1.2,
    }
    return mods[this.currentWeather] || 1.0
  }
}

export const weatherSystem = new WeatherSystem()
