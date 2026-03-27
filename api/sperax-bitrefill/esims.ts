export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface ESIMBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  product_id: string
  package_id: string
  esim_id?: string
  payment_method?: string
  auto_pay?: boolean
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: ESIMBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  if (!body.product_id) return errorResponse('Missing required parameter: product_id')
  if (!body.package_id) return errorResponse('Missing required parameter: package_id')

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return errorResponse((e as Error).message, 401)
  }

  const payload: Record<string, unknown> = {
    product_id: body.product_id,
    package_id: body.package_id,
  }
  if (body.esim_id) payload.esim_id = body.esim_id
  if (body.payment_method) payload.payment_method = body.payment_method
  if (body.auto_pay !== undefined) payload.auto_pay = body.auto_pay

  try {
    const res = await fetch(`${BITREFILL_BASE}/esims`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return jsonResponse(data, res.status)
  } catch (e) {
    return errorResponse(`Bitrefill API unreachable: ${(e as Error).message}`, 502)
  }
}
