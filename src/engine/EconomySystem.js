'use client'

export class EconomySystem {
  constructor() {
    this.foodSupply = 100
    this.goldReserves = 50
    this.tradeRoutes = []
    this.caravans = []
  }

  update(souls, buildings, year, store) {
    const aliveSouls = souls.filter((s) => s.isAlive)
    if (aliveSouls.length === 0) return

    // Production: souls working at farms/factories produce food
    const farmers = aliveSouls.filter((s) =>
      s.currentActivity === 'work' &&
      (s.role === 'Farmer' || s.currentLocation === 'farm')
    )
    const productionRate = farmers.length * 2 + aliveSouls.length * 0.5

    // Consumption
    const consumptionRate = aliveSouls.length * 1.2

    // Food balance
    this.foodSupply = Math.max(0, Math.min(200, this.foodSupply + (productionRate - consumptionRate) * 0.01))

    // Gold from traders
    const traders = aliveSouls.filter((s) =>
      s.role === 'Trader' || s.role === 'Merchant' || s.role === 'Banker'
    )
    this.goldReserves += traders.length * 0.5

    // Wealth distribution affects happiness
    for (const soul of aliveSouls) {
      if (this.foodSupply < aliveSouls.length * 0.6) {
        // Famine conditions
        soul.happiness = Math.max(0, soul.happiness - 0.1)
        soul.stress = Math.min(100, soul.stress + 0.1)
        soul.health = Math.max(0, soul.health - 0.05)
      } else if (this.foodSupply > aliveSouls.length * 1.5) {
        // Prosperity
        soul.happiness = Math.min(100, soul.happiness + 0.02)
      }
    }

    // Update store
    if (store) {
      store.getState().foodSupply = this.foodSupply
    }
  }
}

export class DiplomacySystem {
  constructor() {
    this.alliances = []
    this.wars = []
    this.worldLeader = null
  }

  update(souls, cities, year) {
    const aliveSouls = souls.filter((s) => s.isAlive && s.age > 20)
    if (aliveSouls.length === 0) return

    // Find most influential soul
    const sorted = [...aliveSouls].sort((a, b) => (b.influence || 0) - (a.influence || 0))
    const topSoul = sorted[0]

    if (topSoul && topSoul.influence > 50) {
      if (!this.worldLeader || this.worldLeader.id !== topSoul.id) {
        this.worldLeader = topSoul
      }
    }

    // Check for war conditions
    const avgHappiness = aliveSouls.reduce((s, a) => s + a.happiness, 0) / aliveSouls.length
    if (avgHappiness < 25 && this.wars.length === 0 && Math.random() < 0.01) {
      this.wars.push({
        startYear: year,
        participants: aliveSouls.map((s) => s.id),
        type: 'civil_unrest',
      })
    }

    // End wars after a while
    this.wars = this.wars.filter((w) => year - w.startYear < 30)
  }

  isAtWar() {
    return this.wars.length > 0
  }

  getLeader() {
    return this.worldLeader
  }
}

export const economySystem = new EconomySystem()
export const diplomacySystem = new DiplomacySystem()
