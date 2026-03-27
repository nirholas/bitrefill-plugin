export const config = { runtime: 'edge' }

import { handleOptions, CORS_HEADERS, PLUGIN_DOMAIN } from '../_utils.js'

function buildManifest() {
  const base = `${PLUGIN_DOMAIN}/api/bitrefill-catalog`
  return {
    identifier: 'bitrefill-catalog',
    version: 1,
    type: 'markdown',
    meta: {
      title: 'Bitrefill Catalog',
      avatar: '📋',
      description:
        'Browse Bitrefill product catalogs and order history as formatted markdown reports. Gift card listings, order summaries, and redemption receipts.',
      tags: ['gift-cards', 'catalog', 'reports', 'orders', 'bitrefill'],
      category: 'stocks-finance',
    },
    api: [
      {
        name: 'getProductCatalog',
        description: 'Get a formatted markdown table of available products filtered by category, country, or keyword',
        url: `${base}/catalog`,
        parameters: {
          type: 'object',
          properties: {
            country: { type: 'string', description: 'ISO country code (e.g. US, GB)' },
            type: { type: 'string', enum: ['gift_card', 'phone_refill', 'esim'] },
            q: { type: 'string', description: 'Search keyword' },
            limit: { type: 'number', description: 'Max products (default 30)' },
          },
        },
      },
      {
        name: 'getOrderHistoryReport',
        description: 'Get a formatted markdown report of recent orders with statuses and totals',
        url: `${base}/report`,
        parameters: {
          type: 'object',
          properties: {
            after: { type: 'string', description: 'ISO 8601 start date' },
            before: { type: 'string', description: 'ISO 8601 end date' },
            limit: { type: 'number', description: 'Max orders (default 20)' },
          },
        },
      },
      {
        name: 'getOrderReceipt',
        description: 'Get a formatted markdown receipt for a completed order including redemption codes',
        url: `${base}/receipt`,
        parameters: {
          type: 'object',
          properties: { order_id: { type: 'string' } },
          required: ['order_id'],
        },
      },
    ],
    settings: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'password',
          title: 'Personal API Key',
          description: 'Bearer token from bitrefill.com/account/developers',
        },
        apiId: { type: 'string', title: 'Business API ID' },
        apiSecret: { type: 'password', title: 'Business API Secret' },
      },
    },
  }
}

export default function handler(req: Request): Response {
  if (req.method === 'OPTIONS') return handleOptions()
  return new Response(JSON.stringify(buildManifest()), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
