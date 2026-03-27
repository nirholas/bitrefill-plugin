export const config = { runtime: 'edge' }

import { handleOptions, CORS_HEADERS, PLUGIN_DOMAIN } from '../_utils.js'

function buildManifest() {
  const base = `${PLUGIN_DOMAIN}/api/bitrefill-store`
  return {
    identifier: 'bitrefill-store',
    version: 1,
    type: 'standalone',
    meta: {
      title: 'Bitrefill Store',
      avatar: '🛒',
      description:
        'Interactive Bitrefill storefront — search products, select denominations, checkout with crypto, and track orders.',
      tags: ['gift-cards', 'shopping', 'interactive', 'crypto-payments', 'bitrefill'],
      category: 'stocks-finance',
    },
    ui: {
      url: `${base}/app`,
      height: 700,
    },
    api: [
      {
        name: 'openStore',
        description: 'Open the interactive Bitrefill storefront',
        url: `${base}/app`,
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Pre-fill the search box' },
            country: { type: 'string', description: 'Pre-select country (ISO code)' },
          },
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
