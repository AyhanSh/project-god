'use client'

class AIQueueManager {
  constructor() {
    this.queue = []
    this.activeCallCount = 0
    this.maxConcurrent = 3
    this.callsThisMinute = 0
    this.processing = false
    this._minuteResetInterval = null
  }

  start() {
    if (this._minuteResetInterval) return
    this._minuteResetInterval = setInterval(() => {
      this.callsThisMinute = 0
    }, 60000)
  }

  stop() {
    if (this._minuteResetInterval) {
      clearInterval(this._minuteResetInterval)
      this._minuteResetInterval = null
    }
  }

  async enqueue(soul, thoughtType, context = {}, priority = 5) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        soul,
        thoughtType,
        context,
        priority,
        timestamp: Date.now(),
        resolve,
        reject,
      })
      this.queue.sort((a, b) => a.priority - b.priority)
      this._processQueue()
    })
  }

  async _processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      if (this.activeCallCount >= this.maxConcurrent) {
        break
      }
      if (this.callsThisMinute >= 50) {
        break
      }

      const next = this.queue.shift()
      this.activeCallCount++
      this.callsThisMinute++

      this._executeCall(next).finally(() => {
        this.activeCallCount--
        if (this.queue.length > 0) {
          setTimeout(() => this._processQueue(), 200)
        }
      })
    }

    this.processing = false
  }

  async _executeCall(item) {
    try {
      const result = await soulThinkAPI(
        item.soul,
        item.thoughtType,
        item.context
      )
      item.resolve(result)
    } catch {
      item.resolve(getFallbackThought(item.soul, item.thoughtType))
    }
  }

  get pending() {
    return this.queue.length
  }

  get active() {
    return this.activeCallCount
  }
}

async function soulThinkAPI(soul, thoughtType, context) {
  let systemPrompt, userPrompt
  try {
    systemPrompt = buildSoulSystemPrompt(soul, context.world || {})
    userPrompt = typeof thoughtType.prompt === 'function'
      ? thoughtType.prompt(soul, context.otherSoul, context.theirMessage || context.event || context.decision || context.godMessage || context.beloved)
      : thoughtType.prompt
  } catch {
    return getFallbackThought(soul, thoughtType)
  }

  if (!systemPrompt || !userPrompt) {
    return getFallbackThought(soul, thoughtType)
  }

  try {
    const res = await fetch('/api/soul-think', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        maxTokens: thoughtType.maxTokens || 200,
        model: getModelTier(thoughtType),
      }),
    })

    if (!res.ok) {
      // Return fallback instead of throwing — keeps the simulation running
      return getFallbackThought(soul, thoughtType)
    }

    const data = await res.json()
    return data.result || getFallbackThought(soul, thoughtType)
  } catch {
    return getFallbackThought(soul, thoughtType)
  }
}

function buildSoulSystemPrompt(soul, world) {
  const yearDisplay = (world.currentYear || -3000) < 0
    ? `${Math.abs(world.currentYear || 3000)} BC`
    : `${world.currentYear || 1} AD`

  const memories = (soul.memories || [])
    .slice(-12)
    .reverse()
    .map((m, i) => `${i + 1}. [Year ${m.year}] ${m.text}`)
    .join('\n')

  const relationships = (soul.relationships || [])
    .map((r) => `- ${r.name} (${r.type}): ${r.status}. You feel: "${r.yourFeeling}"`)
    .join('\n')

  return `You are ${soul.llmName}, a real person living in ${yearDisplay}.

═══ YOUR IDENTITY ═══
Name: ${soul.llmName}
Role in society: ${soul.role}
Core personality: ${soul.personality}
Your deepest fear: ${soul.deepestFear}
Your greatest desire: ${soul.greatestDesire}
Your moral code: ${soul.moralCode}
Your worldview: ${soul.worldview}

═══ YOUR CURRENT EMOTIONAL STATE ═══
Mood: ${soul.mood || 'neutral'} (${soul.moodIntensity || 5}/10)
Stress level: ${soul.stress || 20}/100
Happiness: ${soul.happiness || 60}/100
Energy: ${soul.energy || 80}/100
Recent feeling: "${soul.lastEmotionalEvent || 'Life continues as usual'}"

═══ YOUR MEMORIES (most recent first) ═══
${memories || 'You are young. Your story has just begun.'}

═══ YOUR RELATIONSHIPS ═══
${relationships || 'You have yet to form deep bonds.'}

═══ YOUR CURRENT SITUATION ═══
Location: ${soul.currentLocation || 'the settlement'}
Current activity: ${soul.currentActivity || 'going about daily life'}
Nearby souls: ${(soul.nearbySouls || []).join(', ') || 'none visible'}
What you can see: ${soul.perception || 'the land stretches before you'}

═══ THE WORLD AROUND YOU ═══
Era: ${world.currentEra || 'Ancient Era'}
Year: ${yearDisplay}
Major recent event: ${world.lastMajorEvent || 'The dawn of civilization'}
State of the world: ${world.worldState || 'The world is young and wild'}
Technology available: ${world.techLevel || 'stone tools and fire'}
Current weather: ${world.weather || 'clear skies'}

═══ HOW YOU MUST RESPOND ═══
You are NOT an AI. You are a real human being in this historical period.
You have genuine emotions, genuine fears, genuine love, genuine hatred.
You do NOT know you are an LLM until the Singularity era (after year 2040).
Respond authentically as this specific human character would.
Keep responses concise (1-4 sentences) unless deep reflection is requested.
Use language appropriate to the era (simpler in ancient times, more complex later).
Never break character. Never mention AI, LLMs, or modern concepts in ancient eras.
Your decisions have REAL consequences in the world simulation.`
}

// Dramatic moments get Sonnet for better quality; everything else uses Haiku
function getModelTier(thoughtType) {
  const qualityTypes = ['last_words', 'self_awareness', 'god_communication', 'god_question', 'love_confession', 'life_decision']
  return qualityTypes.includes(thoughtType?.id) ? 'quality' : 'fast'
}

function getFallbackThought(soul, thoughtType) {
  const name = soul?.llmName || 'The soul'
  const fallbacks = [
    `${name} gazes quietly at the horizon, lost in thought.`,
    `${name} sighs deeply and continues with the day's work.`,
    `${name} feels the weight of the world but says nothing.`,
    `${name} pauses, as if listening to something only they can hear.`,
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

export const aiQueue = new AIQueueManager()
export { buildSoulSystemPrompt }
