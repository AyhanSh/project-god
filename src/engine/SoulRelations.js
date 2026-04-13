'use client'

export class SoulRelationship {
  constructor(soulAId, soulBId) {
    this.souls = [soulAId, soulBId]
    this.type = 'stranger'
    this.trust = 0
    this.affection = 0
    this.respect = 0
    this.resentment = 0
    this.fear = 0
    this.firstMet = null
    this.interactions = []
    this.sharedExperiences = []
    this.conflicts = []
    this.bonds = []
    this.isAlive = { [soulAId]: true, [soulBId]: true }
    this.lastInteraction = null
    this.conversationHistory = []
    this.married = false
  }

  updateFromInteraction(interaction) {
    const delta = this._calculateDelta(interaction)
    this.trust = clamp(this.trust + delta.trust, -100, 100)
    this.affection = clamp(this.affection + delta.affection, -100, 100)
    this.respect = clamp(this.respect + delta.respect, -100, 100)
    this.resentment = clamp(this.resentment + (delta.resentment || 0), 0, 100)
    this.fear = clamp(this.fear + (delta.fear || 0), 0, 100)

    this.lastInteraction = interaction.year
    if (!this.firstMet) this.firstMet = interaction.year

    this.interactions.push({
      year: interaction.year,
      type: interaction.type,
      summary: interaction.summary,
      delta,
    })

    // Keep conversation history to last 10
    if (interaction.dialogue) {
      this.conversationHistory.push(interaction.dialogue)
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10)
      }
    }

    // Classify interaction
    if (interaction.type === 'conflict' || interaction.type === 'betrayal') {
      this.conflicts.push(interaction)
    } else if (interaction.type === 'help' || interaction.type === 'gift') {
      this.bonds.push(interaction)
    } else if (interaction.type === 'shared_event') {
      this.sharedExperiences.push(interaction)
    }

    this._updateType()
  }

  _calculateDelta(interaction) {
    const deltas = {
      conversation: { trust: 3, affection: 2, respect: 1 },
      conflict: { trust: -10, affection: -8, respect: -3, resentment: 15 },
      help: { trust: 8, affection: 6, respect: 5 },
      betrayal: { trust: -25, affection: -15, respect: -10, resentment: 30 },
      gift: { trust: 5, affection: 8, respect: 3 },
      marriage_proposal: { trust: 10, affection: 20, respect: 5 },
      shared_event: { trust: 5, affection: 3, respect: 2 },
      cold_shoulder: { trust: -3, affection: -5, respect: -2 },
      affection: { trust: 2, affection: 10, respect: 1 },
      first_meeting: { trust: 1, affection: 1, respect: 1 },
      argument: { trust: -5, affection: -4, respect: -1, resentment: 8 },
      combat: { trust: -15, affection: -10, respect: -2, resentment: 20, fear: 10 },
    }

    const base = deltas[interaction.type] || { trust: 0, affection: 0, respect: 0 }

    // Modify by sentiment if available
    if (interaction.sentiment) {
      const mod = interaction.sentiment > 0 ? 1.5 : 0.5
      return {
        trust: Math.round(base.trust * mod),
        affection: Math.round(base.affection * mod),
        respect: Math.round(base.respect * mod),
        resentment: base.resentment || 0,
        fear: base.fear || 0,
      }
    }

    return base
  }

  _updateType() {
    if (this.married) {
      this.type = 'spouse'
    } else if (this.affection > 70 && this.trust > 60) {
      this.type = 'close_friend'
    } else if (this.affection > 60 && this.trust > 30) {
      this.type = 'lover'
    } else if (this.affection > 40 && this.trust > 40) {
      this.type = 'friend'
    } else if (this.trust < -50 || this.resentment > 70) {
      this.type = 'enemy'
    } else if (this.respect > 50 && this.trust < 10) {
      this.type = 'rival'
    } else if (this.trust > 20) {
      this.type = 'acquaintance'
    } else {
      this.type = 'stranger'
    }
  }

  getStatusText() {
    const descriptions = {
      stranger: 'You barely know each other',
      acquaintance: 'You know each other in passing',
      friend: 'A warm friendship',
      close_friend: 'A deep and trusted bond',
      lover: 'Romantic feelings simmer between you',
      spouse: 'Bound together in marriage',
      rival: 'A grudging respect mixed with competition',
      enemy: 'Bitterness and hostility',
    }
    return descriptions[this.type] || 'Unknown'
  }

  getFeelingText(fromSoulId) {
    if (this.type === 'enemy') return 'I despise them'
    if (this.type === 'spouse') return 'They are my life partner'
    if (this.type === 'lover') return 'My heart aches for them'
    if (this.type === 'close_friend') return 'I trust them with my life'
    if (this.type === 'friend') return 'I enjoy their company'
    if (this.type === 'rival') return 'I respect them but we clash'
    if (this.type === 'acquaintance') return 'We have crossed paths'
    return 'I do not know them'
  }
}

export class RelationshipManager {
  constructor() {
    this.relationships = {}
  }

  _key(idA, idB) {
    return [idA, idB].sort().join('::')
  }

  getOrCreate(idA, idB) {
    const key = this._key(idA, idB)
    if (!this.relationships[key]) {
      this.relationships[key] = new SoulRelationship(idA, idB)
    }
    return this.relationships[key]
  }

  get(idA, idB) {
    return this.relationships[this._key(idA, idB)]
  }

  getAllForSoul(soulId) {
    return Object.values(this.relationships)
      .filter((r) => r.souls.includes(soulId))
  }

  toJSON() {
    const data = {}
    for (const [key, rel] of Object.entries(this.relationships)) {
      data[key] = {
        souls: rel.souls,
        type: rel.type,
        trust: rel.trust,
        affection: rel.affection,
        respect: rel.respect,
        resentment: rel.resentment,
        fear: rel.fear,
        firstMet: rel.firstMet,
        interactions: rel.interactions.slice(-20),
        sharedExperiences: rel.sharedExperiences.slice(-10),
        conflicts: rel.conflicts.slice(-10),
        bonds: rel.bonds.slice(-10),
        isAlive: rel.isAlive,
        lastInteraction: rel.lastInteraction,
        conversationHistory: rel.conversationHistory.slice(-5),
        married: rel.married,
      }
    }
    return data
  }

  fromJSON(data) {
    this.relationships = {}
    for (const [key, d] of Object.entries(data)) {
      const rel = new SoulRelationship(d.souls[0], d.souls[1])
      Object.assign(rel, d)
      this.relationships[key] = rel
    }
  }

  getFormattedRelationships(soulId, allSouls) {
    return this.getAllForSoul(soulId).map((rel) => {
      const otherId = rel.souls.find((id) => id !== soulId)
      const otherSoul = allSouls.find((s) => s.id === otherId)
      return {
        name: otherSoul?.llmName || 'Unknown',
        type: rel.type,
        status: rel.getStatusText(),
        yourFeeling: rel.getFeelingText(soulId),
      }
    })
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

export const relationshipManager = new RelationshipManager()
