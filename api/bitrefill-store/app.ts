export const config = { runtime: 'edge' }

// Standalone plugin — serves a full HTML storefront.
// All Bitrefill API calls are proxied through /api/sperax-bitrefill/* handlers
// to avoid CORS issues with direct browser → api.bitrefill.com calls.

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const query = url.searchParams.get('query') ?? ''
  const country = url.searchParams.get('country') ?? 'US'

  // Derive the origin so proxy calls are always same-domain
  const origin = `${url.protocol}//${url.host}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bitrefill Store</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f0f;color:#e0e0e0;min-height:100vh}
    .header{background:#1a1a2e;padding:16px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #2a2a4a;flex-wrap:wrap}
    .header h1{font-size:18px;font-weight:700;color:#fff}
    .search-bar{display:flex;gap:8px;flex:1;min-width:260px;max-width:500px}
    .search-bar input,.search-bar select{padding:8px 12px;border:1px solid #2a2a4a;border-radius:8px;background:#0f0f1a;color:#e0e0e0;font-size:14px;outline:none}
    .search-bar input{flex:1}
    .search-bar input:focus,.search-bar select:focus{border-color:#6366f1}
    .search-bar button{padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap}
    .search-bar button:hover{background:#4f46e5}
    .filters{display:flex;gap:8px;padding:12px 20px;background:#141428;border-bottom:1px solid #1f1f3a;flex-wrap:wrap}
    .filter-btn{padding:6px 14px;border:1px solid #2a2a4a;border-radius:20px;background:transparent;color:#aaa;cursor:pointer;font-size:13px;transition:all .15s}
    .filter-btn.active,.filter-btn:hover{border-color:#6366f1;color:#6366f1;background:#1a1a3a}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;padding:20px}
    .card{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:16px;cursor:pointer;transition:all .15s}
    .card:hover{border-color:#6366f1;transform:translateY(-2px);box-shadow:0 4px 20px rgba(99,102,241,.2)}
    .card .emoji{font-size:32px;margin-bottom:10px}
    .card .name{font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;line-height:1.3}
    .card .type{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
    .card .denoms{font-size:12px;color:#888}
    .stock{display:inline-block;margin-top:8px;font-size:11px;padding:2px 8px;border-radius:10px}
    .in-stock{background:#0d2d1a;color:#4ade80}
    .out-stock{background:#2d0d0d;color:#f87171}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
    .modal{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:16px;padding:24px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto}
    .modal h2{font-size:20px;font-weight:700;margin-bottom:4px}
    .modal .subtitle{color:#888;font-size:13px;margin-bottom:20px}
    .section-label{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
    .denom-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
    .denom-btn{padding:10px;border:1px solid #2a2a4a;border-radius:8px;background:#0f0f1a;color:#e0e0e0;cursor:pointer;font-size:14px;font-weight:600;text-align:center;transition:all .15s}
    .denom-btn:hover,.denom-btn.selected{border-color:#6366f1;background:#1a1a3a;color:#a5b4fc}
    .field{width:100%;padding:10px 14px;border:1px solid #2a2a4a;border-radius:8px;background:#0f0f1a;color:#e0e0e0;font-size:15px;outline:none;margin-bottom:14px}
    .field:focus{border-color:#6366f1}
    .range-hint{font-size:12px;color:#666;margin-top:-10px;margin-bottom:14px}
    .pay-row{margin-bottom:20px}
    .pay-row label{font-size:13px;color:#888;display:block;margin-bottom:6px}
    .pay-row select{width:100%;padding:10px 14px;border:1px solid #2a2a4a;border-radius:8px;background:#0f0f1a;color:#e0e0e0;font-size:14px}
    .checkout-btn{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:background .15s}
    .checkout-btn:hover{background:#4f46e5}
    .checkout-btn:disabled{background:#333;cursor:not-allowed}
    .close-btn{float:right;background:none;border:none;color:#888;font-size:20px;cursor:pointer;padding:0;line-height:1}
    .close-btn:hover{color:#fff}
    .status-box{padding:14px;border-radius:10px;margin-top:16px;font-size:14px}
    .status-success{background:#0d2d1a;border:1px solid #166534;color:#4ade80}
    .status-error{background:#2d0d0d;border:1px solid #991b1b;color:#f87171}
    .status-loading{background:#1a1a2e;border:1px solid #2a2a4a;color:#888}
    .invoice-box{background:#0f0f1a;border:1px solid #2a2a4a;border-radius:10px;padding:14px;font-size:13px;margin-top:12px}
    .invoice-box .lbl{color:#666;margin-bottom:2px}
    .invoice-box .val{color:#e0e0e0;font-family:monospace;font-size:12px;word-break:break-all;margin-bottom:10px}
    .auth-banner{background:#1f1520;border:1px solid #4a2060;border-radius:10px;padding:14px 20px;margin:20px;font-size:13px;color:#c084fc}
    .auth-banner a{color:#a78bfa}
    .empty{text-align:center;padding:60px 20px;color:#444}
    .empty .icon{font-size:48px;margin-bottom:12px}
    .loader{text-align:center;padding:40px;color:#555;font-size:14px}
  </style>
</head>
<body>

<div class="header">
  <span>🎁</span>
  <h1>Bitrefill Store</h1>
  <div class="search-bar">
    <input id="searchInput" type="text" placeholder="Search gift cards, eSIMs, top-ups..." value="${query}" />
    <select id="countrySelect">
      <option value="">All Countries</option>
      <option value="US" ${country === 'US' ? 'selected' : ''}>🇺🇸 US</option>
      <option value="GB">🇬🇧 UK</option>
      <option value="DE">🇩🇪 DE</option>
      <option value="FR">🇫🇷 FR</option>
      <option value="CA">🇨🇦 CA</option>
      <option value="AU">🇦🇺 AU</option>
      <option value="BR">🇧🇷 BR</option>
      <option value="IN">🇮🇳 IN</option>
      <option value="MX">🇲🇽 MX</option>
      <option value="JP">🇯🇵 JP</option>
    </select>
    <button onclick="doSearch()">Search</button>
  </div>
</div>

<div class="filters">
  <button class="filter-btn active" onclick="setType('',this)">All</button>
  <button class="filter-btn" onclick="setType('gift_card',this)">🎁 Gift Cards</button>
  <button class="filter-btn" onclick="setType('phone_refill',this)">📱 Top-ups</button>
  <button class="filter-btn" onclick="setType('esim',this)">🌐 eSIMs</button>
</div>

<div id="authBanner" class="auth-banner" style="display:none">
  ⚠️ No API key set. Configure in plugin settings.
  (<a href="https://www.bitrefill.com/account/developers" target="_blank">get one here</a>)
</div>

<div id="grid" class="grid"></div>
<div id="loader" class="loader">Loading products...</div>
<div id="empty" class="empty" style="display:none">
  <div class="icon">🔍</div>
  <div>No products found.</div>
</div>

<div id="modal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <button class="close-btn" onclick="closeModal()">✕</button>
    <div id="modalContent"></div>
  </div>
</div>

<script>
  const PROXY = '${origin}'

  let CREDS = { apiKey: '', apiId: '', apiSecret: '' }
  let currentType = ''
  let selectedProduct = null
  let selectedPackage = null

  // Receive credentials from parent plugin host
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'settings') {
      CREDS = {
        apiKey: e.data.apiKey || '',
        apiId: e.data.apiId || '',
        apiSecret: e.data.apiSecret || '',
      }
      updateAuthBanner()
      doSearch()
    }
  })

  // Allow apiKey via URL param for local testing only
  const _p = new URLSearchParams(location.search)
  if (_p.get('apiKey')) CREDS.apiKey = _p.get('apiKey')

  function hasCreds() {
    return !!(CREDS.apiKey || (CREDS.apiId && CREDS.apiSecret))
  }

  function updateAuthBanner() {
    document.getElementById('authBanner').style.display = hasCreds() ? 'none' : 'block'
  }

  function credsBody(extra) {
    return Object.assign({}, CREDS, extra)
  }

  async function callProxy(path, body) {
    const res = await fetch(PROXY + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  function setType(type, btn) {
    currentType = type
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    doSearch()
  }

  async function doSearch() {
    const q = document.getElementById('searchInput').value.trim()
    const country = document.getElementById('countrySelect').value
    const grid = document.getElementById('grid')
    const loader = document.getElementById('loader')
    const empty = document.getElementById('empty')

    grid.innerHTML = ''
    empty.style.display = 'none'

    if (!hasCreds()) {
      loader.style.display = 'none'
      updateAuthBanner()
      return
    }

    loader.style.display = 'block'

    try {
      const json = await callProxy('/api/sperax-bitrefill/search', credsBody({
        q: q || undefined,
        country: country || undefined,
        type: currentType || undefined,
        limit: 40,
      }))

      const products = json.data && json.data.products
        ? json.data.products
        : Array.isArray(json.data) ? json.data : []

      loader.style.display = 'none'

      if (!products.length) {
        empty.style.display = 'block'
        return
      }

      products.forEach(function(p) {
        const card = document.createElement('div')
        card.className = 'card'
        const emoji = p.type === 'phone_refill' ? '📱' : p.type === 'esim' ? '🌐' : '🎁'
        const denomText = p.packages && p.packages.length
          ? p.packages.slice(0,2).map(function(pkg){ return (p.currency||'') + ' ' + pkg.value }).join(', ')
          : p.range ? ((p.range.min) + '–' + (p.range.max) + ' ' + (p.currency||'')) : ''

        card.innerHTML =
          '<div class="emoji">' + emoji + '</div>' +
          '<div class="name">' + escHtml(p.name) + '</div>' +
          '<div class="type">' + (p.type||'').replace('_',' ') + '</div>' +
          '<div class="denoms">' + escHtml(denomText) + '</div>' +
          '<div class="stock ' + (p.inStock !== false ? 'in-stock' : 'out-stock') + '">' +
            (p.inStock !== false ? 'In Stock' : 'Out of Stock') +
          '</div>'

        card.onclick = function(){ openProduct(p) }
        grid.appendChild(card)
      })
    } catch(err) {
      loader.style.display = 'none'
      empty.innerHTML = '<div class="icon">⚠️</div><div>' + escHtml(err.message) + '</div>'
      empty.style.display = 'block'
    }
  }

  async function openProduct(product) {
    selectedProduct = product
    selectedPackage = null
    document.getElementById('modal').style.display = 'flex'
    document.getElementById('modalContent').innerHTML = '<div class="loader">Loading details...</div>'

    let detail = product
    try {
      const json = await callProxy('/api/sperax-bitrefill/product', credsBody({ product_id: product.id }))
      if (json.data) detail = json.data
    } catch(_) {}

    const isTopUp = detail.type === 'phone_refill'
    const isESIM = detail.type === 'esim'
    const packages = detail.packages || []
    const range = detail.range

    let denomHTML = ''
    if (packages.length) {
      denomHTML = '<div class="section-label">Select Amount</div><div class="denom-grid">'
      packages.forEach(function(pkg) {
        const label = isESIM ? pkg.value : ((detail.currency||'') + ' ' + pkg.value)
        denomHTML += '<button class="denom-btn" onclick="selectPkg(\'' + escAttr(pkg.id) + '\',this)">' + escHtml(String(label)) + '</button>'
      })
      denomHTML += '</div>'
    } else if (range) {
      denomHTML =
        '<div class="section-label">Enter Amount (' + (detail.currency||'') + ' ' + range.min + '–' + range.max + ')</div>' +
        '<input class="field" id="rangeValue" type="number" min="' + range.min + '" max="' + range.max + '" step="' + (range.step||1) + '" placeholder="' + range.min + '" />' +
        '<div class="range-hint">Min: ' + range.min + ' · Max: ' + range.max + ' · Step: ' + (range.step||1) + ' ' + (detail.currency||'') + '</div>'
    }

    const phoneHTML = isTopUp
      ? '<div class="section-label">Phone Number (E.164)</div><input class="field" id="phoneInput" type="tel" placeholder="+15551234567" />'
      : ''

    const refundHTML =
      '<div id="refundRow" style="display:none">' +
        '<div class="section-label">Refund Address (required for crypto)</div>' +
        '<input class="field" id="refundAddr" type="text" placeholder="Your crypto refund address" />' +
      '</div>'

    document.getElementById('modalContent').innerHTML =
      '<h2>🎁 ' + escHtml(detail.name) + '</h2>' +
      '<div class="subtitle">' + (detail.type||'').replace('_',' ') + ' · ' + (detail.country||'Global') + '</div>' +
      denomHTML +
      phoneHTML +
      '<div class="pay-row"><label>Payment Method</label>' +
        '<select id="payMethod" onchange="toggleRefund(this)">' +
          '<option value="balance">Account Balance</option>' +
          '<option value="bitcoin">Bitcoin</option>' +
          '<option value="lightning">Lightning Network</option>' +
          '<option value="ethereum">Ethereum</option>' +
          '<option value="usdc_polygon">USDC (Polygon)</option>' +
          '<option value="usdt_tron">USDT (Tron)</option>' +
          '<option value="solana">Solana</option>' +
        '</select>' +
      '</div>' +
      refundHTML +
      '<button class="checkout-btn" id="checkoutBtn" onclick="checkout()">Purchase</button>' +
      '<div id="checkoutStatus"></div>'
  }

  function toggleRefund(sel) {
    const row = document.getElementById('refundRow')
    if (row) row.style.display = sel.value === 'balance' ? 'none' : 'block'
  }

  function selectPkg(pkgId, btn) {
    selectedPackage = pkgId
    document.querySelectorAll('.denom-btn').forEach(function(b){ b.classList.remove('selected') })
    btn.classList.add('selected')
  }

  async function checkout() {
    const btn = document.getElementById('checkoutBtn')
    const statusEl = document.getElementById('checkoutStatus')
    const payMethod = document.getElementById('payMethod').value
    const phone = document.getElementById('phoneInput') ? document.getElementById('phoneInput').value : ''
    const rangeVal = document.getElementById('rangeValue') ? document.getElementById('rangeValue').value : ''
    const refundAddr = document.getElementById('refundAddr') ? document.getElementById('refundAddr').value : ''

    if (!hasCreds()) {
      statusEl.innerHTML = '<div class="status-box status-error">No API credentials configured.</div>'
      return
    }

    const item = { product_id: selectedProduct.id, quantity: 1 }
    if (selectedPackage) item.package_id = selectedPackage
    else if (rangeVal) item.value = parseFloat(rangeVal)
    else { statusEl.innerHTML = '<div class="status-box status-error">Please select an amount.</div>'; return }

    if (phone) item.phone_number = phone

    if (payMethod !== 'balance' && !refundAddr) {
      statusEl.innerHTML = '<div class="status-box status-error">A refund address is required for crypto payments.</div>'
      return
    }

    btn.disabled = true
    btn.textContent = 'Processing...'
    statusEl.innerHTML = '<div class="status-box status-loading">Creating invoice...</div>'

    try {
      const payload = {
        products: [item],
        payment_method: payMethod,
        auto_pay: payMethod === 'balance',
      }
      if (refundAddr) payload.refund_address = refundAddr

      const json = await callProxy('/api/sperax-bitrefill/invoice', credsBody(payload))
      const invoice = json.data || json

      if (json.error || json.message && !invoice.id) {
        statusEl.innerHTML = '<div class="status-box status-error">Error: ' + escHtml(json.error || json.message) + '</div>'
      } else if (payMethod === 'balance' && (invoice.status === 'complete' || invoice.status === 'pending')) {
        statusEl.innerHTML = '<div class="status-box status-success">✅ Purchase complete!<br/>Invoice: <code>' + escHtml(invoice.id) + '</code></div>'
        window.parent && window.parent.postMessage({ type: 'bitrefill:invoice', invoice: invoice }, '*')
      } else {
        let payDetails = '<div class="lbl">Check invoice status for payment details.</div>'
        if (invoice.payment) {
          payDetails =
            '<div class="lbl">Send to:</div><div class="val">' + escHtml(invoice.payment.address || '') + '</div>' +
            '<div class="lbl">Amount:</div><div class="val">' + escHtml(String(invoice.payment.amount || '')) + ' ' + escHtml(invoice.payment.currency || '') + '</div>'
        }
        statusEl.innerHTML =
          '<div class="status-box status-success">✅ Invoice created: <code>' + escHtml(invoice.id) + '</code><br/>Status: ' + escHtml(invoice.status) + '</div>' +
          '<div class="invoice-box">' + payDetails + '</div>'
        window.parent && window.parent.postMessage({ type: 'bitrefill:invoice', invoice: invoice }, '*')
      }
    } catch(err) {
      statusEl.innerHTML = '<div class="status-box status-error">Failed: ' + escHtml(err.message) + '</div>'
    }

    btn.disabled = false
    btn.textContent = 'Purchase'
  }

  function closeModal() {
    document.getElementById('modal').style.display = 'none'
    selectedProduct = null
    selectedPackage = null
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }
  function escAttr(s) {
    return String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;')
  }

  updateAuthBanner()
  doSearch()
</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
