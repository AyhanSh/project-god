'use client'

import { soulMind, THOUGHT_TYPES } from './SoulMind'
import { relationshipManager } from './SoulRelations'
import { useGameStore } from '@/store/useGameStore'

export class InteractionEngine {
  constructor() {
    this.interactionCooldowns = {}
    this.activeConversations = []
    this.activeCombats = []
  }

  async checkProximityInteractions(souls, currentYear, world) {
    const aliveSouls = souls.filter((s) => s.isAlive)

    for (let i = 0; i < aliveSouls.length; i++) {
      for (let j = i + 1; j < aliveSouls.length; j++) {
        const soulA = aliveSouls[i]
        const soulB = aliveSouls[j]
        const distance = this._getDistance(soulA.position, soulB.position)

        if (distance < 5.0 && this._shouldInteract(soulA, soulB, currentYear)) {
          await this.triggerInteraction(soulA, soulB, currentYear, world)
        }
      }
    }
  }

  _getDistance(posA, posB) {
    if (!posA || !posB) return Infinity
    const dx = (posA.x || posA[0] || 0) - (posB.x || posB[0] || 0)
    const dz = (posA.z || posA[2] || 0) - (posB.z || posB[2] || 0)
    return Math.sqrt(dx * dx + dz * dz)
  }

  _shouldInteract(soulA, soulB, currentYear) {
    const key = [soulA.id, soulB.id].sort().join('::')
    const lastInteraction = this.interactionCooldowns[key] || -9999
    const rel = relationshipManager.get(soulA.id, soulB.id)
    const cooldown = rel?.type === 'enemy' ? 5 : 3

    if (currentYear - lastInteraction < cooldown) return false
    return Math.random() < 0.4
  }

  async triggerInteraction(soulA, soulB, currentYear, world) {
    const key = [soulA.id, soulB.id].sort().join('::')
    this.interactionCooldowns[key] = currentYear

    const rel = relationshipManager.getOrCreate(soulA.id, soulB.id)

    // Enemies fight instead of talking
    if (rel.type === 'enemy') {
      return this._triggerCombat(soulA, soulB, currentYear, world)
    }

    // Determine interaction type
    let interactionType
    if (rel.type === 'stranger') interactionType = 'first_meeting'
    else if (rel.type === 'lover' || rel.type === 'spouse') interactionType = Math.random() > 0.7 ? 'affection' : 'conversation'
    else if ((rel.type === 'friend' || rel.type === 'close_friend') && Math.random() < 0.1) interactionType = 'gift'
    else interactionType = 'conversation'

    // Set up soul context for AI calls
    const soulAContext = this._prepareSoulForAI(soulA, soulB, rel, currentYear, world)
    const soulBContext = this._prepareSoulForAI(soulB, soulA, rel, currentYear, world)

    // AI conversation
    const opening = await soulMind.think(soulAContext, THOUGHT_TYPES.CONVERSATION_OPENER, {
      otherSoul: soulBContext,
      world,
    })

    const response = await soulMind.think(soulBContext, THOUGHT_TYPES.CONVERSATION_REPLY, {
      otherSoul: soulAContext,
      theirMessage: opening.text,
      world,
    })

    // Third dialogue turn — soul A replies to soul B
    const followUp = await soulMind.think(soulAContext, THOUGHT_TYPES.CONVERSATION_REPLY, {
      otherSoul: soulBContext,
      theirMessage: response.text,
      world,
      priority: 8,
    })

    // Analyze sentiment (simple keyword-based)
    const sentiment = this._analyzeSentiment(opening.text + ' ' + response.text + ' ' + followUp.text)

    // Update relationship
    rel.updateFromInteraction({
      type: interactionType,
      year: currentYear,
      summary: opening.text.slice(0, 80),
      sentiment: sentiment.score,
      dialogue: { opener: opening.text, reply: response.text, followUp: followUp.text },
    })

    // Gift-giving happiness boost
    if (interactionType === 'gift') {
      soulA.happiness = Math.min(100, soulA.happiness + 3)
      soulB.happiness = Math.min(100, soulB.happiness + 5)
    }

    // Add to memories if significant
    if (sentiment.isSignificant) {
      soulA.memory?.addMemory({
        year: currentYear,
        type: 'conversation',
        text: `Spoke with ${soulB.llmName}: "${response.text.slice(0, 100)}"`,
        emotionalWeight: sentiment.score * 2,
        personsInvolved: [soulB.id],
      })
      soulB.memory?.addMemory({
        year: currentYear,
        type: 'conversation',
        text: `Spoke with ${soulA.llmName}: "${opening.text.slice(0, 100)}"`,
        emotionalWeight: sentiment.score * 2,
        personsInvolved: [soulA.id],
      })
    }

    // Store active conversation for display
    const conversation = {
      soulA: { id: soulA.id, name: soulA.llmName, text: opening.text, followUp: followUp.text },
      soulB: { id: soulB.id, name: soulB.llmName, text: response.text },
      year: currentYear,
      type: interactionType,
      timestamp: Date.now(),
    }
    this.activeConversations.push(conversation)

    // Clean old conversations and sync to store
    const now = Date.now()
    this.activeConversations = this.activeConversations.filter(
      (c) => now - c.timestamp < 15000
    )
    useGameStore.getState().setActiveConversations([...this.activeConversations])

    // Check for love emergence
    if (rel.affection > 60 && rel.trust > 40 && rel.type !== 'spouse' && Math.random() < 0.1) {
      await this._triggerLoveEvent(soulA, soulB, currentYear, world)
    }

    return conversation
  }

  _prepareSoulForAI(soul, otherSoul, rel, currentYear, world) {
    return {
      ...soul,
      currentYear,
      currentEra: world?.currentEra || 'ancient',
      nearbySouls: [otherSoul.llmName],
      memories: soul.memory?.getFormattedMemories() || [],
      relationships: relationshipManager.getFormattedRelationships(soul.id, [otherSoul]),
      getRelationshipWith: () => rel.getStatusText(),
      getYearsKnown: () => rel.firstMet ? currentYear - rel.firstMet : 0,
    }
  }

  _analyzeSentiment(text) {
    const lower = text.toLowerCase()
    const positiveWords = ['love', 'friend', 'happy', 'joy', 'grateful', 'thank', 'kind', 'beautiful', 'trust', 'peace', 'hope', 'warm']
    const negativeWords = ['hate', 'angry', 'fear', 'betray', 'hurt', 'pain', 'suffer', 'enemy', 'war', 'death', 'curse', 'despise']

    let score = 0
    for (const word of positiveWords) {
      if (lower.includes(word)) score++
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) score--
    }

    return {
      score: Math.max(-5, Math.min(5, score)),
      isSignificant: Math.abs(score) >= 2,
      isPositive: score > 0,
      isNegative: score < 0,
    }
  }

  _triggerCombat(soulA, soulB, currentYear, world) {
    const combat = {
      id: `combat_${soulA.id}_${soulB.id}_${currentYear}`,
      soulA: { id: soulA.id, name: soulA.llmName },
      soulB: { id: soulB.id, name: soulB.llmName },
      year: currentYear,
      timestamp: Date.now(),
      duration: 8000,
    }

    // Damage based on courage + ambition traits
    const strengthA = (soulA.traits?.courage || 5) + (soulA.traits?.ambition || 5) * 0.5
    const strengthB = (soulB.traits?.courage || 5) + (soulB.traits?.ambition || 5) * 0.5
    const damageToA = 15 + Math.random() * 10 * (strengthB / Math.max(strengthA, 1))
    const damageToB = 15 + Math.random() * 10 * (strengthA / Math.max(strengthB, 1))

    soulA.health = Math.max(0, (soulA.health ?? 100) - damageToA)
    soulB.health = Math.max(0, (soulB.health ?? 100) - damageToB)

    // Deepen resentment
    const rel = relationshipManager.getOrCreate(soulA.id, soulB.id)
    rel.updateFromInteraction({
      type: 'combat',
      year: currentYear,
      summary: `${soulA.llmName} and ${soulB.llmName} fought`,
      sentiment: -5,
    })

    // Track active combat for visuals
    this.activeCombats.push(combat)
    const now = Date.now()
    this.activeCombats = this.activeCombats.filter((c) => now - c.timestamp < c.duration)
    useGameStore.getState().setActiveCombats([...this.activeCombats])

    // Log event
    useGameStore.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${soulA.llmName} and ${soulB.llmName} clash in combat!`,
      type: 'combat',
    })

    // Memories
    soulA.memory?.addMemory({
      year: currentYear,
      type: 'combat',
      text: `Fought ${soulB.llmName}. ${soulA.health <= 0 ? 'I fell in battle.' : 'I survived.'}`,
      emotionalWeight: -6,
      personsInvolved: [soulB.id],
    })
    soulB.memory?.addMemory({
      year: currentYear,
      type: 'combat',
      text: `Fought ${soulA.llmName}. ${soulB.health <= 0 ? 'I fell in battle.' : 'I survived.'}`,
      emotionalWeight: -6,
      personsInvolved: [soulA.id],
    })

    return combat
  }

  async _triggerLoveEvent(soulA, soulB, currentYear, world) {
    const rel = relationshipManager.getOrCreate(soulA.id, soulB.id)

    // Marriage if thresholds met
    if (rel.affection > 80 && rel.trust > 60 && !rel.married) {
      rel.married = true
      rel._updateType()

      useGameStore.getState().addEventLog({
        year: Math.round(currentYear),
        text: `${soulA.llmName} and ${soulB.llmName} are married!`,
        type: 'marriage',
      })

      // Wedding conversation for 3D display
      const wedding = {
        soulA: { id: soulA.id, name: soulA.llmName, text: `I take ${soulB.llmName} as my partner.` },
        soulB: { id: soulB.id, name: soulB.llmName, text: `And I take ${soulA.llmName} as mine.` },
        year: currentYear,
        type: 'wedding',
        timestamp: Date.now(),
      }
      this.activeConversations.push(wedding)
      useGameStore.getState().setActiveConversations([...this.activeConversations])

      // Trigger celebrate
      soulA.currentActivity = 'celebrating'
      soulB.currentActivity = 'celebrating'

      // Memories
      soulA.memory?.addMemory({
        year: currentYear, type: 'marriage',
        text: `Married ${soulB.llmName}. A day of joy.`,
        emotionalWeight: 10, personsInvolved: [soulB.id],
      })
      soulB.memory?.addMemory({
        year: currentYear, type: 'marriage',
        text: `Married ${soulA.llmName}. A day of joy.`,
        emotionalWeight: 10, personsInvolved: [soulA.id],
      })

      return
    }

    // Otherwise love confession
    const confession = await soulMind.think(
      this._prepareSoulForAI(soulA, soulB, rel, currentYear, world),
      THOUGHT_TYPES.LOVE_CONFESSION,
      { beloved: soulB, world }
    )
    return confession
  }

  getActiveConversations() {
    return this.activeConversations
  }
}

export const interactionEngine = new InteractionEngine()
