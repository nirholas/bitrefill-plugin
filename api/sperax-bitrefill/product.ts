export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface ProductBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  product_id: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: ProductBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  if (!body.product_id) return errorResponse('Missing required parameter: product_id')

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return errorResponse((e as Error).message, 401)
  }

  try {
    // Try standard products first, fall back to eSIMs endpoint
    let res = await fetch(`${BITREFILL_BASE}/products/${encodeURIComponent(body.product_id)}`, {
      headers: { Authorization: authHeader },
    })
    if (res.status === 404) {
      res = await fetch(`${BITREFILL_BASE}/products/esims/${encodeURIComponent(body.product_id)}`, {
        headers: { Authorization: authHeader },
      })
    }
    const data = await res.json()
    return jsonResponse(data, res.status)
  } catch (e) {
    return errorResponse(`Bitrefill API unreachable: ${(e as Error).message}`, 502)
  }
}
