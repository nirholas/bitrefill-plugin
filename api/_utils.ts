export const BITREFILL_BASE = 'https://api.bitrefill.com/v2'

// Set PLUGIN_DOMAIN in your environment (e.g. https://plugin.delivery or your own domain)
export const PLUGIN_DOMAIN =
  (typeof process !== 'undefined' && process.env?.PLUGIN_DOMAIN) || 'https://plugin.delivery'

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export interface AuthFields {
  apiKey?: string
  apiId?: string
  apiSecret?: string
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export function getAuthHeader(body: AuthFields): string {
  if (body.apiId && body.apiSecret) {
    return `Basic ${btoa(`${body.apiId}:${body.apiSecret}`)}`
  }
  if (body.apiKey) return `Bearer ${body.apiKey}`
  throw new Error(
    'No credentials. Set apiKey (Personal API) or apiId + apiSecret (Business/Affiliate API) in plugin settings.'
  )
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

export function markdownResponse(md: string, status = 200): Response {
  return new Response(md, {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
