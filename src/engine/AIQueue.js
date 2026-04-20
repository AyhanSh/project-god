'use client'

// Hard ceilings — beyond these the queue drops low-priority thoughts rather
// than queuing forever.
const MAX_CALLS_PER_MINUTE = 50
const MAX_PER_SOUL_PER_MINUTE = 12
const MAX_QUEUE_LEN = 80
const DROP_PRIORITY_THRESHOLD = 3 // priority >= this may be dropped when overloaded

class AIQueueManager {
  constructor() {
    this.queue = []
    this.activeCallCount = 0
    this.maxConcurrent = 3
    this.callsThisMinute = 0
    this.perSoulCalls = new Map() // soulId → count this minute
    this.processing = false
    this._minuteResetInterval = null
    // Observability
    this.totalCalls = 0
    this.totalDrops = 0
    this.totalFallbacks = 0
    this.lastDropAt = 0
  }

  start() {
    if (this._minuteResetInterval) return
    this._minuteResetInterval = setInterval(() => {
      this.callsThisMinute = 0
      this.perSoulCalls.clear()
    }, 60000)
  }

  stop() {
    if (this._minuteResetInterval) {
      clearInterval(this._minuteResetInterval)
      this._minuteResetInterval = null
    }
  }

  async enqueue(soul, thoughtType, context = {}, priority = 5) {
    // Per-soul budget: drop if this soul is hogging the queue.
    const soulId = soul?.id || 'unknown'
    const soulCalls = this.perSoulCalls.get(soulId) || 0
    if (soulCalls >= MAX_PER_SOUL_PER_MINUTE && priority >= DROP_PRIORITY_THRESHOLD) {
      this._recordDrop('per_soul_cap', soulId, priority)
      return getFallbackThought(soul, thoughtType)
    }

    // Global queue cap: when overloaded, shed low-priority work before it
    // buries high-priority (death, god-speak, etc).
    if (this.queue.length >= MAX_QUEUE_LEN) {
      if (priority >= DROP_PRIORITY_THRESHOLD) {
        this._recordDrop('queue_full', soulId, priority)
        return getFallbackThought(soul, thoughtType)
      }
      // Make room: evict the lowest-priority queued item.
      let worstIdx = -1
      let worstPri = -Infinity
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].priority > worstPri) {
          worstPri = this.queue[i].priority
          worstIdx = i
        }
      }
      if (worstIdx >= 0 && worstPri > priority) {
        const victim = this.queue.splice(worstIdx, 1)[0]
        this._recordDrop('evicted', victim.soul?.id, victim.priority)
        victim.resolve(getFallbackThought(victim.soul, victim.thoughtType))
      }
    }

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

  _recordDrop(reason, soulId, priority) {
    this.totalDrops++
    this.lastDropAt = Date.now()
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[AIQueue] drop (${reason}) soul=${soulId} pri=${priority} queue=${this.queue.length}`)
    }
  }

  async _processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      if (this.activeCallCount >= this.maxConcurrent) {
        break
      }
      if (this.callsThisMinute >= MAX_CALLS_PER_MINUTE) {
        break
      }

      const next = this.queue.shift()
      const soulId = next.soul?.id || 'unknown'
      this.activeCallCount++
      this.callsThisMinute++
      this.totalCalls++
      this.perSoulCalls.set(soulId, (this.perSoulCalls.get(soulId) || 0) + 1)

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
      if (!result || result === getFallbackThought(item.soul, item.thoughtType)) {
        this.totalFallbacks++
      }
      item.resolve(result)
    } catch {
      this.totalFallbacks++
      item.resolve(getFallbackThought(item.soul, item.thoughtType))
    }
  }

  get pending() {
    return this.queue.length
  }

  get active() {
    return this.activeCallCount
  }

  getStats() {
    return {
      pending: this.queue.length,
      active: this.activeCallCount,
      callsThisMinute: this.callsThisMinute,
      totalCalls: this.totalCalls,
      totalDrops: this.totalDrops,
      totalFallbacks: this.totalFallbacks,
      topSouls: [...this.perSoulCalls.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    }
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
