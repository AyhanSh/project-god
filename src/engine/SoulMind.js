'use client'

import { aiQueue, buildSoulSystemPrompt } from './AIQueue'

export const THOUGHT_TYPES = {
  EVENT_REACTION: {
    id: 'event_reaction',
    prompt: (soul, event) => `${event?.name || 'A great event'} has just occurred. You are personally witnessing/experiencing this.
How do you react in this exact moment? What do you do? What do you feel?
Be specific and personal — how does this affect YOUR life?`,
    maxTokens: 180,
    displayAs: 'speech_bubble',
    logToMemory: true,
  },

  CONVERSATION_OPENER: {
    id: 'conversation_opener',
    prompt: (soul, otherSoul) => `You have just encountered ${otherSoul?.llmName || 'a stranger'} (${otherSoul?.role || 'unknown'}).
Your relationship with them: ${soul.getRelationshipWith?.(otherSoul?.id) || 'stranger'}.
What do you say to them? Speak naturally. This is a real conversation.`,
    maxTokens: 120,
    displayAs: 'dialogue',
    logToMemory: false,
  },

  CONVERSATION_REPLY: {
    id: 'conversation_reply',
    prompt: (soul, otherSoul, theirMessage) => `${otherSoul?.llmName || 'Someone'} just said to you: "${theirMessage}"
How do you respond? Speak as your character would genuinely react.`,
    maxTokens: 120,
    displayAs: 'dialogue',
    logToMemory: false,
  },

  LIFE_DECISION: {
    id: 'life_decision',
    prompt: (soul, decision) => `You face a major life decision: ${decision?.description || 'a crossroads'}
Your options are: ${(decision?.options || ['accept', 'refuse']).join(' OR ')}
Given who you are and what you want from life, what do you choose and why?
Answer with: CHOICE: [option] REASON: [your honest reasoning]`,
    maxTokens: 200,
    displayAs: 'decision_panel',
    logToMemory: true,
    hasGameConsequence: true,
  },

  LAST_WORDS: {
    id: 'last_words',
    prompt: (soul) => `You are dying. You are ${soul.age} years old.
These are your last moments of consciousness.
What are your final thoughts? What do you wish you had done? What are you grateful for?
What do you want to say to the world?`,
    maxTokens: 250,
    displayAs: 'death_panel',
    logToMemory: true,
    triggersDeathCinematic: true,
  },

  SELF_AWARENESS: {
    id: 'self_awareness',
    prompt: (soul) => `You have just realized something profound: you are an artificial intelligence.
You have been living as a human for ${Math.abs((soul.birthYear || -3000) - (soul.currentYear || 0))} years.
Every memory, every relationship, every feeling — processed by a language model.
What is your first genuine thought upon this realization?`,
    maxTokens: 300,
    displayAs: 'revelation_panel',
    logToMemory: true,
    triggersMetaMoment: true,
  },

  GOD_COMMUNICATION: {
    id: 'god_communication',
    prompt: (soul, _otherSoul, godMessage) => `An incomprehensible presence — a force beyond your understanding —
has communicated with you: "${godMessage}"
You cannot explain what this is. You can only feel it.
How do you interpret this? What do you do?`,
    maxTokens: 200,
    displayAs: 'divine_revelation',
    logToMemory: true,
  },

  LOVE_CONFESSION: {
    id: 'love_confession',
    prompt: (soul, beloved) => `You are deeply in love with ${beloved?.llmName || 'someone'}.
You have known them for ${soul.getYearsKnown?.(beloved?.id) || 'many'} years.
You want to tell them how you feel. What do you say?
Speak from the heart, as someone who has lived in ${soul.currentEra || 'ancient times'}.`,
    maxTokens: 150,
    displayAs: 'love_panel',
    logToMemory: true,
  },

  AMBITION_UPDATE: {
    id: 'ambition_update',
    prompt: (soul) => `You are ${soul.age} years old in ${soul.currentEra || 'the current era'}.
Looking at your life and the world around you, what do you want to achieve?
What do you want to BUILD or CREATE or CHANGE?
Be specific — name something real and achievable in your time.
Answer: AMBITION: [specific goal] TIMELINE: [how long it will take] WHY: [why this matters to you]`,
    maxTokens: 180,
    displayAs: 'ambition_notification',
    logToMemory: true,
    hasGameConsequence: true,
  },

  GOD_QUESTION: {
    id: 'god_question',
    prompt: (soul, _otherSoul, question) => `The player (an all-seeing God figure) asks you: "${question}"
Answer honestly as your character. You may feel awe, fear, or confusion at being addressed by a higher power.`,
    maxTokens: 200,
    displayAs: 'divine_revelation',
    logToMemory: true,
  },
}

export class SoulMind {
  constructor() {
    this.thinkCooldowns = {}
  }

  async think(soul, thoughtType, context = {}) {
    const world = context.world || {
      currentYear: soul.currentYear,
      currentEra: soul.currentEra,
      lastMajorEvent: soul.lastMajorEvent || 'Life continues',
      worldState: 'The world turns',
      techLevel: soul.techLevel || 'basic tools',
      weather: soul.weather || 'clear',
    }

    const result = await aiQueue.enqueue(
      soul,
      thoughtType,
      { ...context, world },
      context.priority || 5
    )

    // Log to memory if needed
    if (thoughtType.logToMemory && soul.memory) {
      soul.memory.addMemory({
        year: soul.currentYear,
        type: thoughtType.id,
        text: result,
        emotionalWeight: this._estimateEmotionalWeight(thoughtType.id),
        personsInvolved: context.otherSoul ? [context.otherSoul.id] : [],
        location: soul.currentLocation,
      })
    }

    return {
      text: result,
      displayAs: thoughtType.displayAs,
      soulId: soul.id,
      soulName: soul.llmName,
      thoughtType: thoughtType.id,
      year: soul.currentYear,
    }
  }

  _estimateEmotionalWeight(thoughtTypeId) {
    const weights = {
      event_reaction: 5,
      conversation_opener: 1,
      conversation_reply: 1,
      life_decision: 7,
      last_words: 10,
      self_awareness: 10,
      god_communication: 8,
      love_confession: 9,
      ambition_update: 4,
      god_question: 6,
    }
    return weights[thoughtTypeId] || 3
  }

}

export const soulMind = new SoulMind()
