export const config = { runtime: 'edge' }

import { BITREFILL_BASE, handleOptions, getAuthHeader, markdownResponse, errorResponse } from '../_utils.js'

interface CatalogBody {
  apiKey?: string
  apiId?: string
  apiSecret?: string
  country?: string
  type?: string
  q?: string
  limit?: number
}

interface Package {
  id: string
  value: number
}

interface ProductRange {
  min: number
  max: number
  step: number
}

interface Product {
  id: string
  name: string
  type: string
  country?: string
  currency?: string
  packages?: Package[]
  range?: ProductRange
  inStock: boolean
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return markdownResponse('# Error\n\nMethod not allowed', 405)

  let body: CatalogBody
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
  if (body.country) params.set('country', body.country)
  if (body.type) params.set('type', body.type)
  params.set('limit', String(body.limit ?? 30))

  const endpoint = body.q
    ? `${BITREFILL_BASE}/products/search?q=${encodeURIComponent(body.q)}&${params}`
    : `${BITREFILL_BASE}/products?${params}`

  try {
    const res = await fetch(endpoint, { headers: { Authorization: authHeader } })
    const json = await res.json()
    const products: Product[] = json.data?.products ?? json.data ?? []

    if (!products.length) {
      const criteria = [body.q && `"${body.q}"`, body.country, body.type].filter(Boolean).join(', ')
      return markdownResponse(`# Bitrefill Product Catalog\n\nNo products found${criteria ? ` for ${criteria}` : ''}.`)
    }

    const filters = [
      body.q && `Search: "${body.q}"`,
      body.country && `Country: ${body.country}`,
      body.type && `Type: ${body.type.replace('_', ' ')}`,
    ]
      .filter(Boolean)
      .join(' · ')

    const title = `# 🎁 Bitrefill Product Catalog${filters ? `\n\n_${filters}_` : ''}`

    const rows = products.map((p) => {
      const denoms = p.packages?.length
        ? p.packages
            .slice(0, 3)
            .map((pkg) => `${p.currency ?? ''} ${pkg.value}`.trim())
            .join(', ') + (p.packages.length > 3 ? ` +${p.packages.length - 3}` : '')
        : p.range
          ? `${p.currency ?? ''} ${p.range.min}–${p.range.max}`.trim()
          : '—'

      return `| ${p.name} | \`${p.id}\` | ${p.type.replace('_', ' ')} | ${p.country ?? '—'} | ${denoms} | ${p.inStock ? '✅' : '❌'} |`
    })

    const md = [
      title,
      '',
      `_${products.length} products_`,
      '',
      '| Product | ID | Type | Country | Denominations | In Stock |',
      '|---|---|---|---|---|:---:|',
      ...rows,
      '',
      '> Pass the **ID** as `product_id` to the Bitrefill plugin to purchase.',
    ].join('\n')

    return markdownResponse(md)
  } catch (e) {
    return markdownResponse(`# Error\n\nFailed to fetch catalog: ${(e as Error).message}`, 502)
  }
}
