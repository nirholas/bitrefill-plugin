export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface SearchBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  q?: string
  country?: string
  type?: string
  limit?: number
  include_test_products?: boolean
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: SearchBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return errorResponse((e as Error).message, 401)
  }

  const params = new URLSearchParams()
  if (body.country) params.set('country', body.country)
  if (body.type) params.set('type', body.type)
  if (body.limit) params.set('limit', String(body.limit))
  if (body.include_test_products) params.set('include_test_products', 'true')

  // With a query → search endpoint; without → product listing
  const endpoint = body.q
    ? `${BITREFILL_BASE}/products/search?q=${encodeURIComponent(body.q)}&${params}`
    : body.type === 'esim'
      ? `${BITREFILL_BASE}/products/esims?${params}`
      : `${BITREFILL_BASE}/products?${params}`

  try {
    const res = await fetch(endpoint, { headers: { Authorization: authHeader } })
    const data = await res.json()
    return jsonResponse(data, res.status)
  } catch (e) {
    return errorResponse(`Bitrefill API unreachable: ${(e as Error).message}`, 502)
  }
}
