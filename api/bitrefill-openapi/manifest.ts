export const config = { runtime: 'edge' }

import { handleOptions, CORS_HEADERS, PLUGIN_DOMAIN } from '../_utils.js'

function buildManifest() {
  return {
    identifier: 'bitrefill-openapi',
    version: 1,
    type: 'openapi',
    meta: {
      title: 'Bitrefill API',
      avatar: '📡',
      description:
        'Direct Bitrefill API v2 access via OpenAPI spec. Full endpoint coverage: products, invoices, orders, eSIMs, deposits, commissions.',
      tags: ['bitrefill', 'api', 'openapi', 'gift-cards', 'esims'],
      category: 'stocks-finance',
    },
    openapi: `${PLUGIN_DOMAIN}/api/bitrefill-openapi/spec`,
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
