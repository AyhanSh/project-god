'use client'

import { useGameStore } from '@/store/useGameStore'

export class EconomySystem {
  constructor() {
    this.foodSupply = 100
    this.goldReserves = 50
    this.tradeRoutes = []
    this.caravans = []
    this.lastUpdateYear = null
  }

  reset() {
    this.foodSupply = 100
    this.goldReserves = 50
    this.tradeRoutes = []
    this.caravans = []
    this.lastUpdateYear = null
  }

  update(souls, buildings, year, store, era) {
    const aliveSouls = souls.filter((s) => s.isAlive)
    if (aliveSouls.length === 0) return

    // Economy ticks in simulated years, not sim frames (10Hz). This keeps
    // production/consumption readable as food-per-year and makes famine
    // actually reachable on a human-scale playthrough.
    if (this.lastUpdateYear === null) {
      this.lastUpdateYear = Math.floor(year)
      return
    }
    const yearsElapsed = Math.floor(year) - this.lastUpdateYear
    if (yearsElapsed <= 0) return
    this.lastUpdateYear = Math.floor(year)

    // Tech multiplier: 1.0 ancient → 2.25 singularity. This is the *only*
    // mechanical teeth era transitions have — without it farmers in 2070
    // produce the same food as stone-age farmers.
    const techLevel = era?.techLevel ?? 0
    const techMult = 1 + techLevel * 0.25

    // Production: souls working at farms/factories produce food (food/year)
    const farmers = aliveSouls.filter((s) =>
      s.currentActivity === 'work' &&
      (s.role === 'Farmer' || s.currentLocation === 'farm' || s.currentLocation === 'factory')
    )
    const productionRate = (farmers.length * 8 + aliveSouls.length * 0.5) * techMult

    // Consumption (food/year)
    const consumptionRate = aliveSouls.length * 6

    // Food balance — capped with headroom for a decent population
    const maxFood = Math.max(200, aliveSouls.length * 40 * techMult)
    this.foodSupply = Math.max(0, Math.min(maxFood, this.foodSupply + (productionRate - consumptionRate) * yearsElapsed))

    // Gold from traders (gold/year)
    const traders = aliveSouls.filter((s) =>
      s.role === 'Trader' || s.role === 'Merchant' || s.role === 'Banker'
    )
    this.goldReserves += traders.length * 3 * techMult * yearsElapsed

    // Wealth distribution affects happiness (applied per elapsed year)
    for (const soul of aliveSouls) {
      if (this.foodSupply < aliveSouls.length * 3) {
        // Famine conditions
        soul.happiness = Math.max(0, soul.happiness - 8 * yearsElapsed)
        soul.stress = Math.min(100, soul.stress + 8 * yearsElapsed)
        soul.health = Math.max(0, soul.health - 4 * yearsElapsed)
      } else if (this.foodSupply > aliveSouls.length * 15) {
        // Prosperity
        soul.happiness = Math.min(100, soul.happiness + 2 * yearsElapsed)
      }
    }

    // Update store
    if (store) {
      store.getState().foodSupply = this.foodSupply
    }
  }

  harvestResource(type, amount) {
    // Accumulate fractional amounts — the floor was rounding tiny per-tick
    // values to 0, so resources never increased.
    useGameStore.getState().addResource(type, amount)
  }
}

export class DiplomacySystem {
  constructor() {
    this.alliances = []   // [{ id, members: [soulId], formedYear, type }]
    this.wars = []        // [{ startYear, participants, type, endYear? }]
    this.treaties = []    // [{ id, parties: [soulId, soulId], type, year, duration }]
    this.worldLeader = null
    this.lastAllianceCheck = -9999
    this.lastTreatyCheck = -9999
  }

  reset() {
    this.alliances = []
    this.wars = []
    this.treaties = []
    this.worldLeader = null
    this.lastAllianceCheck = -9999
    this.lastTreatyCheck = -9999
  }

  update(souls, cities, year, store) {
    const aliveSouls = souls.filter((s) => s.isAlive && s.age > 20)
    if (aliveSouls.length === 0) return

    // --- Leader election ---
    const sorted = [...aliveSouls].sort((a, b) => (b.influence || 0) - (a.influence || 0))
    const topSoul = sorted[0]

    if (topSoul && topSoul.influence > 50) {
      if (!this.worldLeader || this.worldLeader.id !== topSoul.id) {
        const prevLeader = this.worldLeader
        this.worldLeader = topSoul
        if (store && (!prevLeader || prevLeader.id !== topSoul.id)) {
          topSoul.influence = Math.min(100, (topSoul.influence || 0) + 20)
          store.getState().addEventLog({
            year: Math.round(year),
            text: `${topSoul.llmName} rises as the world leader.`,
            type: 'leader_rise',
            soulId: topSoul.id,
          })
        }
      }
    }

    // --- Alliance formation (check every ~10 game years) ---
    if (year - this.lastAllianceCheck > 10) {
      this.lastAllianceCheck = year
      this._checkAlliances(aliveSouls, year, store)
    }

    // --- Treaty expiration ---
    this.treaties = this.treaties.filter((t) => year - t.year < (t.duration || 50))

    // --- War conditions ---
    const avgHappiness = aliveSouls.reduce((s, a) => s + a.happiness, 0) / aliveSouls.length
    if (avgHappiness < 25 && this.wars.length === 0 && Math.random() < 0.01) {
      this._startWar(aliveSouls, year, 'civil_unrest', store)
    }

    // --- Peace treaties (end wars when happiness recovers) ---
    if (this.wars.length > 0 && avgHappiness > 50 && Math.random() < 0.02) {
      const endingWar = this.wars[0]
      this.treaties.push({
        id: `treaty_${Math.round(year)}`,
        parties: endingWar.participants.slice(0, 2),
        type: 'peace',
        year,
        duration: 30 + Math.random() * 20,
      })
      if (store) {
        store.getState().addEventLog({
          year: Math.round(year),
          text: 'A peace treaty has been signed. The war is over.',
          type: 'treaty',
        })
      }
      this.wars.shift()
    }

    // End wars after a while
    this.wars = this.wars.filter((w) => year - w.startYear < 30)

    // War effects: reduce happiness and health of participants
    if (this.isAtWar()) {
      for (const soul of aliveSouls) {
        soul.happiness = Math.max(0, soul.happiness - 0.05)
        soul.stress = Math.min(100, soul.stress + 0.03)
      }
    }

    // Alliance benefits: boost happiness for allied souls
    for (const alliance of this.alliances) {
      for (const memberId of alliance.members) {
        const soul = aliveSouls.find((s) => s.id === memberId)
        if (soul) {
          soul.happiness = Math.min(100, soul.happiness + 0.01)
        }
      }
    }

    // Sync war state to store
    if (store) {
      store.getState().setWarOngoing(this.isAtWar())
    }
  }

  _checkAlliances(aliveSouls, year, store) {
    if (aliveSouls.length < 2) return

    // Souls with high mutual trust can form alliances
    for (let i = 0; i < aliveSouls.length; i++) {
      for (let j = i + 1; j < aliveSouls.length; j++) {
        const a = aliveSouls[i]
        const b = aliveSouls[j]

        // Skip if already allied
        if (this.areAllied(a.id, b.id)) continue

        // Check if both have high influence and similar goals
        const bothInfluential = (a.influence || 0) > 30 && (b.influence || 0) > 30
        const compatible = a.role !== b.role // different roles complement each other

        if (bothInfluential && compatible && Math.random() < 0.15) {
          const alliance = {
            id: `alliance_${a.id}_${b.id}`,
            members: [a.id, b.id],
            formedYear: year,
            type: 'mutual_defense',
          }
          this.alliances.push(alliance)

          if (store) {
            store.getState().addEventLog({
              year: Math.round(year),
              text: `${a.llmName} and ${b.llmName} form an alliance.`,
              type: 'alliance',
            })
          }
        }
      }
    }

    // Clean up alliances with dead members
    this.alliances = this.alliances.filter((a) =>
      a.members.some((id) => aliveSouls.find((s) => s.id === id))
    )
  }

  _startWar(aliveSouls, year, type, store) {
    // Don't start wars if a peace treaty is active
    if (this.treaties.some((t) => t.type === 'peace')) return

    this.wars.push({
      startYear: year,
      participants: aliveSouls.map((s) => s.id),
      type,
    })

    if (store) {
      const text = type === 'civil_unrest'
        ? 'Civil unrest erupts! Unhappiness drives the people to war.'
        : 'War has been declared!'
      store.getState().addEventLog({
        year: Math.round(year),
        text,
        type: 'war',
      })
    }
  }

  areAllied(soulIdA, soulIdB) {
    return this.alliances.some((a) =>
      a.members.includes(soulIdA) && a.members.includes(soulIdB)
    )
  }

  isAtWar() {
    return this.wars.length > 0
  }

  getLeader() {
    return this.worldLeader
  }

  getAlliances() {
    return this.alliances
  }

  getTreaties() {
    return this.treaties
  }
}

// Rehydration support
EconomySystem.prototype.toJSON = function () {
  return { foodSupply: this.foodSupply, goldReserves: this.goldReserves }
}
EconomySystem.prototype.rehydrate = function (data) {
  this.foodSupply = data.foodSupply ?? 100
  this.goldReserves = data.goldReserves ?? 50
}

DiplomacySystem.prototype.toJSON = function () {
  return {
    alliances: this.alliances,
    wars: this.wars,
    treaties: this.treaties,
    worldLeaderId: this.worldLeader?.id || null,
    lastAllianceCheck: this.lastAllianceCheck,
    lastTreatyCheck: this.lastTreatyCheck,
  }
}
DiplomacySystem.prototype.rehydrate = function (data, souls) {
  this.alliances = data.alliances || []
  this.wars = data.wars || []
  this.treaties = data.treaties || []
  this.lastAllianceCheck = data.lastAllianceCheck || -9999
  this.lastTreatyCheck = data.lastTreatyCheck || -9999
  if (data.worldLeaderId && souls) {
    this.worldLeader = souls.find((s) => s.id === data.worldLeaderId) || null
  }
}

export const economySystem = new EconomySystem()
export const diplomacySystem = new DiplomacySystem()
