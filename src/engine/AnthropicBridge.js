// AnthropicBridge — server-side API calls to Anthropic
// This module is used by the Next.js API route

// Haiku for routine thoughts (fast, cheap — bulk of calls)
// Quality tier tries preferred model first, falls back to haiku
const HAIKU = 'claude-haiku-4-5-20251001'
const QUALITY_CANDIDATES = [
  'claude-sonnet-4-5-20241022',
  'claude-3-5-sonnet-20241022',
]

const MODELS = {
  fast: HAIKU,
  quality: HAIKU, // resolved dynamically on first quality call
}

// Probe once to find which quality model is available
let _qualityProbed = false

export async function callAnthropic({ systemPrompt, userPrompt, maxTokens = 200, model = 'fast' }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }

  // On first quality call, probe for the best available model
  if (model === 'quality' && !_qualityProbed) {
    _qualityProbed = true
    for (const candidate of QUALITY_CANDIDATES) {
      try {
        const probe = await _callModel(apiKey, candidate, 'test', 'hi', 5)
        if (probe.ok) {
          MODELS.quality = candidate
          break
        }
      } catch {
        // candidate not available, try next
      }
    }
  }

  const modelId = MODELS[model] || HAIKU
  const response = await _callModel(apiKey, modelId, systemPrompt, userPrompt, maxTokens)

  if (!response.ok) {
    // If quality model failed, retry with haiku
    if (model === 'quality' && modelId !== HAIKU) {
      const fallback = await _callModel(apiKey, HAIKU, systemPrompt, userPrompt, maxTokens)
      if (!fallback.ok) {
        const err = await fallback.text()
        throw new Error(`Anthropic API error: ${fallback.status} ${err}`)
      }
      const data = await fallback.json()
      return data.content[0]?.text || ''
    }
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

function _callModel(apiKey, modelId, systemPrompt, userPrompt, maxTokens) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
}
