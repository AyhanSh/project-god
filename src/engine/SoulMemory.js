'use client'

import { nanoid } from 'nanoid'

export class SoulMemory {
  constructor(soulId) {
    this.soulId = soulId
    this.episodic = []
    this.emotional = []
    this.relational = {}
    this.beliefs = []
    this.traumas = []
    this.joys = []
    this.consolidatedWisdom = []
  }

  addMemory(memory) {
    const entry = {
      id: nanoid(),
      year: memory.year,
      type: memory.type || 'event',
      text: memory.text,
      emotionalWeight: memory.emotionalWeight || 0,
      personsInvolved: memory.personsInvolved || [],
      location: memory.location || 'unknown',
      forgotten: false,
      distorted: false,
    }

    this.episodic.push(entry)

    // Classify by emotional weight
    if (entry.emotionalWeight < -5) {
      this.traumas.push(entry.id)
    }
    if (entry.emotionalWeight > 7) {
      this.joys.push(entry.id)
    }
    if (entry.type === 'belief_change') {
      this.beliefs.push(entry)
    }

    // Track relational memories
    if (entry.personsInvolved.length > 0) {
      for (const personId of entry.personsInvolved) {
        if (!this.relational[personId]) {
          this.relational[personId] = []
        }
        this.relational[personId].push(entry.id)
      }
    }

    // Memory consolidation after 1000 memories
    if (this.episodic.length > 1000) {
      this.consolidate()
    }

    return entry
  }

  consolidate() {
    // Keep the most recent 800 memories verbatim
    // Compress the oldest 200 into wisdom summaries
    const oldMemories = this.episodic.slice(0, 200)
    const recentMemories = this.episodic.slice(200)

    // Group old memories by type and summarize
    const grouped = {}
    for (const mem of oldMemories) {
      const key = mem.type
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(mem)
    }

    for (const [type, memories] of Object.entries(grouped)) {
      const avgWeight = memories.reduce((s, m) => s + m.emotionalWeight, 0) / memories.length
      const yearRange = `${memories[0].year}-${memories[memories.length - 1].year}`
      const people = [...new Set(memories.flatMap((m) => m.personsInvolved))]

      this.consolidatedWisdom.push({
        type,
        yearRange,
        summary: `During years ${yearRange}, experienced ${memories.length} ${type} events. Overall emotional tone: ${avgWeight > 0 ? 'positive' : avgWeight < 0 ? 'negative' : 'neutral'}. People involved: ${people.join(', ') || 'none'}.`,
        emotionalWeight: avgWeight,
      })
    }

    // Mark old memories as forgotten
    for (const mem of oldMemories) {
      mem.forgotten = true
    }

    this.episodic = recentMemories
  }

  getRelevantMemories(situation, count = 8) {
    const currentYear = situation.year || 0
    return this.episodic
      .filter((m) => !m.forgotten)
      .sort((a, b) => this._relevanceScore(b, situation, currentYear) - this._relevanceScore(a, situation, currentYear))
      .slice(0, count)
  }

  _relevanceScore(memory, situation, currentYear) {
    let score = 0

    // Recent memories score higher
    score += Math.max(0, 10 - Math.abs(currentYear - memory.year) / 100)

    // High emotional weight scores higher
    score += Math.abs(memory.emotionalWeight) * 1.5

    // Matching persons score higher
    if (situation.personsInvolved?.some((p) => memory.personsInvolved?.includes(p))) {
      score += 8
    }

    // Matching event type scores higher
    if (memory.type === situation.type) {
      score += 4
    }

    // Traumas always surface
    if (this.traumas.includes(memory.id)) {
      score += 5
    }

    return score
  }

  getMemoriesOfPerson(personId) {
    const ids = this.relational[personId] || []
    return this.episodic.filter((m) => ids.includes(m.id) && !m.forgotten)
  }

  getTraumaticMemories() {
    return this.episodic.filter((m) => this.traumas.includes(m.id) && !m.forgotten)
  }

  getJoyfulMemories() {
    return this.episodic.filter((m) => this.joys.includes(m.id) && !m.forgotten)
  }

  // Returns formatted memories for the system prompt
  getFormattedMemories(count = 12) {
    return this.episodic
      .filter((m) => !m.forgotten)
      .slice(-count)
      .reverse()
      .map((m) => ({ year: m.year, text: m.text }))
  }

  toJSON() {
    return {
      soulId: this.soulId,
      episodic: this.episodic,
      beliefs: this.beliefs,
      traumas: this.traumas,
      joys: this.joys,
      consolidatedWisdom: this.consolidatedWisdom,
    }
  }
}
