// AnthropicBridge — server-side API calls to Anthropic
// This module is used by the Next.js API route

// Haiku for routine thoughts (fast, cheap — bulk of calls)
// Sonnet for dramatic moments (death, self-awareness, god speech)
const MODELS = {
  fast: 'claude-haiku-4-5-20251001',
  quality: 'claude-sonnet-4-6-20250514',
}

export async function callAnthropic({ systemPrompt, userPrompt, maxTokens = 200, model = 'fast' }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELS[model] || MODELS.fast,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}
