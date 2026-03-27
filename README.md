# Bitrefill Plugin for SperaxOS

Four plugin types covering all Bitrefill API actions — built for [plugin.delivery](https://github.com/nirholas/plugin.delivery).

## Plugins

| Plugin | Type | Identifier | Description |
|---|---|---|---|
| **Bitrefill** | Default | `sperax-bitrefill` | Full API: search, invoice, orders, eSIMs, deposits |
| **Bitrefill Catalog** | Markdown | `bitrefill-catalog` | Formatted product tables, order reports, receipts |
| **Bitrefill Store** | Standalone | `bitrefill-store` | Interactive full-screen storefront with checkout |
| **Bitrefill API** | OpenAPI | `bitrefill-openapi` | Auto-generated from OpenAPI 3.0 spec |

---

## File Structure

```
src/
  sperax-bitrefill.json       ← Default plugin definition
  bitrefill-catalog.json      ← Markdown plugin definition
  bitrefill-store.json        ← Standalone plugin definition
  bitrefill-openapi.json      ← OpenAPI plugin definition

api/
  _utils.ts                   ← Shared auth + CORS + response helpers
  sperax-bitrefill/
    manifest.ts               ← Manifest handler (served with CORS)
    search.ts                 ← Search products
    product.ts                ← Get product details
    balance.ts                ← Account balance
    invoice.ts                ← Create invoice
    invoice-status.ts         ← Get invoice status
    order.ts                  ← Get order + redemption codes
    orders.ts                 ← List orders
    phone-check.ts            ← Validate phone number
    esims.ts                  ← Purchase / top-up eSIM
    deposit.ts                ← Crypto deposit (Business API)
  bitrefill-catalog/
    manifest.ts               ← Manifest handler
    catalog.ts                ← Formatted product catalog (markdown)
    report.ts                 ← Order history report (markdown)
    receipt.ts                ← Order receipt with redemption codes (markdown)
  bitrefill-store/
    manifest.ts               ← Manifest handler
    app.ts                    ← Serves full standalone HTML storefront
  bitrefill-openapi/
    manifest.ts               ← Manifest handler
    spec.ts                   ← Serves OpenAPI 3.0 spec (inlined, edge-safe)

locales/
  sperax-bitrefill.en-US.json
  bitrefill-catalog.en-US.json
  bitrefill-store.en-US.json
  bitrefill-openapi.en-US.json

vercel.json                   ← Rewrites + CORS headers
tsconfig.json                 ← TypeScript config (edge-compatible)
```

---

## Plugin 1: Bitrefill (Default) — `sperax-bitrefill`

Server-rendered JSON — AI formats responses naturally.

**10 actions:**

| Action | Endpoint | Description |
|---|---|---|
| `searchProducts` | `/api/sperax-bitrefill/search` | Keyword + country + type filter |
| `getProductDetails` | `/api/sperax-bitrefill/product` | Denominations for any product ID |
| `getAccountBalance` | `/api/sperax-bitrefill/balance` | Current balance |
| `createInvoice` | `/api/sperax-bitrefill/invoice` | Purchase up to 20 products |
| `getInvoice` | `/api/sperax-bitrefill/invoice-status` | Invoice status + payment details |
| `getOrder` | `/api/sperax-bitrefill/order` | Redemption codes, PINs, links |
| `listOrders` | `/api/sperax-bitrefill/orders` | Order history with date filters |
| `checkPhoneNumber` | `/api/sperax-bitrefill/phone-check` | Validate E.164 number, find operators |
| `purchaseESIM` | `/api/sperax-bitrefill/esims` | Buy or top-up eSIM |
| `createDeposit` | `/api/sperax-bitrefill/deposit` | Fund balance via crypto (Business API) |

---

## Plugin 2: Bitrefill Catalog (Markdown) — `bitrefill-catalog`

Pre-formatted rich text returned directly — no AI post-processing.

**3 actions:**

| Action | Endpoint | Output |
|---|---|---|
| `getProductCatalog` | `/api/bitrefill-catalog/catalog` | Markdown table: name, ID, type, country, denominations |
| `getOrderHistoryReport` | `/api/bitrefill-catalog/report` | Order history with status summary |
| `getOrderReceipt` | `/api/bitrefill-catalog/receipt` | Full receipt with redemption code, PIN, instructions |

---

## Plugin 3: Bitrefill Store (Standalone) — `bitrefill-store`

Full dark-mode React/HTML storefront in an iframe.

**Features:**
- Product search with country + type filters
- Denomination picker (fixed packages + range input)
- Phone number input for top-ups
- Payment method selector (Balance, BTC, Lightning, ETH, USDC, USDT, SOL)
- Invoice creation with live payment status
- `postMessage` bridge to notify parent AI frame on purchase

Served by `api/bitrefill-store/app.ts` — single self-contained HTML file, no build step.

**Settings injection:** reads `API_KEY` / `API_ID` / `API_SECRET` via `postMessage` from plugin host frame, or `?apiKey=` URL param for local testing.

---

## Plugin 4: Bitrefill API (OpenAPI) — `bitrefill-openapi`

Auto-generated from a full OpenAPI 3.0 spec — no custom handlers beyond spec serving.

**Endpoints covered:**

| Group | Endpoints |
|---|---|
| Account | `/ping`, `/accounts/balance`, `/accounts/deposit` |
| Products | `/products`, `/products/search`, `/products/{id}` |
| eSIM Products | `/products/esims`, `/products/esims/{id}` |
| Phone | `/check_phone_number` |
| Invoices | `POST /invoices`, `GET /invoices`, `GET /invoices/{id}` |
| Orders | `GET /orders`, `GET /orders/{id}` |
| eSIMs | `POST /esims`, `GET /esims`, `GET /esims/{id}` |
| Batches | `POST /brgc-batches`, `GET /brgc-batches`, `GET /brgc-batches/{id}` |
| Affiliate | `GET /commissions` |

Spec served at: `https://plugin.delivery/api/bitrefill-openapi/spec` (edge-safe, inlined — no dynamic imports)

---

## Authentication

All plugins support two auth modes via plugin settings:

| Setting | Type | Description |
|---|---|---|
| `apiKey` | password | Personal API Bearer token |
| `apiId` | string | Business/Affiliate API ID |
| `apiSecret` | password | Business/Affiliate API Secret |

Get credentials at [bitrefill.com/account/developers](https://www.bitrefill.com/account/developers).

---

## Architecture

All API handlers use `api/_utils.ts` for:
- `getAuthHeader()` — supports both Bearer (Personal) and Basic (Business/Affiliate)
- `handleOptions()` — CORS preflight (`OPTIONS` → 204)
- `jsonResponse()` / `errorResponse()` / `markdownResponse()` — consistent response format with CORS headers
- All handlers run on Vercel Edge Runtime

---

## Adding to plugin.delivery

Copy these files into [nirholas/plugin.delivery](https://github.com/nirholas/plugin.delivery):
- `src/sperax-bitrefill.json` → `src/sperax-bitrefill.json`
- `src/bitrefill-catalog.json` → `src/bitrefill-catalog.json`
- `src/bitrefill-store.json` → `src/bitrefill-store.json`
- `src/bitrefill-openapi.json` → `src/bitrefill-openapi.json`
- `api/sperax-bitrefill/` → `api/sperax-bitrefill/`
- `api/bitrefill-catalog/` → `api/bitrefill-catalog/`
- `api/bitrefill-store/` → `api/bitrefill-store/`
- `api/bitrefill-openapi/` → `api/bitrefill-openapi/`
- `api/_utils.ts` → `api/_utils.ts` (or merge with existing utils)
- `locales/sperax-bitrefill.en-US.json` → `locales/`
- All other `locales/bitrefill-*.en-US.json` → `locales/`

---

## Adding agent to defi-agents

Copy from `bitrefill-agent/`:
- `src/bitrefill-shopping-assistant.json` → `src/`
- `locales/bitrefill-shopping-assistant.en-US.json` → `locales/`

The agent references `"plugins": ["sperax-bitrefill"]` to enable the Default plugin.

---

## Development

```bash
bun install
bun run dev        # Vercel local dev server
bun run format     # Format all JSON files
bun run lint       # tsc --noEmit type check
bun run deploy     # Deploy to Vercel production
```

## API Reference

Full Bitrefill API docs: [docs.bitrefill.com/docs](https://docs.bitrefill.com/docs/)

## License

MIT
