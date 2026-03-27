export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface OrdersBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  limit?: number
  after?: string
  before?: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: OrdersBody
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
  if (body.limit) params.set('limit', String(body.limit))
  if (body.after) params.set('after', body.after)
  if (body.before) params.set('before', body.before)

  const qs = params.toString() ? `?${params}` : ''

  try {
    const res = await fetch(`${BITREFILL_BASE}/orders${qs}`, {
      headers: { Authorization: authHeader },
    })
    const data = await res.json()
    return jsonResponse(data, res.status)
  } catch (e) {
    return errorResponse(`Bitrefill API unreachable: ${(e as Error).message}`, 502)
  }
}
