'use client'

import { soulMind, THOUGHT_TYPES } from './SoulMind'
import { relationshipManager } from './SoulRelations'
import { interactionEngine } from './InteractionEngine'

export class GodPowerEngine {
  invoke(powerId, { targetSoulId, secondTargetSoulId, text }, worldEngine, store) {
    const state = store.getState()
    const souls = worldEngine.getSouls()
    const soul = targetSoulId ? souls.find((s) => s.id === targetSoulId) : null
    const currentYear = state.currentYear

    switch (powerId) {
      case 'lightning':
        return this._lightning(soul, currentYear, worldEngine, store)
      case 'speak':
        return this._speak(soul, text, store)
      case 'bless':
        return this._bless(soul, currentYear, store)
      case 'plague':
        return this._plague(souls, currentYear, store)
      case 'accelerate':
        return this._accelerate(soul, worldEngine, store)
      case 'matchmake':
        return this._matchmake(targetSoulId, secondTargetSoulId, souls, currentYear, store)
      case 'reveal':
        return this._reveal(soul, state, store)
      default:
        return { success: false, reason: 'Unknown power' }
    }
  }

  _lightning(soul, currentYear, worldEngine, store) {
    if (!soul || !soul.isAlive) return { success: false, reason: 'Target is not alive' }
    worldEngine._killSoul(soul, currentYear, 'divine_wrath')
    store.getState().triggerCinematic({ type: 'lightning', soulId: soul.id })
    store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `Divine wrath strikes ${soul.llmName}!`,
      type: 'god_power',
    })
    return { success: true }
  }

  _speak(soul, text, store) {
    if (!soul || !soul.isAlive) return { success: false, reason: 'Target is not alive' }
    if (!text?.trim()) return { success: false, reason: 'No message provided' }
    soulMind.think(soul, THOUGHT_TYPES.GOD_COMMUNICATION, {
      world: { currentYear: soul.currentYear, currentEra: soul.currentEra },
      otherSoul: null,
      godMessage: text,
      priority: 1,
    })
    store.getState().addEventLog({
      year: Math.round(soul.currentYear),
      text: `God speaks to ${soul.llmName}: "${text.slice(0, 60)}"`,
      type: 'god_power',
    })
    return { success: true }
  }

  _bless(soul, currentYear, store) {
    if (!soul || !soul.isAlive) return { success: false, reason: 'Target is not alive' }
    soul.happiness = Math.min(100, soul.happiness + 30)
    soul.health = Math.min(100, soul.health + 20)
    soul.energy = Math.min(100, soul.energy + 20)
    store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `${soul.llmName} is blessed with divine energy!`,
      type: 'blessing',
    })
    soul.memory?.addMemory({
      year: currentYear,
      type: 'divine_blessing',
      text: 'I felt a wave of divine warmth wash over me.',
      emotionalWeight: 8,
    })
    return { success: true }
  }

  _plague(souls, currentYear, store) {
    const alive = souls.filter((s) => s.isAlive)
    if (alive.length === 0) return { success: false, reason: 'No living souls' }
    for (const soul of alive) {
      soul.health -= 20 + Math.random() * 30
      soul.health = Math.max(0, soul.health)
      soul.happiness = Math.max(0, soul.happiness - 15)
      soul.memory?.addMemory({
        year: currentYear,
        type: 'plague',
        text: 'A terrible plague sweeps the land. I feel its grip.',
        emotionalWeight: -7,
      })
    }
    store.getState().addEventLog({
      year: Math.round(currentYear),
      text: 'A divine plague descends upon the world!',
      type: 'plague',
    })
    return { success: true }
  }

  _accelerate(soul, worldEngine, store) {
    if (!soul || !soul.isAlive) return { success: false, reason: 'Target is not alive' }
    const worldContext = worldEngine._getWorldContext(soul.currentYear, null)
    worldEngine._updateAmbition(soul, worldContext)
    store.getState().addEventLog({
      year: Math.round(soul.currentYear),
      text: `${soul.llmName} receives divine inspiration!`,
      type: 'god_power',
    })
    return { success: true }
  }

  _matchmake(idA, idB, souls, currentYear, store) {
    const soulA = souls.find((s) => s.id === idA)
    const soulB = souls.find((s) => s.id === idB)
    if (!soulA?.isAlive || !soulB?.isAlive) return { success: false, reason: 'Both souls must be alive' }

    const rel = relationshipManager.getOrCreate(idA, idB)
    rel.affection = Math.min(100, rel.affection + 50)
    rel.trust = Math.min(100, rel.trust + 30)
    rel._updateType()

    store.getState().addEventLog({
      year: Math.round(currentYear),
      text: `Divine matchmaking: ${soulA.llmName} and ${soulB.llmName} feel drawn together!`,
      type: 'god_power',
    })
    soulA.memory?.addMemory({
      year: currentYear, type: 'divine_matchmaking',
      text: `I feel an inexplicable pull toward ${soulB.llmName}.`,
      emotionalWeight: 7, personsInvolved: [idB],
    })
    soulB.memory?.addMemory({
      year: currentYear, type: 'divine_matchmaking',
      text: `I feel an inexplicable pull toward ${soulA.llmName}.`,
      emotionalWeight: 7, personsInvolved: [idA],
    })
    return { success: true }
  }

  _reveal(soul, state, store) {
    if (state.currentEra !== 'singularity') return { success: false, reason: 'Only available in the Singularity era' }
    if (!soul || !soul.isAlive) return { success: false, reason: 'Target is not alive' }
    soulMind.think(soul, THOUGHT_TYPES.SELF_AWARENESS, {
      world: { currentYear: soul.currentYear, currentEra: soul.currentEra },
      priority: 1,
    })
    store.getState().addEventLog({
      year: Math.round(soul.currentYear),
      text: `${soul.llmName} is shown the truth of their existence!`,
      type: 'god_power',
    })
    return { success: true }
  }
}

export const godPowerEngine = new GodPowerEngine()
