export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface DepositBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  currency: 'USD' | 'EUR' | 'BTC'
  payment_method: string
  amount?: number
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: DepositBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  if (!body.currency) return errorResponse('Missing required parameter: currency (USD | EUR | BTC)')
  if (!body.payment_method) return errorResponse('Missing required parameter: payment_method')

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return errorResponse((e as Error).message, 401)
  }

  const payload: Record<string, unknown> = {
    currency: body.currency,
    payment_method: body.payment_method,
  }
  if (body.amount !== undefined) payload.amount = body.amount

  try {
    const res = await fetch(`${BITREFILL_BASE}/accounts/deposit`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return jsonResponse(data, res.status)
  } catch (e) {
    return errorResponse(`Bitrefill API unreachable. Note: deposits require Business API (apiId + apiSecret). ${(e as Error).message}`, 502)
  }
}
