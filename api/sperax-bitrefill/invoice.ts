export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, jsonResponse, errorResponse } from '../_utils.js'

interface InvoiceProduct {
  product_id: string
  package_id?: string
  value?: number
  quantity?: number
  phone_number?: string
}

interface InvoiceBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  products: InvoiceProduct[]
  payment_method?: string
  auto_pay?: boolean
  refund_address?: string
  webhook_url?: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let body: InvoiceBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  if (!Array.isArray(body.products) || body.products.length === 0) {
    return errorResponse('products must be a non-empty array')
  }
  if (body.products.length > 20) {
    return errorResponse('Too many items — maximum 20 products per invoice')
  }

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return errorResponse((e as Error).message, 401)
  }

  const payload: Record<string, unknown> = { products: body.products }
  if (body.payment_method) payload.payment_method = body.payment_method
  if (body.auto_pay !== undefined) payload.auto_pay = body.auto_pay
  if (body.refund_address) payload.refund_address = body.refund_address
  if (body.webhook_url) payload.webhook_url = body.webhook_url

  try {
    const res = await fetch(`${BITREFILL_BASE}/invoices`, {
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
