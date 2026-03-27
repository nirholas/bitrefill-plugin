export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, markdownResponse, errorResponse } from '../_utils.js'

interface RedemptionInfo {
  code?: string
  link?: string
  pin?: string
  instructions?: string
  expiresAt?: string
}

interface OrderProduct {
  name?: string
  id?: string
  type?: string
  value?: number
  currency?: string
}

interface OrderPayment {
  amount?: number
  currency?: string
  method?: string
}

interface OrderData {
  id: string
  status: string
  createdAt?: string
  product?: OrderProduct
  payment?: OrderPayment
  redemption_info?: RedemptionInfo
  phone_number?: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return markdownResponse('# Error\n\nMethod not allowed', 405)

  let body: { apiKey?: string; apiId?: string; apiSecret?: string; order_id: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  if (!body.order_id) {
    return markdownResponse('# Error\n\nMissing required parameter: `order_id`', 400)
  }

  let authHeader: string
  try {
    authHeader = getAuthHeader(body)
  } catch (e) {
    return markdownResponse(`# Error\n\n${(e as Error).message}`, 401)
  }

  try {
    const res = await fetch(`${BITREFILL_BASE}/orders/${encodeURIComponent(body.order_id)}`, {
      headers: { Authorization: authHeader },
    })
    const json = await res.json()
    const order: OrderData = json.data ?? json

    if (!order?.id) {
      return markdownResponse(`# Error\n\nOrder \`${body.order_id}\` not found.`, 404)
    }

    const ri = order.redemption_info
    const isDelivered = ['delivered', 'complete'].includes(order.status)
    const statusEmoji = isDelivered ? '✅' : order.status === 'failed' ? '❌' : '⏳'

    const lines = [
      `# 🧾 Receipt — \`${order.id}\``,
      '',
      `**Status:** ${statusEmoji} ${order.status}`,
      `**Date:** ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-US') : '—'}`,
      '',
      '## Product',
      '',
      '| Field | Value |',
      '|---|---|',
      `| Name | ${order.product?.name ?? '—'} |`,
      `| ID | \`${order.product?.id ?? '—'}\` |`,
      `| Type | ${order.product?.type?.replace('_', ' ') ?? '—'} |`,
      `| Value | ${order.product?.currency ?? ''} ${order.product?.value ?? '—'} |`,
    ]

    if (order.phone_number) {
      lines.push(`| Phone | ${order.phone_number} |`)
    }

    if (order.payment) {
      lines.push(
        '',
        '## Payment',
        '',
        '| Field | Value |',
        '|---|---|',
        `| Amount | ${order.payment.currency ?? ''} ${order.payment.amount ?? '—'} |`,
        `| Method | ${order.payment.method ?? '—'} |`
      )
    }

    if (ri) {
      lines.push('', '## 🔑 Redemption')

      if (ri.code) {
        lines.push('', '**Code:**', '```', ri.code, '```')
      }
      if (ri.pin) {
        lines.push('', `**PIN:** \`${ri.pin}\``)
      }
      if (ri.link) {
        lines.push('', `**Redeem:** [Click here](${ri.link})`)
      }
      if (ri.instructions) {
        lines.push('', '**Instructions:**', '', ri.instructions)
      }
      if (ri.expiresAt) {
        lines.push('', `> ⚠️ Expires: **${new Date(ri.expiresAt).toLocaleDateString('en-US')}**`)
      }
    } else if (order.product?.type === 'phone_refill') {
      lines.push('', '## Delivery', '', `✅ Balance added directly to ${order.phone_number ?? 'the phone number'}.`)
    } else if (!isDelivered) {
      lines.push('', '_Redemption info not yet available — order may still be processing._')
    }

    return markdownResponse(lines.join('\n'))
  } catch (e) {
    return markdownResponse(`# Error\n\nFailed to fetch order: ${(e as Error).message}`, 502)
  }
}
