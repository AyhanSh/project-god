import { describe, it, expect } from 'vitest'
import { SoulMemory } from '../SoulMemory'

describe('SoulMemory', () => {
  it('stores and retrieves episodic memories', () => {
    const mem = new SoulMemory('soul_test')
    const entry = mem.addMemory({ year: -2800, type: 'event', text: 'Fire was discovered', emotionalWeight: 5 })

    expect(entry.id).toBeDefined()
    expect(entry.text).toBe('Fire was discovered')
    expect(mem.episodic).toHaveLength(1)
  })

  it('classifies traumas (emotionalWeight < -5)', () => {
    const mem = new SoulMemory('soul_test')
    mem.addMemory({ year: -2500, type: 'loss', text: 'Lost a friend', emotionalWeight: -7 })

    expect(mem.traumas).toHaveLength(1)
    expect(mem.getTraumaticMemories()).toHaveLength(1)
  })

  it('classifies joys (emotionalWeight > 7)', () => {
    const mem = new SoulMemory('soul_test')
    mem.addMemory({ year: -2400, type: 'celebration', text: 'Marriage day', emotionalWeight: 9 })

    expect(mem.joys).toHaveLength(1)
    expect(mem.getJoyfulMemories()).toHaveLength(1)
  })

  it('tracks relational memories by person', () => {
    const mem = new SoulMemory('soul_a')
    mem.addMemory({
      year: -2000, type: 'conversation', text: 'Talked with soul_b',
      emotionalWeight: 3, personsInvolved: ['soul_b'],
    })

    const relMems = mem.getMemoriesOfPerson('soul_b')
    expect(relMems).toHaveLength(1)
    expect(relMems[0].text).toBe('Talked with soul_b')
  })

  it('consolidates when exceeding 1000 memories', () => {
    const mem = new SoulMemory('soul_test')
    for (let i = 0; i < 1001; i++) {
      mem.addMemory({ year: -3000 + i, type: 'event', text: `Event ${i}`, emotionalWeight: 1 })
    }

    // After consolidation, oldest 200 are compressed and the rest remain
    expect(mem.episodic.length).toBeLessThanOrEqual(801)
    expect(mem.consolidatedWisdom.length).toBeGreaterThan(0)
  })

  it('relevance scoring favours recent + high-weight memories', () => {
    const mem = new SoulMemory('soul_test')
    mem.addMemory({ year: -3000, type: 'event', text: 'Ancient event', emotionalWeight: 1 })
    mem.addMemory({ year: -100, type: 'event', text: 'Recent event', emotionalWeight: 1 })
    mem.addMemory({ year: -2500, type: 'trauma', text: 'Deep trauma', emotionalWeight: -8 })

    const relevant = mem.getRelevantMemories({ year: -50, type: 'event' }, 2)
    // Recent event should rank high, trauma too due to high emotional weight
    expect(relevant.length).toBe(2)
    const texts = relevant.map((m) => m.text)
    expect(texts).toContain('Recent event')
  })

  it('getFormattedMemories returns most recent entries', () => {
    const mem = new SoulMemory('soul_test')
    mem.addMemory({ year: -3000, text: 'First' })
    mem.addMemory({ year: -2000, text: 'Second' })
    mem.addMemory({ year: -1000, text: 'Third' })

    const formatted = mem.getFormattedMemories(2)
    expect(formatted).toHaveLength(2)
    expect(formatted[0].text).toBe('Third')
    expect(formatted[1].text).toBe('Second')
  })

  it('toJSON serialises correctly', () => {
    const mem = new SoulMemory('soul_test')
    mem.addMemory({ year: -2000, type: 'event', text: 'Test', emotionalWeight: 3 })

    const json = mem.toJSON()
    expect(json.soulId).toBe('soul_test')
    expect(json.episodic).toHaveLength(1)
    expect(json.beliefs).toEqual([])
  })
})
