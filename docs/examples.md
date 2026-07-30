# bitrefill-plugin examples

Bitrefill plugins for SperaxOS — Default, Markdown, Standalone, and OpenAPI types

## Example 1

```text
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

scripts/
  build.ts                    ← Generates public/index.json from src/*.json

public/
  index.json                  ← Generated plugin registry (bun run build)

vercel.json                   ← Rewrites + CORS headers
tsconfig.json                 ← TypeScript config (edge-compatible)
```

## Example 2

```bash
bun install
bun run build      # Regenerate public/index.json from src/*.json
bun run dev        # Vercel local dev server
bun run format     # Format all JSON files
bun run lint       # tsc --noEmit type check
bun run deploy     # Deploy to Vercel production
```


Every snippet above is taken from the [repository documentation](https://github.com/nirholas/bitrefill-plugin#readme).
