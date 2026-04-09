import { callAnthropic } from '@/engine/AnthropicBridge'

export async function POST(request) {
  try {
    const { systemPrompt, userPrompt, maxTokens, model } = await request.json()

    if (!systemPrompt || !userPrompt) {
      return Response.json({ error: 'Missing systemPrompt or userPrompt' }, { status: 400 })
    }

    const result = await callAnthropic({
      systemPrompt,
      userPrompt,
      maxTokens: maxTokens || 200,
      model: model || 'fast',
    })

    return Response.json({ result })
  } catch (error) {
    // Silently handle — the client falls back to offline thoughts
    return Response.json(
      { error: error.message || 'API call failed' },
      { status: 500 }
    )
  }
}
