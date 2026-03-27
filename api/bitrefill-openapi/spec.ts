export const config = { runtime: 'edge' }

import { handleOptions, CORS_HEADERS } from '../_utils.js'

// Inline spec — avoids dynamic import issues in edge runtime
const SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Bitrefill API v2',
    description:
      'Purchase gift cards, eSIMs, and mobile top-ups from 170+ countries. Supports Personal (Bearer), Business, and Affiliate API tiers.',
    version: '2.0.0',
    contact: { name: 'Bitrefill Docs', url: 'https://docs.bitrefill.com/docs' },
  },
  servers: [{ url: 'https://api.bitrefill.com/v2', description: 'Bitrefill API v2' }],
  security: [{ bearerAuth: [] }, { basicAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', description: 'Personal API Bearer token' },
      basicAuth: { type: 'http', scheme: 'basic', description: 'Business/Affiliate API: Base64(apiId:apiSecret)' },
    },
    schemas: {
      Package: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          value: { type: 'number' },
          eurPrice: { type: 'number' },
          usdPrice: { type: 'number' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['gift_card', 'phone_refill', 'esim', 'bill_payment'] },
          country: { type: 'string' },
          currency: { type: 'string' },
          inStock: { type: 'boolean' },
          packages: { type: 'array', items: { $ref: '#/components/schemas/Package' } },
          range: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
              step: { type: 'number' },
            },
          },
        },
      },
      RedemptionInfo: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          link: { type: 'string' },
          pin: { type: 'string' },
          instructions: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          product: { $ref: '#/components/schemas/Product' },
          redemption_info: { $ref: '#/components/schemas/RedemptionInfo' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/ping': {
      get: {
        operationId: 'ping',
        summary: 'Test API connectivity',
        responses: { '200': { description: 'pong' } },
      },
    },
    '/accounts/balance': {
      get: {
        operationId: 'getAccountBalance',
        summary: 'Get account balance',
        responses: { '200': { description: 'Balance' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/accounts/deposit': {
      post: {
        operationId: 'createDeposit',
        summary: 'Create crypto deposit (Business API only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currency', 'payment_method'],
                properties: {
                  currency: { type: 'string', enum: ['USD', 'EUR', 'BTC'] },
                  payment_method: { type: 'string' },
                  amount: { type: 'number', description: 'Omit for flexible deposit' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Deposit invoice' }, '403': { description: 'Business API only' } },
      },
    },
    '/products': {
      get: {
        operationId: 'listProducts',
        summary: 'List products',
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['gift_card', 'phone_refill', 'esim'] } },
          { name: 'start', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 50 } },
          { name: 'include_test_products', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'Product list' } },
      },
    },
    '/products/search': {
      get: {
        operationId: 'searchProducts',
        summary: 'Search products by keyword',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1, maxLength: 100 } },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 50 } },
          { name: 'include_test_products', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'Search results' } },
      },
    },
    '/products/{productId}': {
      get: {
        operationId: 'getProduct',
        summary: 'Get product details and denominations',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product with packages/range' }, '404': { description: 'Not found' } },
      },
    },
    '/products/esims': {
      get: {
        operationId: 'listESIMProducts',
        summary: 'List eSIM data plans',
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 50 } },
        ],
        responses: { '200': { description: 'eSIM product list' } },
      },
    },
    '/products/esims/{productId}': {
      get: {
        operationId: 'getESIMProduct',
        summary: 'Get eSIM product with bundle options',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'eSIM product details' } },
      },
    },
    '/check_phone_number': {
      get: {
        operationId: 'checkPhoneNumber',
        summary: 'Validate phone number and find operators',
        parameters: [{ name: 'phone_number', in: 'query', required: true, schema: { type: 'string' }, description: 'E.164 format' }],
        responses: { '200': { description: 'Operator info' } },
      },
    },
    '/invoices': {
      post: {
        operationId: 'createInvoice',
        summary: 'Create invoice (max 20 products)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['products'],
                properties: {
                  products: {
                    type: 'array',
                    maxItems: 20,
                    items: {
                      type: 'object',
                      required: ['product_id'],
                      properties: {
                        product_id: { type: 'string' },
                        package_id: { type: 'string' },
                        value: { type: 'number' },
                        quantity: { type: 'integer', default: 1 },
                        phone_number: { type: 'string', description: 'E.164 — required for phone_refill' },
                      },
                    },
                  },
                  payment_method: {
                    type: 'string',
                    enum: ['balance', 'bitcoin', 'lightning', 'ethereum', 'usdc_polygon', 'usdt_tron', 'litecoin', 'dogecoin', 'dash', 'solana'],
                    default: 'balance',
                  },
                  auto_pay: { type: 'boolean', default: false },
                  refund_address: { type: 'string', description: 'Required for crypto payments' },
                  webhook_url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Invoice created' },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        operationId: 'listInvoices',
        summary: 'List invoices',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'after', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { '200': { description: 'Invoice list' } },
      },
    },
    '/invoices/{invoiceId}': {
      get: {
        operationId: 'getInvoice',
        summary: 'Get invoice status',
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Invoice details' } },
      },
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        summary: 'List orders',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'after', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { '200': { description: 'Order list' } },
      },
    },
    '/orders/{orderId}': {
      get: {
        operationId: 'getOrder',
        summary: 'Get order with redemption codes',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order with redemption_info' } },
      },
    },
    '/esims': {
      post: {
        operationId: 'purchaseESIM',
        summary: 'Purchase new eSIM or top-up existing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['product_id', 'package_id'],
                properties: {
                  product_id: { type: 'string' },
                  package_id: { type: 'string' },
                  esim_id: { type: 'string', description: 'ICCID for top-up; omit for new eSIM' },
                  payment_method: { type: 'string' },
                  auto_pay: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'eSIM with QR code (barcode_value)' } },
      },
      get: {
        operationId: 'listESIMs',
        summary: 'List purchased eSIMs',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'eSIM list' } },
      },
    },
    '/esims/{esimId}': {
      get: {
        operationId: 'getESIM',
        summary: 'Get eSIM details, QR code, and bundle history',
        parameters: [{ name: 'esimId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'eSIM with package_history' } },
      },
    },
    '/brgc-batches': {
      post: {
        operationId: 'createBatch',
        summary: 'Create BRGC bulk gift card batch (Business API only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity', 'value', 'currency'],
                properties: {
                  quantity: { type: 'integer' },
                  value: { type: 'number' },
                  currency: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Batch created' }, '403': { description: 'Business API only' } },
      },
      get: {
        operationId: 'listBatches',
        summary: 'List BRGC batches',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Batch list' } },
      },
    },
    '/brgc-batches/{batchId}': {
      get: {
        operationId: 'getBatch',
        summary: 'Get batch status and card codes',
        parameters: [{ name: 'batchId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Batch with cards[] when complete' } },
      },
    },
    '/commissions': {
      get: {
        operationId: 'listCommissions',
        summary: 'List affiliate commissions (Affiliate API only)',
        parameters: [
          { name: 'start', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 50 } },
        ],
        responses: { '200': { description: 'Commissions with amount_satoshi, amount_usd, amount_eur' } },
      },
    },
  },
}

export default function handler(req: Request): Response {
  if (req.method === 'OPTIONS') return handleOptions()
  return new Response(JSON.stringify(SPEC), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
