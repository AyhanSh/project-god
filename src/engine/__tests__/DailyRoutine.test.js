import { describe, it, expect } from 'vitest'
import { getGameHour, getSoulSchedule, getCurrentScheduleEntry } from '../DailyRoutine'

describe('getGameHour', () => {
  it('returns 0 for timeOfDay 0', () => {
    expect(getGameHour(0)).toBe(0)
  })

  it('returns 12 for timeOfDay 12.5', () => {
    expect(getGameHour(12.5)).toBe(12)
  })

  it('returns 6 for timeOfDay 6.75', () => {
    expect(getGameHour(6.75)).toBe(6)
  })

  it('wraps negative values correctly', () => {
    expect(getGameHour(-1)).toBe(23) // ((-1 % 24) + 24) % 24 = 23
  })

  it('wraps values over 24 correctly', () => {
    expect(getGameHour(25.5)).toBe(1) // ((25.5 % 24) + 24) % 24 = 1.5 → 1
  })
})

describe('getSoulSchedule', () => {
  it('returns ancient_farmer for a Farmer in ancient era', () => {
    const schedule = getSoulSchedule({ role: 'Farmer' }, { id: 'ancient' })
    expect(schedule[0].hour).toBe(5)
    expect(schedule.some((e) => e.activity === 'work' && e.location === 'farm')).toBe(true)
  })

  it('returns medieval_default for an unknown role in medieval era', () => {
    const schedule = getSoulSchedule({ role: 'Alchemist' }, { id: 'medieval' })
    expect(schedule.some((e) => e.location === 'workshop')).toBe(true)
  })

  it('falls back to default schedule if era is unknown', () => {
    const schedule = getSoulSchedule({ role: 'Unknown' }, { id: 'future' })
    expect(schedule.some((e) => e.activity === 'work')).toBe(true)
  })

  it('returns singularity_default for singularity era', () => {
    const schedule = getSoulSchedule({ role: 'Healer' }, { id: 'singularity' })
    expect(schedule.some((e) => e.activity === 'digital_existence')).toBe(true)
  })
})

describe('getCurrentScheduleEntry', () => {
  const schedule = [
    { hour: 6, activity: 'wake' },
    { hour: 9, activity: 'work' },
    { hour: 17, activity: 'social' },
    { hour: 22, activity: 'sleep' },
  ]

  it('returns the first entry before any scheduled hour', () => {
    expect(getCurrentScheduleEntry(schedule, 4).activity).toBe('wake')
  })

  it('returns correct entry at exact hour', () => {
    expect(getCurrentScheduleEntry(schedule, 9).activity).toBe('work')
  })

  it('returns correct entry between hours', () => {
    expect(getCurrentScheduleEntry(schedule, 14).activity).toBe('work')
  })

  it('returns last entry at end of day', () => {
    expect(getCurrentScheduleEntry(schedule, 23).activity).toBe('sleep')
  })
})
