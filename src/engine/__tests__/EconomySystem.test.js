import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EconomySystem, DiplomacySystem } from '../EconomySystem'

// Mock useGameStore since EconomySystem.harvestResource uses it
vi.mock('@/store/useGameStore', () => {
  let resources = { wood: 0, stone: 0, ore: 0 }
  return {
    useGameStore: {
      getState: () => ({
        addResource: (type, amount) => { resources[type] = (resources[type] || 0) + amount },
        foodSupply: 100,
        setWarOngoing: vi.fn(),
        addEventLog: vi.fn(),
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    },
    _getResources: () => resources,
    _resetResources: () => { resources = { wood: 0, stone: 0, ore: 0 } },
  }
})

describe('EconomySystem', () => {
  let econ

  beforeEach(() => {
    econ = new EconomySystem()
  })

  it('starts with default food and gold', () => {
    expect(econ.foodSupply).toBe(100)
    expect(econ.goldReserves).toBe(50)
  })

  it('farmers increase food supply over years', () => {
    const souls = [
      { isAlive: true, happiness: 50, stress: 30, health: 80, role: 'Farmer', currentActivity: 'work', currentLocation: 'farm' },
    ]
    const store = { getState: () => ({ foodSupply: 100 }) }

    econ.update(souls, [], 0, store) // primes lastUpdateYear
    econ.update(souls, [], 5, store) // +5 years, production should outpace consumption
    expect(econ.foodSupply).toBeGreaterThan(100)
  })

  it('large population drains food over years', () => {
    const souls = Array.from({ length: 20 }, () => ({
      isAlive: true, happiness: 50, stress: 30, health: 80,
      role: 'Warrior', currentActivity: 'patrol', currentLocation: 'barracks',
    }))
    const store = { getState: () => ({ foodSupply: 50 }) }

    econ.update(souls, [], 0, store)
    econ.update(souls, [], 5, store)
    expect(econ.foodSupply).toBeLessThan(100)
  })

  it('economy is idle within a single year', () => {
    const souls = [
      { isAlive: true, happiness: 50, stress: 30, health: 80, role: 'Farmer', currentActivity: 'work', currentLocation: 'farm' },
    ]
    const store = { getState: () => ({ foodSupply: 100 }) }

    econ.update(souls, [], 0, store)
    const before = econ.foodSupply
    econ.update(souls, [], 0.5, store) // same integer year → no change
    expect(econ.foodSupply).toBe(before)
  })

  it('traders increase gold over years', () => {
    const souls = [
      { isAlive: true, happiness: 50, stress: 30, health: 80, role: 'Trader', currentActivity: 'trade', currentLocation: 'market' },
      { isAlive: true, happiness: 50, stress: 30, health: 80, role: 'Trader', currentActivity: 'trade', currentLocation: 'market' },
    ]
    const store = { getState: () => ({ foodSupply: 100 }) }
    const prevGold = econ.goldReserves

    econ.update(souls, [], 0, store)
    econ.update(souls, [], 1, store) // +1 year
    expect(econ.goldReserves).toBe(prevGold + 2 * 3 * 1)
  })

  it('famine reduces happiness and health', () => {
    econ.foodSupply = 0.5
    const soul = { isAlive: true, happiness: 50, stress: 30, health: 80, role: 'Farmer', currentActivity: 'rest', currentLocation: 'home' }
    const store = { getState: () => ({ foodSupply: econ.foodSupply }) }

    econ.update([soul], [], 0, store)
    econ.update([soul], [], 1, store)
    expect(soul.happiness).toBeLessThan(50)
    expect(soul.health).toBeLessThan(80)
  })

  it('toJSON and rehydrate round-trip', () => {
    econ.foodSupply = 77
    econ.goldReserves = 33
    const json = econ.toJSON()

    const econ2 = new EconomySystem()
    econ2.rehydrate(json)
    expect(econ2.foodSupply).toBe(77)
    expect(econ2.goldReserves).toBe(33)
  })
})

describe('DiplomacySystem', () => {
  let diplo

  beforeEach(() => {
    diplo = new DiplomacySystem()
  })

  it('starts with no alliances or wars', () => {
    expect(diplo.alliances).toHaveLength(0)
    expect(diplo.wars).toHaveLength(0)
    expect(diplo.isAtWar()).toBe(false)
  })

  it('areAllied returns false for unallied souls', () => {
    expect(diplo.areAllied('a', 'b')).toBe(false)
  })

  it('areAllied returns true after forming alliance', () => {
    diplo.alliances.push({ id: 'test', members: ['a', 'b'], formedYear: 0, type: 'mutual_defense' })
    expect(diplo.areAllied('a', 'b')).toBe(true)
    expect(diplo.areAllied('a', 'c')).toBe(false)
  })

  it('isAtWar reflects active wars', () => {
    diplo.wars.push({ startYear: 0, participants: ['a', 'b'], type: 'civil_unrest' })
    expect(diplo.isAtWar()).toBe(true)
  })

  it('toJSON and rehydrate round-trip', () => {
    diplo.alliances.push({ id: 'a1', members: ['x', 'y'], formedYear: 100, type: 'mutual_defense' })
    diplo.wars.push({ startYear: 200, participants: ['x', 'y'], type: 'civil_unrest' })
    const json = diplo.toJSON()

    const diplo2 = new DiplomacySystem()
    diplo2.rehydrate(json, [])
    expect(diplo2.alliances).toHaveLength(1)
    expect(diplo2.wars).toHaveLength(1)
  })
})
