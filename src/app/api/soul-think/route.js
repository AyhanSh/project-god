import { callAnthropic } from '@/engine/AnthropicBridge'

// Simple in-memory rate limiter: per-IP, max 60 requests per minute
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 60
const MAX_BODY_SIZE = 10_000 // 10 KB

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

// Periodic cleanup to prevent memory leak (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip)
    }
  }
}, 300_000)

export async function POST(request) {
  try {
    // Origin / referrer check — only allow same-origin requests
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''
    if (origin && !origin.includes(host)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Per-IP rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // Request size check
    const contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > MAX_BODY_SIZE) {
      return Response.json({ error: 'Request too large' }, { status: 413 })
    }

    const body = await request.text()
    if (body.length > MAX_BODY_SIZE) {
      return Response.json({ error: 'Request too large' }, { status: 413 })
    }

    const { systemPrompt, userPrompt, maxTokens, model } = JSON.parse(body)

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
