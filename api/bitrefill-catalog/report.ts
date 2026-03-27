export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, markdownResponse, errorResponse } from '../_utils.js'

interface ReportBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  after?: string
  before?: string
  limit?: number
}

interface OrderProduct {
  name?: string
  id?: string
  type?: string
  value?: number
}

interface OrderPayment {
  amount?: number
  currency?: string
}

interface Order {
  id: string
  status: string
  createdAt?: string
  product?: OrderProduct
  payment?: OrderPayment
}

const STATUS_EMOJI: Record<string, string> = {
  delivered: '✅',
  complete: '✅',
  pending: '⏳',
  failed: '❌',
  refunded: '↩️',
  cancelled: '🚫',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return markdownResponse('# Error\n\nMethod not allowed', 405)

  let body: ReportBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return markdownResponse(`# Error\n\n${(e as Error).message}`, 401)
  }

  const params = new URLSearchParams()
  if (body.after) params.set('after', body.after)
  if (body.before) params.set('before', body.before)
  params.set('limit', String(body.limit ?? 20))

  try {
    const res = await fetch(`${BITREFILL_BASE}/orders?${params}`, {
      headers: { Authorization: authHeader },
    })
    const json = await res.json()
    const orders: Order[] = json.data?.orders ?? json.data ?? []

    const dateRange =
      body.after || body.before
        ? [body.after && `from ${body.after}`, body.before && `to ${body.before}`].filter(Boolean).join(' ')
        : 'All time'

    if (!orders.length) {
      return markdownResponse(`# 📦 Order History Report\n\n_${dateRange}_\n\nNo orders found.`)
    }

    const delivered = orders.filter((o) => ['delivered', 'complete'].includes(o.status)).length
    const failed = orders.filter((o) => o.status === 'failed').length
    const refunded = orders.filter((o) => o.status === 'refunded').length

    const rows = orders.map((o) => {
      const emoji = STATUS_EMOJI[o.status] ?? '❓'
      const product = o.product?.name ?? '—'
      const amount = o.payment ? `${o.payment.currency ?? ''} ${o.payment.amount ?? ''}`.trim() : '—'
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US') : '—'
      return `| \`${o.id}\` | ${product} | ${emoji} ${o.status} | ${amount} | ${date} |`
    })

    const md = [
      '# 📦 Order History Report',
      '',
      `_${dateRange} — ${orders.length} orders_`,
      '',
      `**${delivered}** delivered · **${failed}** failed · **${refunded}** refunded`,
      '',
      '| Order ID | Product | Status | Amount | Date |',
      '|---|---|---|---|---|',
      ...rows,
      '',
      '> Use `getOrderReceipt` with an Order ID to view redemption codes.',
    ].join('\n')

    return markdownResponse(md)
  } catch (e) {
    return markdownResponse(`# Error\n\nFailed to fetch orders: ${(e as Error).message}`, 502)
  }
}
