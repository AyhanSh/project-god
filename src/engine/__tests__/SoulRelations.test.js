import { describe, it, expect } from 'vitest'
import { SoulRelationship, RelationshipManager } from '../SoulRelations'

describe('SoulRelationship', () => {
  it('starts as stranger with zero stats', () => {
    const rel = new SoulRelationship('a', 'b')
    expect(rel.type).toBe('stranger')
    expect(rel.trust).toBe(0)
    expect(rel.affection).toBe(0)
    expect(rel.respect).toBe(0)
  })

  it('conversation increases trust and affection', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.updateFromInteraction({ year: -2800, type: 'conversation', summary: 'chat' })
    expect(rel.trust).toBe(3)
    expect(rel.affection).toBe(2)
    expect(rel.respect).toBe(1)
  })

  it('betrayal tanks trust and builds resentment', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.trust = 50
    rel.affection = 40
    rel.updateFromInteraction({ year: -2700, type: 'betrayal', summary: 'betrayed' })
    expect(rel.trust).toBe(25)
    expect(rel.resentment).toBe(30)
  })

  it('transitions to friend at trust > 20', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.trust = 15
    rel.affection = 10
    // Push trust above 20 via help interaction (+8 trust)
    rel.updateFromInteraction({ year: -2500, type: 'help', summary: 'helped' })
    expect(rel.trust).toBeGreaterThan(20)
    expect(rel.type).toBe('acquaintance')
  })

  it('transitions to enemy at high resentment', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.resentment = 60
    rel.updateFromInteraction({ year: -2000, type: 'combat', summary: 'fought' })
    expect(rel.resentment).toBeGreaterThan(70)
    expect(rel.type).toBe('enemy')
  })

  it('transitions to lover with high affection + moderate trust', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.affection = 55
    rel.trust = 30
    // affection interaction +10 affection, +2 trust
    rel.updateFromInteraction({ year: -1800, type: 'affection', summary: 'embraced' })
    expect(rel.affection).toBeGreaterThan(60)
    expect(rel.trust).toBeGreaterThan(25)
    expect(rel.type).toBe('lover')
  })

  it('marriage sets type to spouse', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.married = true
    rel.updateFromInteraction({ year: -1500, type: 'conversation', summary: 'chat' })
    expect(rel.type).toBe('spouse')
  })

  it('clamps values between -100 and 100', () => {
    const rel = new SoulRelationship('a', 'b')
    rel.trust = 98
    rel.updateFromInteraction({ year: -1200, type: 'help', summary: 'helped' })
    expect(rel.trust).toBeLessThanOrEqual(100)

    rel.trust = -95
    rel.updateFromInteraction({ year: -1100, type: 'betrayal', summary: 'betrayed' })
    expect(rel.trust).toBeGreaterThanOrEqual(-100)
  })

  it('keeps conversation history capped at 10', () => {
    const rel = new SoulRelationship('a', 'b')
    for (let i = 0; i < 15; i++) {
      rel.updateFromInteraction({
        year: -2000 + i, type: 'conversation',
        summary: `chat ${i}`, dialogue: `Hello ${i}`,
      })
    }
    expect(rel.conversationHistory).toHaveLength(10)
  })
})

describe('RelationshipManager', () => {
  it('creates and retrieves relationships', () => {
    const rm = new RelationshipManager()
    const rel = rm.getOrCreate('a', 'b')
    expect(rel).toBeInstanceOf(SoulRelationship)
    expect(rm.get('a', 'b')).toBe(rel)
    expect(rm.get('b', 'a')).toBe(rel) // symmetric key
  })

  it('getAllForSoul returns all relationships for a soul', () => {
    const rm = new RelationshipManager()
    rm.getOrCreate('a', 'b')
    rm.getOrCreate('a', 'c')
    rm.getOrCreate('b', 'c')

    expect(rm.getAllForSoul('a')).toHaveLength(2)
    expect(rm.getAllForSoul('b')).toHaveLength(2)
    expect(rm.getAllForSoul('c')).toHaveLength(2)
  })

  it('serialises and deserialises', () => {
    const rm = new RelationshipManager()
    const rel = rm.getOrCreate('x', 'y')
    rel.trust = 42
    rel.affection = 55

    const json = rm.toJSON()
    const rm2 = new RelationshipManager()
    rm2.fromJSON(json)

    const restored = rm2.get('x', 'y')
    expect(restored.trust).toBe(42)
    expect(restored.affection).toBe(55)
  })
})
