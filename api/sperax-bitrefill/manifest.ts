export const config = { runtime: 'edge' }

import { handleOptions, CORS_HEADERS, PLUGIN_DOMAIN } from '../_utils.js'

function buildManifest() {
  const base = `${PLUGIN_DOMAIN}/api/sperax-bitrefill`
  return {
    identifier: 'sperax-bitrefill',
    version: 1,
    type: 'default',
    meta: {
      title: 'Bitrefill',
      avatar: '🎁',
      description:
        'Purchase gift cards, eSIMs, and mobile top-ups from 170+ countries. Search products, create invoices, pay with crypto, and retrieve redemption codes.',
      tags: ['gift-cards', 'esims', 'top-ups', 'crypto-shopping', 'bitcoin', 'bitrefill'],
      category: 'stocks-finance',
    },
    api: [
      {
        name: 'searchProducts',
        description: 'Search the Bitrefill product catalog for gift cards, eSIMs, and mobile top-ups',
        url: `${base}/search`,
        parameters: {
          type: 'object',
          properties: {
            q: { type: 'string', description: "Search query (e.g. 'amazon', 'netflix', 'steam')" },
            country: { type: 'string', description: 'ISO country code (e.g. US, GB, DE)' },
            type: { type: 'string', enum: ['gift_card', 'phone_refill', 'esim'], description: 'Product type filter' },
            limit: { type: 'number', description: 'Max results (default 20, max 50)' },
          },
        },
      },
      {
        name: 'getProductDetails',
        description: 'Get denomination options and full details for a specific product by ID',
        url: `${base}/product`,
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: "Product identifier (e.g. 'amazon-us')" },
          },
          required: ['product_id'],
        },
      },
      {
        name: 'getAccountBalance',
        description: 'Get current Bitrefill account balance',
        url: `${base}/balance`,
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'createInvoice',
        description:
          'Create an invoice to purchase one or more Bitrefill products (max 20). Supports auto-pay from balance or crypto payment.',
        url: `${base}/invoice`,
        parameters: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              description: 'Products to purchase (max 20)',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'string' },
                  package_id: { type: 'string', description: 'Fixed denomination package ID' },
                  value: { type: 'number', description: 'Custom value for range products' },
                  quantity: { type: 'number', description: 'Quantity (default 1)' },
                  phone_number: { type: 'string', description: 'E.164 phone number — required for phone_refill' },
                },
                required: ['product_id'],
              },
            },
            payment_method: {
              type: 'string',
              enum: [
                'balance',
                'bitcoin',
                'lightning',
                'ethereum',
                'usdc_polygon',
                'usdt_tron',
                'litecoin',
                'dogecoin',
                'solana',
              ],
              description: 'Payment method (default: balance)',
            },
            auto_pay: { type: 'boolean', description: 'Auto-pay from account balance' },
            refund_address: { type: 'string', description: 'Required for crypto payments' },
            webhook_url: { type: 'string', description: 'Webhook URL for delivery notifications' },
          },
          required: ['products'],
        },
      },
      {
        name: 'getInvoice',
        description: 'Get invoice status and payment details by ID',
        url: `${base}/invoice-status`,
        parameters: {
          type: 'object',
          properties: { invoice_id: { type: 'string', description: 'Invoice ID' } },
          required: ['invoice_id'],
        },
      },
      {
        name: 'getOrder',
        description: 'Get order details including redemption codes, PINs, and delivery instructions',
        url: `${base}/order`,
        parameters: {
          type: 'object',
          properties: { order_id: { type: 'string', description: 'Order ID' } },
          required: ['order_id'],
        },
      },
      {
        name: 'listOrders',
        description: 'List recent orders with optional date range filtering',
        url: `${base}/orders`,
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max results (default 20)' },
            after: { type: 'string', description: 'ISO 8601 start date (inclusive)' },
            before: { type: 'string', description: 'ISO 8601 end date (exclusive)' },
          },
        },
      },
      {
        name: 'checkPhoneNumber',
        description: 'Validate a phone number and find compatible mobile top-up operators',
        url: `${base}/phone-check`,
        parameters: {
          type: 'object',
          properties: { phone_number: { type: 'string', description: 'E.164 format (e.g. +15551234567)' } },
          required: ['phone_number'],
        },
      },
      {
        name: 'purchaseESIM',
        description: 'Purchase a new eSIM or add a data bundle to an existing eSIM',
        url: `${base}/esims`,
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            package_id: { type: 'string', description: "Data bundle ID (e.g. '3GB, 30 Days')" },
            esim_id: { type: 'string', description: 'Existing eSIM ICCID for top-up; omit for new purchase' },
            payment_method: { type: 'string' },
            auto_pay: { type: 'boolean' },
          },
          required: ['product_id', 'package_id'],
        },
      },
      {
        name: 'createDeposit',
        description: 'Create a crypto deposit to fund account balance (Business API only)',
        url: `${base}/deposit`,
        parameters: {
          type: 'object',
          properties: {
            currency: { type: 'string', enum: ['USD', 'EUR', 'BTC'] },
            payment_method: { type: 'string', description: 'bitcoin, lightning, ethereum, etc.' },
            amount: { type: 'number', description: 'Omit for flexible deposit' },
          },
          required: ['currency', 'payment_method'],
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
        apiId: { type: 'string', title: 'Business API ID', description: 'For Business/Affiliate accounts' },
        apiSecret: { type: 'password', title: 'Business API Secret', description: 'For Business/Affiliate accounts' },
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
