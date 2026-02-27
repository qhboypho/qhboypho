import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// ─── INIT DB ───────────────────────────────────────────────────
async function initDB(db: D1Database) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT DEFAULT 'unisex',
      brand TEXT,
      material TEXT,
      thumbnail TEXT,
      images TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      color TEXT,
      size TEXT,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      voucher_code TEXT DEFAULT '',
      discount_amount REAL DEFAULT 0,
      note TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_amount REAL NOT NULL,
      valid_from DATETIME NOT NULL,
      valid_to DATETIME NOT NULL,
      usage_limit INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)`
  ]
  for (const sql of statements) {
    try { await db.prepare(sql).run() } catch (_) {}
  }
}

// ─── API: PRODUCTS ─────────────────────────────────────────────

// GET all active products (public)
app.get('/api/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`
    ).all()
    return c.json({ success: true, data: result.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET single product
app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
    if (!row) return c.json({ success: false, error: 'Not found' }, 404)
    return c.json({ success: true, data: row })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all products (admin)
app.get('/api/admin/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(
      `SELECT * FROM products ORDER BY created_at DESC`
    ).all()
    return c.json({ success: true, data: result.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST create product
app.post('/api/admin/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const {
      name, description, price, original_price,
      category, brand, material, thumbnail,
      images, colors, sizes, stock, is_featured
    } = body

    if (!name || !price) {
      return c.json({ success: false, error: 'Name and price are required' }, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO products 
        (name, description, price, original_price, category, brand, material, thumbnail, images, colors, sizes, stock, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category || 'unisex',
      brand || '',
      material || '',
      thumbnail || '',
      JSON.stringify(images || []),
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      parseInt(stock) || 0,
      is_featured ? 1 : 0
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PUT update product
app.put('/api/admin/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const {
      name, description, price, original_price,
      category, brand, material, thumbnail,
      images, colors, sizes, stock, is_active, is_featured
    } = body

    await c.env.DB.prepare(`
      UPDATE products SET
        name=?, description=?, price=?, original_price=?,
        category=?, brand=?, material=?, thumbnail=?,
        images=?, colors=?, sizes=?, stock=?, is_active=?, is_featured=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      name,
      description || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category || 'unisex',
      brand || '',
      material || '',
      thumbnail || '',
      JSON.stringify(images || []),
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      parseInt(stock) || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      is_featured ? 1 : 0,
      id
    ).run()

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE product
app.delete('/api/admin/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH toggle active
app.patch('/api/admin/products/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`
      UPDATE products SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ─── API: ORDERS ───────────────────────────────────────────────

// POST create order (public)
app.post('/api/orders', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const {
      customer_name, customer_phone, customer_address,
      product_id, color, size, quantity, note, voucher_code
    } = body

    if (!customer_name || !customer_phone || !customer_address || !product_id) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id=? AND is_active=1`).bind(product_id).first() as any
    if (!product) return c.json({ success: false, error: 'Product not found' }, 404)

    const qty = parseInt(quantity) || 1
    let discount = 0

    // Validate voucher if provided
    if (voucher_code && voucher_code.trim()) {
      const now = new Date().toISOString()
      const voucher = await c.env.DB.prepare(
        `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
      ).bind(voucher_code.trim().toUpperCase(), now, now).first() as any

      if (!voucher) {
        return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
      }
      if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
        return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
      }
      discount = voucher.discount_amount

      // Increment used_count
      await c.env.DB.prepare(`UPDATE vouchers SET used_count=used_count+1 WHERE id=?`).bind(voucher.id).run()
    }

    const subtotal = product.price * qty
    const total = Math.max(0, subtotal - discount)
    const orderCode = 'FS' + Date.now().toString(36).toUpperCase()

    const result = await c.env.DB.prepare(`
      INSERT INTO orders 
        (order_code, customer_name, customer_phone, customer_address, product_id, product_name, product_price, color, size, quantity, total_price, voucher_code, discount_amount, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderCode,
      customer_name,
      customer_phone,
      customer_address,
      product_id,
      product.name,
      product.price,
      color || '',
      size || '',
      qty,
      total,
      voucher_code ? voucher_code.trim().toUpperCase() : '',
      discount,
      note || ''
    ).run()

    return c.json({ success: true, order_code: orderCode, id: result.meta.last_row_id, discount, total })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all orders (admin)
app.get('/api/admin/orders', async (c) => {
  try {
    await initDB(c.env.DB)
    const status = c.req.query('status')
    let query = `SELECT * FROM orders ORDER BY created_at DESC`
    if (status && status !== 'all') {
      query = `SELECT * FROM orders WHERE status=? ORDER BY created_at DESC`
    }
    const stmt = status && status !== 'all'
      ? c.env.DB.prepare(query).bind(status)
      : c.env.DB.prepare(query)
    const result2 = await stmt.all()
    return c.json({ success: true, data: result2.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH update order status
app.patch('/api/admin/orders/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json()
    await c.env.DB.prepare(`
      UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(status, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE order
app.delete('/api/admin/orders/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM orders WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ─── API: VOUCHERS ─────────────────────────────────────────────

// POST validate voucher (public)
app.post('/api/vouchers/validate', async (c) => {
  try {
    await initDB(c.env.DB)
    const { code } = await c.req.json()
    if (!code) return c.json({ success: false, error: 'MISSING_CODE' }, 400)

    const now = new Date().toISOString()
    const voucher = await c.env.DB.prepare(
      `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
    ).bind(code.trim().toUpperCase(), now, now).first() as any

    if (!voucher) return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
    if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
      return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
    }

    return c.json({ success: true, data: { id: voucher.id, code: voucher.code, discount_amount: voucher.discount_amount } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all vouchers (admin)
app.get('/api/admin/vouchers', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(`SELECT * FROM vouchers ORDER BY created_at DESC`).all()
    return c.json({ success: true, data: result.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST create voucher (admin)
app.post('/api/admin/vouchers', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const { discount_amount, valid_from, valid_to, usage_limit, custom_code } = body

    if (!discount_amount || !valid_from || !valid_to) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    // Generate or use custom code
    let code = custom_code
      ? custom_code.trim().toUpperCase()
      : 'FASHION' + Math.random().toString(36).substring(2, 7).toUpperCase()

    // Ensure unique
    const existing = await c.env.DB.prepare(`SELECT id FROM vouchers WHERE code=?`).bind(code).first()
    if (existing) {
      code = code + Math.floor(Math.random() * 100)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO vouchers (code, discount_amount, valid_from, valid_to, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(code, parseFloat(discount_amount), valid_from, valid_to, parseInt(usage_limit) || 0).run()

    return c.json({ success: true, id: result.meta.last_row_id, code })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH toggle voucher active
app.patch('/api/admin/vouchers/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(
      `UPDATE vouchers SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END WHERE id=?`
    ).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE voucher
app.delete('/api/admin/vouchers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM vouchers WHERE id=?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET stats (admin dashboard)
app.get('/api/admin/stats', async (c) => {
  try {
    await initDB(c.env.DB)
    const totalProducts = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active=1`).first() as any
    const totalOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders`).first() as any
    const pendingOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE status='pending'`).first() as any
    const revenue = await c.env.DB.prepare(`SELECT SUM(total_price) as total FROM orders WHERE status != 'cancelled'`).first() as any
    const recentOrdersRes = await c.env.DB.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`).all()
    const recentOrders = recentOrdersRes

    return c.json({
      success: true,
      data: {
        totalProducts: totalProducts?.count || 0,
        totalOrders: totalOrders?.count || 0,
        pendingOrders: pendingOrders?.count || 0,
        revenue: revenue?.total || 0,
        recentOrders: recentOrders.results || []
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ─── FRONTEND ROUTES ───────────────────────────────────────────

// Admin
app.get('/admin', (c) => c.redirect('/admin/dashboard'))
app.get('/admin/*', (c) => {
  return c.html(adminHTML())
})

// Storefront (home)
app.get('/', (c) => {
  return c.html(storefrontHTML())
})

app.get('*', (c) => {
  return c.html(storefrontHTML())
})

// ─── HTML TEMPLATES ────────────────────────────────────────────

function storefrontHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FashionVN – Thời Trang Cao Cấp</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  h1,h2,h3,.font-display { font-family: 'Playfair Display', serif; }
  .gradient-hero { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); }
  .card-hover { transition: all 0.3s ease; }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
  .badge-sale { background: linear-gradient(135deg, #e84393, #c0392b); }
  .btn-primary { background: linear-gradient(135deg, #c0392b, #e84393); transition: all 0.3s; }
  .btn-primary:hover { background: linear-gradient(135deg, #a93226, #c0307a); transform: scale(1.02); }
  .overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
  .popup-card { animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  .color-btn.active { ring: 2px; outline: 3px solid #e84393; outline-offset: 2px; }
  .size-btn.active { background: #1a1a2e; color: white; }
  .img-gallery img { cursor: pointer; transition: all 0.2s; }
  .img-gallery img:hover { opacity: 0.8; transform: scale(1.05); }
  .toast { animation: fadeInOut 3s ease forwards; }
  @keyframes fadeInOut { 0%{opacity:0;transform:translateY(20px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 3px; }
  .product-img-main { aspect-ratio: 3/4; object-fit: cover; }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .navbar-blur { backdrop-filter: blur(12px); background: rgba(26,26,46,0.95); }
  .filter-btn.active { background: #c0392b; color: white; border-color: #c0392b; }
  /* Shake animation for validation */
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    15%{transform:translateX(-6px)}
    30%{transform:translateX(6px)}
    45%{transform:translateX(-5px)}
    60%{transform:translateX(5px)}
    75%{transform:translateX(-3px)}
    90%{transform:translateX(3px)}
  }
  .shake { animation: shake 0.5s ease; }
  .field-error label, .field-error .field-title { color: #e84393 !important; }
  .field-error input, .field-error textarea { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.15) !important; }
  /* Voucher styles */
  .voucher-success { background: linear-gradient(135deg,#d1fae5,#a7f3d0); border: 1.5px solid #6ee7b7; }
  .voucher-error { background: #fff1f2; border: 1.5px solid #fecdd3; }
  /* Cart modal */
  .cart-modal { animation: slideInRight 0.35s cubic-bezier(0.32,0.72,0,1); }
  @keyframes slideInRight { from { transform:translateX(100%); opacity:0.5; } to { transform:translateX(0); opacity:1; } }
  .cart-item { position:relative; overflow:hidden; touch-action:pan-y; }
  .cart-item-inner { position:relative; background:#fff; transition: transform 0.25s ease; }
  .cart-item-delete-bg { position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(135deg,#e84393,#c0392b); display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border-radius:0 0.75rem 0.75rem 0; }
  .cart-checkout { animation: slideUp 0.3s ease; }
  .cart-badge-bounce { animation: badgeBounce 0.4s cubic-bezier(0.36,0.07,0.19,0.97); }
  @keyframes badgeBounce { 0%{transform:scale(1)} 30%{transform:scale(1.5)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
  .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
  /* Checkout step in cart */
  .checkout-slide { animation: slideUp 0.3s ease; }
</style>
</head>
<body class="bg-gray-50">

<!-- NAVBAR -->
<nav class="navbar-blur fixed top-0 left-0 right-0 z-50 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2">
      <span class="text-2xl font-display text-white font-bold tracking-wide">Fashion<span class="text-pink-400">VN</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm text-gray-300">
      <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
      <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
      <a href="#contact" class="hover:text-pink-400 transition">Liên hệ</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="openCart()" id="cartNavBtn" class="relative text-white hover:text-pink-400 transition p-2">
        <i class="fas fa-shopping-bag text-xl"></i>
        <span id="cartBadge" class="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden font-bold">0</span>
      </button>
      <a href="/admin" class="text-gray-400 hover:text-white transition p-2" title="Admin">
        <i class="fas fa-user-shield"></i>
      </a>
      <button class="md:hidden text-white p-2" onclick="toggleMobileMenu()">
        <i class="fas fa-bars text-xl"></i>
      </button>
    </div>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden border-t border-white/10 py-4 px-4 flex flex-col gap-3">
    <a href="#products" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Sản phẩm</a>
    <a href="#about" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Về chúng tôi</a>
    <a href="#contact" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Liên hệ</a>
  </div>
</nav>

<!-- HERO -->
<section class="gradient-hero min-h-screen flex items-center pt-16" id="hero">
  <div class="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <p class="text-pink-400 font-medium tracking-widest uppercase text-sm mb-4">Bộ sưu tập mới 2026</p>
      <h1 class="font-display text-5xl md:text-6xl text-white font-bold leading-tight mb-6">
        Phong Cách<br><span class="text-transparent bg-clip-text" style="background:linear-gradient(135deg,#e84393,#f39c12)">Không Giới Hạn</span>
      </h1>
      <p class="text-gray-300 text-lg mb-8 leading-relaxed">Khám phá bộ sưu tập thời trang cao cấp dành cho cả nam lẫn nữ. Chất lượng vải premium, thiết kế tinh tế – thể hiện cá tính của bạn.</p>
      <div class="flex gap-4 flex-wrap">
        <a href="#products" class="btn-primary text-white px-8 py-3 rounded-full font-semibold">
          <i class="fas fa-shopping-bag mr-2"></i>Mua sắm ngay
        </a>
        <a href="#about" class="border border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
          Khám phá thêm
        </a>
      </div>
      <div class="mt-12 grid grid-cols-3 gap-6">
        <div class="text-center"><p class="text-3xl font-bold text-white">500+</p><p class="text-gray-400 text-sm">Sản phẩm</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">10K+</p><p class="text-gray-400 text-sm">Khách hàng</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">4.9★</p><p class="text-gray-400 text-sm">Đánh giá</p></div>
      </div>
    </div>
    <div class="hidden md:flex justify-center">
      <div class="relative w-80 h-96">
        <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-3xl rotate-6"></div>
        <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" alt="Hero Fashion" class="relative rounded-3xl w-full h-full object-cover shadow-2xl">
        <div class="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl">
          <p class="text-xs text-gray-500">Mới nhất</p>
          <p class="font-bold text-gray-800">Bộ sưu tập Spring 2026</p>
          <p class="text-pink-500 font-semibold">Từ 299.000đ</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FILTER BAR -->
<section class="sticky top-16 z-40 bg-white shadow-sm border-b" id="filterBar">
  <div class="max-w-7xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-none items-center">
    <span class="text-sm text-gray-500 whitespace-nowrap font-medium">Lọc:</span>
    <button class="filter-btn active whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition" data-cat="all" onclick="filterProducts('all',this)">Tất cả</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="unisex" onclick="filterProducts('unisex',this)">Unisex</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="male" onclick="filterProducts('male',this)">Nam</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="female" onclick="filterProducts('female',this)">Nữ</button>
    <div class="flex-1"></div>
    <div class="relative">
      <input type="text" id="searchInput" placeholder="Tìm sản phẩm..." 
        class="pl-8 pr-4 py-1.5 border rounded-full text-sm focus:outline-none focus:border-pink-400 w-48"
        oninput="searchProducts(this.value)">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
    </div>
  </div>
</section>

<!-- PRODUCTS -->
<section class="max-w-7xl mx-auto px-4 py-16" id="products">
  <div class="text-center mb-12">
    <p class="text-pink-500 font-medium tracking-widest uppercase text-sm">Khám phá ngay</p>
    <h2 class="font-display text-4xl font-bold text-gray-900 mt-2">Sản Phẩm Nổi Bật</h2>
    <p class="text-gray-500 mt-3">Những thiết kế được yêu thích nhất từ bộ sưu tập của chúng tôi</p>
  </div>
  <div id="productsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <!-- skeleton placeholders -->
    ${[1,2,3,4].map(() => `
    <div class="skeleton rounded-2xl h-80"></div>`).join('')}
  </div>
  <div id="emptyState" class="hidden text-center py-20">
    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-400 text-lg">Không tìm thấy sản phẩm nào</p>
  </div>
</section>

<!-- FEATURES SECTION -->
<section class="bg-white py-16" id="about">
  <div class="max-w-7xl mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 text-center">
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-truck text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Giao hàng toàn quốc</h3><p class="text-gray-500 text-sm">Giao tận nơi, nhanh chóng, an toàn</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-shield-alt text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Chất lượng đảm bảo</h3><p class="text-gray-500 text-sm">100% vải cao cấp, kiểm định chặt chẽ</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-undo text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Đổi trả dễ dàng</h3><p class="text-gray-500 text-sm">7 ngày đổi trả, không cần lý do</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-headset text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Hỗ trợ 24/7</h3><p class="text-gray-500 text-sm">Tư vấn nhiệt tình, tận tâm</p></div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="gradient-hero text-white py-12" id="contact">
  <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
    <div>
      <h3 class="font-display text-2xl font-bold mb-4">Fashion<span class="text-pink-400">VN</span></h3>
      <p class="text-gray-400 text-sm leading-relaxed">Thương hiệu thời trang Việt Nam cao cấp, mang phong cách hiện đại đến với mọi người.</p>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên kết nhanh</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
        <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
        <a href="/admin" class="hover:text-pink-400 transition">Quản trị</a>
      </div>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên hệ</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <p><i class="fas fa-phone mr-2 text-pink-400"></i>0987 654 321</p>
        <p><i class="fas fa-envelope mr-2 text-pink-400"></i>hello@fashionvn.com</p>
        <p><i class="fas fa-map-marker-alt mr-2 text-pink-400"></i>TP. Hồ Chí Minh, Việt Nam</p>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
    © 2026 FashionVN. All rights reserved.
  </div>
</footer>

<!-- ORDER POPUP -->
<div id="orderOverlay" class="fixed inset-0 overlay z-50 hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" id="orderPopupCard">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Đặt hàng nhanh</h3>
      <button onclick="closeOrder()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <div class="px-6 py-4">
      <!-- Product Preview -->
      <div id="orderProductPreview" class="flex gap-3 p-3 bg-gray-50 rounded-2xl mb-5">
        <img id="orderProductImg" src="" alt="" class="w-16 h-20 object-cover rounded-xl">
        <div>
          <p id="orderProductName" class="font-semibold text-gray-800 text-sm"></p>
          <p id="orderProductPrice" class="text-pink-600 font-bold mt-1"></p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Họ tên -->
        <div id="fieldName">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
          </label>
          <input type="text" id="orderName" placeholder="Nhập họ và tên"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- SĐT -->
        <div id="fieldPhone">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
          </label>
          <input type="tel" id="orderPhone" placeholder="0987 654 321"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- Địa chỉ -->
        <div id="fieldAddress">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
          </label>
          <textarea id="orderAddress" rows="2"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 resize-none"></textarea>
        </div>
        
        <!-- Color -->
        <div id="fieldColor">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc
          </label>
          <div id="colorOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Size -->
        <div id="sizeSection">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-ruler text-pink-400 mr-1"></i>Size
          </label>
          <div id="sizeOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Quantity -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-sort-numeric-up text-pink-400 mr-1"></i>Số lượng
          </label>
          <div class="flex items-center gap-3">
            <button onclick="changeQty(-1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">−</button>
            <span id="qtyDisplay" class="text-xl font-bold w-8 text-center">1</span>
            <button onclick="changeQty(1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">+</button>
          </div>
        </div>
        
        <!-- Voucher -->
        <div id="fieldVoucher">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
          </label>
          <div class="flex gap-2">
            <input type="text" id="orderVoucher" placeholder="Nhập mã voucher..."
              class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
            <button onclick="applyVoucher()" id="voucherBtn"
              class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
              Áp dụng
            </button>
          </div>
          <div id="voucherStatus" class="mt-2 hidden"></div>
        </div>
        
        <!-- Note -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
          </label>
          <input type="text" id="orderNote" placeholder="Ghi chú cho đơn hàng..."
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        
        <!-- Total -->
        <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
          <div id="subtotalRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-gray-500">Tạm tính:</span>
            <span id="orderSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
          </div>
          <div id="discountRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
            <span id="orderDiscount" class="text-sm font-bold text-green-600">-0đ</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Tổng cộng:</span>
            <span id="orderTotal" class="text-2xl font-bold text-pink-600">0đ</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button onclick="addCurrentToCart()" id="addToCartBtn"
            class="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition">
            <i class="fas fa-shopping-bag"></i><span class="hidden sm:inline">Giỏ hàng</span>
          </button>
          <button onclick="submitOrder()" id="submitOrderBtn"
            class="btn-primary flex-1 text-white py-3.5 rounded-xl font-bold text-base">
            <i class="fas fa-bolt mr-2"></i>Đặt ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PRODUCT DETAIL POPUP -->
<div id="detailOverlay" class="fixed inset-0 overlay z-50 hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Chi tiết sản phẩm</h3>
      <button onclick="closeDetail()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="detailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- CART MODAL (full-screen, slide from right) -->
<div id="cartOverlay" class="fixed inset-0 overlay z-50 hidden" onclick="handleCartOverlayClick(event)">
  <div id="cartModal" class="cart-modal absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white flex flex-col shadow-2xl">
    
    <!-- Cart Header -->
    <div id="cartHeader" class="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <button id="cartBackBtn" onclick="cartGoBack()" class="hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 id="cartTitle" class="font-display text-lg font-bold">Giỏ hàng</h2>
          <p id="cartSubtitle" class="text-xs text-gray-300">Chưa có sản phẩm</p>
        </div>
      </div>
      <button onclick="closeCart()" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- STEP 1: Cart items list -->
    <div id="cartStep1" class="flex flex-col flex-1 overflow-hidden">
      <!-- Check all bar -->
      <div id="cartCheckAllBar" class="hidden flex items-center gap-3 px-5 py-3 bg-gray-50 border-b flex-shrink-0">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)" class="w-4 h-4 accent-pink-500 cursor-pointer">
          <span class="text-sm font-medium text-gray-700">Chọn tất cả</span>
        </label>
        <span id="selectedCount" class="ml-auto text-xs text-gray-400"></span>
        <button onclick="removeChecked()" id="deleteCheckedBtn" class="hidden text-xs text-red-500 hover:text-red-600 font-medium transition">
          <i class="fas fa-trash mr-1"></i>Xoá đã chọn
        </button>
      </div>

      <!-- Items scroll area -->
      <div id="cartItemsList" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <!-- filled dynamically -->
      </div>

      <!-- Cart Footer -->
      <div id="cartFooter" class="hidden flex-shrink-0 border-t bg-white px-5 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-600 font-medium">Tổng cộng (<span id="cartSelectedItems">0</span> sản phẩm):</span>
          <span id="cartTotalPrice" class="text-xl font-bold text-pink-600">0đ</span>
        </div>
        <button onclick="proceedToCheckout()" id="checkoutBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
          <i class="fas fa-credit-card mr-2"></i>Xác nhận & Đặt hàng
        </button>
      </div>
    </div>

    <!-- STEP 2: Checkout form -->
    <div id="cartStep2" class="hidden flex-col flex-1 overflow-hidden checkout-slide">
      <!-- Order summary mini -->
      <div id="checkoutSummary" class="flex-shrink-0 bg-gray-50 border-b px-5 py-3 overflow-x-auto">
        <div id="checkoutSummaryItems" class="flex gap-3 min-w-max"></div>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <h3 class="font-display text-base font-bold text-gray-800 mb-4">Thông tin giao hàng</h3>
        <div class="space-y-4">
          <!-- Họ tên -->
          <div id="ckFieldName">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
            </label>
            <input type="text" id="ckName" placeholder="Nhập họ và tên"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldName')">
          </div>
          <!-- SĐT -->
          <div id="ckFieldPhone">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
            </label>
            <input type="tel" id="ckPhone" placeholder="0987 654 321"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldPhone')">
          </div>
          <!-- Địa chỉ -->
          <div id="ckFieldAddress">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
            </label>
            <textarea id="ckAddress" rows="2"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 resize-none"
              oninput="clearCheckoutError('ckFieldAddress')"></textarea>
          </div>
          <!-- Voucher -->
          <div id="ckFieldVoucher">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
            </label>
            <div class="flex gap-2">
              <input type="text" id="ckVoucher" placeholder="Nhập mã voucher..."
                class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
                oninput="this.value=this.value.toUpperCase()">
              <button onclick="applyCkVoucher()" id="ckVoucherBtn"
                class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
                Áp dụng
              </button>
            </div>
            <div id="ckVoucherStatus" class="mt-2 hidden"></div>
          </div>
          <!-- Note -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
            </label>
            <input type="text" id="ckNote" placeholder="Ghi chú cho đơn hàng..."
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
          </div>
          <!-- Total box -->
          <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
            <div id="ckSubtotalRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-gray-500">Tạm tính:</span>
              <span id="ckSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
            </div>
            <div id="ckDiscountRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
              <span id="ckDiscount" class="text-sm font-bold text-green-600">-0đ</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-semibold text-gray-700">Tổng cộng:</span>
              <span id="ckTotal" class="text-2xl font-bold text-pink-600">0đ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit button -->
      <div class="flex-shrink-0 border-t bg-white px-5 py-4">
        <button onclick="submitCartOrder()" id="submitCartBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>

  </div>
</div>

<!-- TOAST -->
<div id="toastContainer" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
let allProducts = []
let filteredProducts = []
let currentProduct = null
let orderQty = 1
let selectedColor = ''
let selectedSize = ''
let appliedVoucher = null   // { code, discount_amount }

// ── CART STATE ─────────────────────────────────────
// cart = [{ cartId, productId, name, sku, thumbnail, price, color, size, qty, checked }]
let cart = []
let cartStep = 1  // 1=list, 2=checkout
let ckAppliedVoucher = null

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('fashionvn_cart') || '[]') } catch { cart = [] }
  updateCartBadge()
}
function saveCart() {
  localStorage.setItem('fashionvn_cart', JSON.stringify(cart))
  updateCartBadge()
}
function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0)
  const badge = document.getElementById('cartBadge')
  if (!badge) return
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total
    badge.classList.remove('hidden')
    badge.classList.add('flex')
    badge.classList.add('cart-badge-bounce')
    setTimeout(()=>badge.classList.remove('cart-badge-bounce'),400)
  } else {
    badge.classList.add('hidden')
    badge.classList.remove('flex')
  }
}
function genCartId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

function addToCart(product, color, size, qty) {
  // check duplicate: same productId + color + size
  const exist = cart.find(i=>i.productId===product.id && i.color===color && i.size===size)
  if (exist) {
    exist.qty = Math.min(99, exist.qty + qty)
  } else {
    cart.push({
      cartId: genCartId(),
      productId: product.id,
      name: product.name,
      sku: product.sku || ('SKU-'+String(product.id).padStart(4,'0')),
      thumbnail: product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: product.price,
      color, size, qty,
      checked: true
    })
  }
  saveCart()
}

// ── INIT ──────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await axios.get('/api/products')
    allProducts = res.data.data || []
    filteredProducts = [...allProducts]
    renderProducts(filteredProducts)
  } catch(e) {
    document.getElementById('productsGrid').innerHTML = '<div class="col-span-4 text-center text-gray-400 py-12"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải sản phẩm</p></div>'
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid')
  const empty = document.getElementById('emptyState')
  if (!products.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')
  grid.innerHTML = products.map(p => {
    const colors = safeJson(p.colors)
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    return \`
    <div class="bg-white rounded-2xl overflow-hidden card-hover shadow-sm border border-gray-100 cursor-pointer" onclick="showDetail(\${p.id})">
      <div class="relative overflow-hidden bg-gray-100">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}"
          alt="\${p.name}" class="w-full product-img-main" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        \${discount > 0 ? \`<span class="absolute top-3 left-3 badge-sale text-white text-xs font-bold px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        \${p.is_featured ? \`<span class="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Hot</span>\` : ''}
        <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center opacity-0 hover:opacity-100">
          <span class="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Xem chi tiết</span>
        </div>
      </div>
      <div class="p-3 md:p-4">
        \${p.brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">\${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-pink-600 font-bold">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 text-xs line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length > 0 ? \`
        <div class="flex gap-1 mb-3 flex-wrap">
          \${colors.slice(0,4).map(c => \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}
          \${colors.length > 4 ? \`<span class="text-xs text-gray-400">+\${colors.length-4}</span>\` : ''}
        </div>\` : ''}
        <div class="flex gap-2">
          <button onclick="event.stopPropagation();openOrder(\${p.id})" title="Mua ngay"
            class="btn-primary flex-1 text-white py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-bolt mr-1"></i>Mua ngay
          </button>
          <button onclick="event.stopPropagation();addToCartFromCard(\${p.id})" title="Thêm vào giỏ"
            class="w-10 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition">
            <i class="fas fa-shopping-bag text-sm"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
}

// ── FILTER & SEARCH ────────────────────────────────
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  const search = document.getElementById('searchInput').value.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.brand||'').toLowerCase().includes(search)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

function searchProducts(q) {
  const activeCat = document.querySelector('.filter-btn.active')?.dataset.cat || 'all'
  const ql = q.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = activeCat === 'all' || p.category === activeCat
    const matchSearch = !q || p.name.toLowerCase().includes(ql) || (p.brand||'').toLowerCase().includes(ql)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

// ── PRODUCT DETAIL ─────────────────────────────────
async function showDetail(id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colors = safeJson(p.colors)
    const sizes = safeJson(p.sizes)
    const images = safeJson(p.images)
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    document.getElementById('detailContent').innerHTML = \`
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <img id="mainDetailImg" src="\${p.thumbnail || images[0] || ''}" alt="\${p.name}" class="w-full rounded-2xl h-80 object-cover mb-3">
        <div class="img-gallery grid grid-cols-4 gap-2">
          \${[p.thumbnail, ...images].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,8).map(img => \`
          <img src="\${img}" alt="" class="w-full h-16 object-cover rounded-lg border-2 border-transparent hover:border-pink-400"
            onclick="document.getElementById('mainDetailImg').src='\${img}'">\`).join('')}
        </div>
      </div>
      <div>
        \${p.brand ? \`<p class="text-sm text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h2 class="font-display text-2xl font-bold text-gray-900 mb-3">\${p.name}</h2>
        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 line-through">\${fmtPrice(p.original_price)}</span><span class="badge-sale text-white text-xs px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        </div>
        \${p.description ? \`<p class="text-gray-600 text-sm leading-relaxed mb-4">\${p.description}</p>\` : ''}
        \${p.material ? \`<p class="text-sm text-gray-500 mb-4"><strong>Chất liệu:</strong> \${p.material}</p>\` : ''}
        \${colors.length ? \`
        <div class="mb-4">
          <p class="text-sm font-semibold mb-2">Màu sắc: <span class="text-pink-500" id="detailColorLabel"></span></p>
          <div class="flex flex-wrap gap-2">
            \${colors.map(c => \`<button class="px-3 py-1.5 border rounded-lg text-sm hover:border-pink-400 hover:text-pink-600 transition" onclick="selectDetailColor('\${c}',this)">\${c}</button>\`).join('')}
          </div>
        </div>\` : ''}
        \${sizes.length ? \`
        <div class="mb-6">
          <p class="text-sm font-semibold mb-2">Size:</p>
          <div class="flex flex-wrap gap-2">
            \${sizes.map(s => \`<button class="size-btn w-12 h-10 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectDetailSize('\${s}',this)">\${s}</button>\`).join('')}
          </div>
        </div>\` : ''}
        <button onclick="closeDetail();openOrder(\${p.id})" class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>\`
    document.getElementById('detailOverlay').classList.remove('hidden')
  } catch(e) { showToast('Không thể tải chi tiết sản phẩm', 'error') }
}

function selectDetailColor(c, btn) {
  btn.closest('.flex').querySelectorAll('button').forEach(b => b.classList.remove('bg-pink-50','border-pink-400','text-pink-600'))
  btn.classList.add('bg-pink-50','border-pink-400','text-pink-600')
  document.getElementById('detailColorLabel').textContent = c
}
function selectDetailSize(s, btn) {
  btn.closest('.flex').querySelectorAll('button').forEach(b => b.classList.remove('active','bg-gray-900','text-white'))
  btn.classList.add('active','bg-gray-900','text-white')
}
function closeDetail() { document.getElementById('detailOverlay').classList.add('hidden') }

// ── ORDER POPUP ────────────────────────────────────
async function openOrder(id) {
  try {
    const res = await axios.get('/api/products/' + id)
    currentProduct = res.data.data
    orderQty = 1
    selectedColor = ''
    selectedSize = ''
    appliedVoucher = null

    document.getElementById('orderProductImg').src = currentProduct.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    document.getElementById('orderProductName').textContent = currentProduct.name
    document.getElementById('orderProductPrice').textContent = fmtPrice(currentProduct.price)
    document.getElementById('qtyDisplay').textContent = '1'
    document.getElementById('orderName').value = ''
    document.getElementById('orderPhone').value = ''
    document.getElementById('orderAddress').value = ''
    document.getElementById('orderNote').value = ''
    document.getElementById('orderVoucher').value = ''
    document.getElementById('voucherStatus').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
    document.getElementById('subtotalRow').classList.add('hidden')
    // Clear field errors
    ;['fieldName','fieldPhone','fieldAddress','fieldColor'].forEach(id => {
      document.getElementById(id)?.classList.remove('field-error','shake')
    })
    updateOrderTotal()

    // Colors
    const colors = safeJson(currentProduct.colors)
    const colorDiv = document.getElementById('colorOptions')
    colorDiv.innerHTML = colors.length ? colors.map(c => \`
      <button class="color-btn px-3 py-1.5 border rounded-lg text-sm hover:border-pink-400 transition" onclick="selectOrderColor('\${c}',this)">\${c}</button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có lựa chọn màu</p>'

    // Sizes
    const sizes = safeJson(currentProduct.sizes)
    const sizeDiv = document.getElementById('sizeOptions')
    sizeDiv.innerHTML = sizes.length ? sizes.map(s => \`
      <button class="size-btn px-3 py-1.5 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectOrderSize('\${s}',this)">\${s}</button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có size</p>'
    document.getElementById('sizeSection').style.display = sizes.length ? '' : 'none'

    document.getElementById('orderOverlay').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  } catch(e) { showToast('Lỗi khi tải sản phẩm', 'error') }
}

function selectOrderColor(c, btn) {
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active','bg-pink-50','border-pink-400','text-pink-600'))
  btn.classList.add('active','bg-pink-50','border-pink-400','text-pink-600')
  selectedColor = c
  document.getElementById('fieldColor')?.classList.remove('field-error','shake')
}
function selectOrderSize(s, btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active','bg-gray-900','text-white','border-gray-900'))
  btn.classList.add('active','bg-gray-900','text-white','border-gray-900')
  selectedSize = s
}
function changeQty(d) {
  orderQty = Math.max(1, Math.min(99, orderQty + d))
  document.getElementById('qtyDisplay').textContent = orderQty
  updateOrderTotal()
}
function updateOrderTotal() {
  if (!currentProduct) return
  const subtotal = currentProduct.price * orderQty
  const discount = appliedVoucher ? appliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('orderTotal').textContent = fmtPrice(total)
  if (appliedVoucher) {
    document.getElementById('orderSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('orderDiscount').textContent = '-' + fmtPrice(discount)
    document.getElementById('subtotalRow').classList.remove('hidden')
    document.getElementById('discountRow').classList.remove('hidden')
  } else {
    document.getElementById('subtotalRow').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
  }
}
function closeOrder() {
  document.getElementById('orderOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}

// Add to cart from product card (no color/size selection needed – opens order popup instead if has options)
async function addToCartFromCard(id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colors = safeJson(p.colors)
    const sizes = safeJson(p.sizes)
    // If product has color/size options, open order popup to select first
    if (colors.length > 0 || sizes.length > 0) {
      openOrder(id)
      showToast('Vui lòng chọn màu/size rồi thêm vào giỏ', 'success', 2500)
      return
    }
    addToCart(p, '', '', 1)
    showToast('Da them "' + p.name + '" vao gio hang!', 'success', 2500)
  } catch(e) { showToast('Loi khi them vao gio', 'error') }
}

// ── VOUCHER ────────────────────────────────────────
async function applyVoucher() {
  const code = document.getElementById('orderVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('voucherStatus')
  const btn = document.getElementById('voucherBtn')
  
  if (!code) {
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML = '<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden')
    return
  }
  
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    appliedVoucher = res.data.data
    statusEl.className = 'mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML = \`<i class="fas fa-check-circle text-green-500"></i>Áp dụng thành công! Giảm <strong>\${fmtPrice(appliedVoucher.discount_amount)}</strong>\`
    statusEl.classList.remove('hidden')
    updateOrderTotal()
    document.getElementById('orderVoucher').classList.add('border-green-400','bg-green-50')
  } catch(err) {
    appliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode === 'VOUCHER_LIMIT' ? 'Voucher đã hết lượt sử dụng'
              : errCode === 'INVALID_VOUCHER' ? 'Mã không hợp lệ hoặc đã hết hạn'
              : 'Không thể áp dụng mã này'
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML = \`<i class="fas fa-times-circle mr-1"></i>\${msg}\`
    statusEl.classList.remove('hidden')
    document.getElementById('orderVoucher').classList.remove('border-green-400','bg-green-50')
    updateOrderTotal()
  } finally {
    btn.disabled = false
    btn.innerHTML = appliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if (appliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}

// ── VALIDATION SHAKE + SCROLL ─────────────────────
function shakeField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth  // reflow to restart animation
  el.classList.add('shake')
  // Scroll to field inside popup
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => el.classList.remove('shake'), 600)
}
function clearFieldError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}

// ── SUBMIT ORDER ───────────────────────────────────
async function submitOrder() {
  const name = document.getElementById('orderName').value.trim()
  const phone = document.getElementById('orderPhone').value.trim()
  const address = document.getElementById('orderAddress').value.trim()

  // Validate with shake + scroll
  if (!name) { shakeField('fieldName'); return }
  clearFieldError('fieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/\\s/g,''))) { shakeField('fieldPhone'); return }
  clearFieldError('fieldPhone')
  if (!address) { shakeField('fieldAddress'); return }
  clearFieldError('fieldAddress')

  const btn = document.getElementById('submitOrderBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'

  try {
    const res = await axios.post('/api/orders', {
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      product_id: currentProduct.id,
      color: selectedColor,
      size: selectedSize,
      quantity: orderQty,
      voucher_code: appliedVoucher ? appliedVoucher.code : '',
      note: document.getElementById('orderNote').value.trim()
    })
    closeOrder()
    showToast(\`🎉 Đặt hàng thành công! Mã đơn: \${res.data.order_code}\`, 'success', 5000)
  } catch(e) {
    const errCode = e.response?.data?.error
    if (errCode === 'INVALID_VOUCHER' || errCode === 'VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực, vui lòng thử lại', 'error')
      appliedVoucher = null
      updateOrderTotal()
      document.getElementById('voucherBtn').innerHTML = 'Áp dụng'
      document.getElementById('voucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else {
      showToast('Đặt hàng thất bại, thử lại sau', 'error')
    }
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

// Add current product from order popup to cart
function addCurrentToCart() {
  if (!currentProduct) return
  addToCart(currentProduct, selectedColor, selectedSize, orderQty)
  closeOrder()
  showToast('Da them "' + currentProduct.name + '" vao gio hang!', 'success', 2500)
}

// ── UTILS ──────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p) }
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }

function showToast(msg, type='success', duration=3000) {
  const c = document.getElementById('toastContainer')
  const t = document.createElement('div')
  t.className = \`toast px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':'bg-green-500'}\`
  t.textContent = msg
  c.appendChild(t)
  setTimeout(() => t.remove(), duration)
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu')
  m.classList.toggle('hidden')
}
// ── CART MODAL ────────────────────────────────────
function openCart() {
  cartStep = 1
  ckAppliedVoucher = null
  renderCartStep1()
  document.getElementById('cartOverlay').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  document.body.style.overflow = 'hidden'
}
function closeCart() {
  document.getElementById('cartOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}
function handleCartOverlayClick(e) {
  if (e.target.id === 'cartOverlay') closeCart()
}
function cartGoBack() {
  cartStep = 1
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  updateCartHeaderSubtitle()
}

function renderCartStep1() {
  const listEl = document.getElementById('cartItemsList')
  const checkAllBar = document.getElementById('cartCheckAllBar')
  const footer = document.getElementById('cartFooter')
  
  if (cart.length === 0) {
    checkAllBar.classList.add('hidden')
    footer.classList.add('hidden')
    listEl.innerHTML = '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-shopping-bag text-4xl text-gray-300"></i></div><p class="text-gray-500 font-medium text-lg mb-1">Chua co san pham nao</p><p class="text-gray-400 text-sm">Hay them san pham vao gio hang</p><button onclick="closeCart()" class="mt-6 btn-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm"><i class="fas fa-arrow-left mr-2"></i>Tiep tuc mua sam</button></div>'
    updateCartHeaderSubtitle()
    return
  }

  checkAllBar.classList.remove('hidden')
  footer.classList.remove('hidden')

  // Sync checkAll state
  const allChecked = cart.every(i=>i.checked)
  document.getElementById('checkAll').checked = allChecked

  listEl.innerHTML = cart.map(function(item) {
    const col = (typeof item.color === 'string' && item.color) ? item.color : ''
    const sz = item.size || ''
    const chk = item.checked ? 'checked' : ''
    const colorTag = col ? '<span class="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full">' + col + '</span>' : ''
    const sizeTag = sz ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + sz + '</span>' : ''
    return '<div class="cart-item rounded-xl border border-gray-200 bg-white" data-cart-id="' + item.cartId + '">'
      + '<div class="cart-item-delete-bg cart-del-btn" data-id="' + item.cartId + '"><i class="fas fa-trash"></i></div>'
      + '<div class="cart-item-inner rounded-xl p-3" data-cart-id="' + item.cartId + '">'
      + '<div class="flex gap-3 items-start">'
      + '<div class="flex-shrink-0 pt-1"><input type="checkbox" ' + chk + ' data-toggle-id="' + item.cartId + '" class="cart-chk w-4 h-4 accent-pink-500 cursor-pointer mt-0.5"></div>'
      + '<img src="' + item.thumbnail + '" alt="' + item.name + '" class="w-16 h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0">'
      + '<p class="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">' + item.name + '</p>'
      + '<p class="text-xs text-gray-400 mb-1">' + item.sku + '</p>'
      + '<div class="flex flex-wrap gap-1 mb-2">' + colorTag + sizeTag + '</div>'
      + '<div class="flex items-center justify-between">'
      + '<span class="text-pink-600 font-bold text-sm">' + fmtPrice(item.price) + '</span>'
      + '<div class="flex items-center gap-2">'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="-1">&minus;</button>'
      + '<span class="text-sm font-bold w-6 text-center">' + item.qty + '</span>'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="1">+</button>'
      + '</div></div>'
      + '<p class="text-right text-xs text-gray-400 mt-1">= ' + fmtPrice(item.price * item.qty) + '</p>'
      + '</div></div></div></div>'
  }).join('')

  // Bind events via delegation
  listEl.querySelectorAll('.cart-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { removeCartItem(btn.dataset.id) })
  })
  listEl.querySelectorAll('.cart-chk').forEach(function(cb) {
    cb.addEventListener('change', function() { toggleCartItem(cb.dataset.toggleId, cb.checked) })
  })
  listEl.querySelectorAll('.cart-qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { changeCartQty(btn.dataset.id, parseInt(btn.dataset.delta)) })
  })

  // Setup swipe-to-delete for each item
  setupSwipeToDelete()
  updateCartSummary()
  updateCartHeaderSubtitle()
}

function updateCartHeaderSubtitle() {
  const total = cart.reduce(function(s,i){return s+i.qty},0)
  document.getElementById('cartSubtitle').textContent = total > 0 ? (total + ' san pham trong gio') : 'Chua co san pham nao'
}

function toggleCheckAll(cb) {
  cart.forEach(i=>i.checked = cb.checked)
  saveCart()
  renderCartStep1()
}
function toggleCartItem(cartId, checked) {
  const item = cart.find(i=>i.cartId===cartId)
  if (item) item.checked = checked
  saveCart()
  updateCartSummary()
  // sync checkAll
  document.getElementById('checkAll').checked = cart.every(i=>i.checked)
}
function updateCartSummary() {
  const checked = cart.filter(i=>i.checked)
  const total = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const count = checked.length
  document.getElementById('cartSelectedItems').textContent = checked.reduce((s,i)=>s+i.qty,0)
  document.getElementById('cartTotalPrice').textContent = fmtPrice(total)
  const deleteBtn = document.getElementById('deleteCheckedBtn')
  const checkoutBtn = document.getElementById('checkoutBtn')
  if (count > 0) {
    deleteBtn.classList.remove('hidden')
    checkoutBtn.disabled = false
  } else {
    deleteBtn.classList.add('hidden')
    checkoutBtn.disabled = true
  }
  document.getElementById('selectedCount').textContent = 'Da chon ' + count
}
function changeCartQty(cartId, delta) {
  const item = cart.find(i=>i.cartId===cartId)
  if (!item) return
  item.qty = Math.max(1, Math.min(99, item.qty + delta))
  saveCart()
  renderCartStep1()
}
function removeCartItem(cartId) {
  cart = cart.filter(i=>i.cartId!==cartId)
  saveCart()
  renderCartStep1()
}
function removeChecked() {
  cart = cart.filter(i=>!i.checked)
  saveCart()
  renderCartStep1()
}

// ── SWIPE TO DELETE ────────────────────────────────
function setupSwipeToDelete() {
  document.querySelectorAll('.cart-item').forEach(itemEl => {
    const inner = itemEl.querySelector('.cart-item-inner')
    if (!inner) return
    let startX = 0, currentX = 0, isDragging = false
    const threshold = 60

    function onStart(e) {
      startX = e.touches ? e.touches[0].clientX : e.clientX
      isDragging = true
    }
    function onMove(e) {
      if (!isDragging) return
      currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX
      if (currentX < 0) {
        inner.style.transform = 'translateX(' + Math.max(currentX,-80) + 'px)'
      } else {
        inner.style.transform = ''
      }
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      const cartId = inner.dataset.cartId
      if (currentX < -threshold) {
        inner.style.transform = 'translateX(-80px)'
        setTimeout(()=>removeCartItem(cartId),200)
      } else {
        inner.style.transform = ''
      }
      currentX = 0
    }
    inner.addEventListener('touchstart', onStart, {passive:true})
    inner.addEventListener('touchmove', onMove, {passive:true})
    inner.addEventListener('touchend', onEnd)
    inner.addEventListener('mousedown', onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
  })
}

// ── CHECKOUT from CART ────────────────────────────
function proceedToCheckout() {
  const checked = cart.filter(i=>i.checked)
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 sản phẩm','error'); return }
  // Build summary
  document.getElementById('checkoutSummaryItems').innerHTML = checked.map(function(i){
    return '<div class="flex-shrink-0 w-20 text-center">'
      + '<div class="relative inline-block">'
      + '<img src="' + i.thumbnail + '" class="w-16 h-20 object-cover rounded-xl border-2 border-white shadow" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<span class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">' + i.qty + '</span>'
      + '</div><p class="text-xs text-gray-600 mt-1 line-clamp-1">' + i.name + '</p></div>'
  }).join('')
  // reset form
  ;['ckName','ckPhone','ckAddress','ckNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
  ;['ckFieldName','ckFieldPhone','ckFieldAddress'].forEach(id => clearCheckoutError(id))
  ckAppliedVoucher = null
  document.getElementById('ckVoucher').value = ''
  document.getElementById('ckVoucherStatus').classList.add('hidden')
  document.getElementById('ckVoucherBtn').textContent = 'Áp dụng'
  document.getElementById('ckVoucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  updateCkTotal()
  // show step2
  cartStep = 2
  document.getElementById('cartStep1').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('flex')
  document.getElementById('cartBackBtn').classList.remove('hidden')
  document.getElementById('cartTitle').textContent = 'Xác nhận đơn hàng'
  document.getElementById('cartSubtitle').textContent = checked.reduce(function(s,i){return s+i.qty},0) + ' san pham'
}

function updateCkTotal() {
  const checked = cart.filter(i=>i.checked)
  const subtotal = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const discount = ckAppliedVoucher ? ckAppliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('ckTotal').textContent = fmtPrice(total)
  if (ckAppliedVoucher) {
    document.getElementById('ckSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('ckDiscount').textContent = '-'+fmtPrice(discount)
    document.getElementById('ckSubtotalRow').classList.remove('hidden')
    document.getElementById('ckDiscountRow').classList.remove('hidden')
  } else {
    document.getElementById('ckSubtotalRow').classList.add('hidden')
    document.getElementById('ckDiscountRow').classList.add('hidden')
  }
}
async function applyCkVoucher() {
  const code = document.getElementById('ckVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('ckVoucherStatus')
  const btn = document.getElementById('ckVoucherBtn')
  if (!code) {
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden'); return
  }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    ckAppliedVoucher = res.data.data
    statusEl.className='mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML='<i class="fas fa-check-circle text-green-500"></i>Ap dung thanh cong! Giam <strong>' + fmtPrice(ckAppliedVoucher.discount_amount) + '</strong>'
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.add('border-green-400','bg-green-50')
    updateCkTotal()
  } catch(err) {
    ckAppliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode==='VOUCHER_LIMIT'?'Voucher đã hết lượt':errCode==='INVALID_VOUCHER'?'Mã không hợp lệ hoặc hết hạn':'Không thể áp dụng'
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>' + msg
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.remove('border-green-400','bg-green-50')
    updateCkTotal()
  } finally {
    btn.disabled=false
    btn.innerHTML = ckAppliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if(ckAppliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}
function shakeCheckoutField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
  el.scrollIntoView({ behavior:'smooth', block:'center' })
  setTimeout(()=>el.classList.remove('shake'),600)
}
function clearCheckoutError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}
async function submitCartOrder() {
  const name = document.getElementById('ckName').value.trim()
  const phone = document.getElementById('ckPhone').value.trim()
  const address = document.getElementById('ckAddress').value.trim()
  if (!name) { shakeCheckoutField('ckFieldName'); return }
  clearCheckoutError('ckFieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/\s/g,''))) { shakeCheckoutField('ckFieldPhone'); return }
  clearCheckoutError('ckFieldPhone')
  if (!address) { shakeCheckoutField('ckFieldAddress'); return }
  clearCheckoutError('ckFieldAddress')

  const note = document.getElementById('ckNote').value.trim()
  const checkedItems = cart.filter(i=>i.checked)
  const btn = document.getElementById('submitCartBtn')
  btn.disabled=true
  btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'

  try {
    const codes = []
    for (const item of checkedItems) {
      const res = await axios.post('/api/orders', {
        customer_name: name, customer_phone: phone, customer_address: address,
        product_id: item.productId, color: item.color, size: item.size,
        quantity: item.qty,
        voucher_code: ckAppliedVoucher ? ckAppliedVoucher.code : '',
        note
      })
      codes.push(res.data.order_code)
    }
    // Remove checked items from cart
    cart = cart.filter(i=>!i.checked)
    saveCart()
    closeCart()
    showToast('Dat hang thanh cong! ' + codes.length + ' don hang da duoc tao', 'success', 5000)
  } catch(e) {
    const errCode = e.response?.data?.error
    if (errCode==='INVALID_VOUCHER'||errCode==='VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực','error')
      ckAppliedVoucher=null; updateCkTotal()
      document.getElementById('ckVoucherBtn').innerHTML='Áp dụng'
      document.getElementById('ckVoucherBtn').className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else { showToast('Đặt hàng thất bại, thử lại sau','error') }
  } finally {
    btn.disabled=false
    btn.innerHTML='<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

function toggleCart() { openCart() }

// Close overlays on outside click
document.getElementById('orderOverlay').addEventListener('click', (e) => { if(e.target.id==='orderOverlay') closeOrder() })
document.getElementById('detailOverlay').addEventListener('click', (e) => { if(e.target.id==='detailOverlay') closeDetail() })

// Auto clear error on input
;['orderName','orderPhone','orderAddress'].forEach(id => {
  const el = document.getElementById(id)
  if(el) el.addEventListener('input', () => {
    const fieldMap = { orderName:'fieldName', orderPhone:'fieldPhone', orderAddress:'fieldAddress' }
    clearFieldError(fieldMap[id])
  })
})

// Init
loadCart()
loadProducts()
</script>
</body>
</html>`
}

// ─── ADMIN HTML ────────────────────────────────────
function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin – FashionVN</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .sidebar { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); }
  .nav-item { transition: all 0.2s; }
  .nav-item.active, .nav-item:hover { background: rgba(232,67,147,0.15); color: #e84393; }
  .nav-item.active { border-left: 3px solid #e84393; }
  .stat-card { background: linear-gradient(135deg, var(--from), var(--to)); }
  .btn-pink { background: linear-gradient(135deg,#e84393,#c0392b); transition:all 0.2s; }
  .btn-pink:hover { opacity:0.9; transform:scale(1.01); }
  .table-row:hover { background: #fdf2f8; }
  .badge { display:inline-flex; align-items:center; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:600; }
  .badge-pending { background:#fef3c7; color:#d97706; }
  .badge-confirmed { background:#dbeafe; color:#2563eb; }
  .badge-shipping { background:#ede9fe; color:#7c3aed; }
  .badge-done { background:#d1fae5; color:#059669; }
  .badge-cancelled { background:#fee2e2; color:#dc2626; }
  .modal-overlay { background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); }
  .modal-card { animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .img-slot { aspect-ratio:1; border:2px dashed #e5e7eb; border-radius:12px; cursor:pointer; transition:all 0.2s; }
  .img-slot:hover { border-color:#e84393; background:#fdf2f8; }
  .img-slot.has-img { border-style:solid; border-color:#e84393; }
  .tag-item { display:inline-flex; align-items:center; background:#fdf2f8; border:1px solid #f9a8d4; color:#be185d; border-radius:999px; padding:3px 10px; font-size:13px; gap:4px; }
  .tag-del { cursor:pointer; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#fecdd3; color:#e11d48; font-size:10px; }
  .tag-del:hover { background:#fca5a5; }
  .toast-admin { animation: slideIn 0.3s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  .scrollbar-thin::-webkit-scrollbar { width:4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background:#e84393; border-radius:2px; }
  .mobile-overlay { background:rgba(0,0,0,0.5); }
  [x-cloak] { display:none; }
  .col-tag { width: 32px; height: 32px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; }
</style>
</head>
<body class="bg-gray-50 flex">

<!-- MOBILE MENU TOGGLE -->
<button id="menuToggle" onclick="toggleSidebar()" class="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg rounded-xl p-2.5">
  <i class="fas fa-bars text-gray-700"></i>
</button>

<!-- SIDEBAR OVERLAY (mobile) -->
<div id="sidebarOverlay" class="fixed inset-0 mobile-overlay z-30 hidden md:hidden" onclick="toggleSidebar()"></div>

<!-- SIDEBAR -->
<aside id="sidebar" class="sidebar w-64 min-h-screen fixed left-0 top-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300 flex flex-col">
  <div class="p-6 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
        <i class="fas fa-tshirt text-white text-sm"></i>
      </div>
      <div>
        <p class="text-white font-bold text-lg leading-tight">Fashion<span class="text-pink-400">VN</span></p>
        <p class="text-gray-400 text-xs">Admin Panel</p>
      </div>
    </div>
  </div>
  
  <nav class="p-4 flex-1 space-y-1">
    <button class="nav-item active w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="dashboard" onclick="showPage('dashboard')">
      <i class="fas fa-chart-pie w-5"></i>Dashboard
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="products" onclick="showPage('products')">
      <i class="fas fa-tshirt w-5"></i>Sản phẩm
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="orders" onclick="showPage('orders')">
      <i class="fas fa-clipboard-list w-5"></i>Đơn hàng
      <span id="pendingBadge" class="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 hidden"></span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="vouchers" onclick="showPage('vouchers')">
      <i class="fas fa-ticket-alt w-5"></i>Voucher
    </button>
  </nav>
  
  <div class="p-4 border-t border-white/10">
    <a href="/" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 text-sm hover:text-pink-400 transition">
      <i class="fas fa-external-link-alt w-5"></i>Xem trang chủ
    </a>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="flex-1 md:ml-64 min-h-screen">
  <!-- Top bar -->
  <header class="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
    <div class="ml-10 md:ml-0">
      <h1 id="pageTitle" class="text-lg font-bold text-gray-800">Dashboard</h1>
    </div>
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
        <span class="text-white font-bold text-sm">A</span>
      </div>
    </div>
  </header>

  <!-- DASHBOARD PAGE -->
  <div id="page-dashboard" class="p-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#e84393;--to:#c0392b">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Sản phẩm</p><p id="statProducts" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-tshirt"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#667eea;--to:#764ba2">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Đơn hàng</p><p id="statOrders" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-shopping-bag"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#f093fb;--to:#f5576c">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Chờ xử lý</p><p id="statPending" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-clock"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#43e97b;--to:#38f9d7">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Doanh thu</p><p id="statRevenue" class="text-2xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-coins"></i></div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-800">Đơn hàng gần đây</h2>
        <button onclick="showPage('orders')" class="text-pink-500 text-sm hover:underline">Xem tất cả</button>
      </div>
      <div id="recentOrdersTable" class="overflow-x-auto">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
      </div>
    </div>
  </div>

  <!-- PRODUCTS PAGE -->
  <div id="page-products" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 items-center">
        <input type="text" id="productSearch" placeholder="Tìm sản phẩm..." oninput="filterAdminProducts()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
        <select id="productCatFilter" onchange="filterAdminProducts()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="">Tất cả</option>
          <option value="unisex">Unisex</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </div>
      <button onclick="openProductModal()" class="btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
        <i class="fas fa-plus"></i>Thêm sản phẩm
      </button>
    </div>
    
    <div id="adminProductsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
  </div>

  <!-- ORDERS PAGE -->
  <div id="page-orders" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        <select id="orderStatusFilter" onchange="loadAdminOrders()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="done">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <input type="text" id="orderSearch" placeholder="Tìm tên/SĐT/mã..." oninput="filterOrders()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
      </div>
      <button onclick="exportExcel()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
        <i class="fas fa-file-excel"></i>Xuất Excel
      </button>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Mã ĐH</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Sản phẩm</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Màu/Size</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600 hidden sm:table-cell">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600 hidden lg:table-cell">Voucher</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody id="ordersTable"></tbody>
        </table>
      </div>
      <div id="ordersEmpty" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-inbox text-4xl mb-3"></i><p>Không có đơn hàng nào</p>
      </div>
    </div>
    <div id="orderStats" class="mt-4 text-sm text-gray-500 text-right"></div>
  </div>

  <!-- VOUCHERS PAGE -->
  <div id="page-vouchers" class="p-6 hidden">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Create Voucher Form -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <h2 class="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <i class="fas fa-plus-circle text-pink-500"></i>Tạo Voucher mới
        </h2>
        <form onsubmit="createVoucher(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-coins text-pink-400 mr-1"></i>Số tiền giảm (VNĐ) *
            </label>
            <input type="number" id="vDiscount" placeholder="VD: 50000" min="1000" required
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-check text-pink-400 mr-1"></i>Hiệu lực từ *
              </label>
              <input type="datetime-local" id="vFrom" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-times text-pink-400 mr-1"></i>Hết hạn *
              </label>
              <input type="datetime-local" id="vTo" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-barcode text-pink-400 mr-1"></i>Mã tuỳ chỉnh <span class="text-gray-400 font-normal">(để trống = tự sinh)</span>
            </label>
            <input type="text" id="vCode" placeholder="VD: SUMMER30"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-users text-pink-400 mr-1"></i>Giới hạn lượt dùng <span class="text-gray-400 font-normal">(0 = không giới hạn)</span>
            </label>
            <input type="number" id="vLimit" placeholder="0" min="0" value="0"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <button type="submit" id="createVoucherBtn" class="btn-pink w-full text-white py-3 rounded-xl font-bold text-sm">
            <i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher
          </button>
        </form>
        <!-- Generated code display -->
        <div id="generatedCode" class="hidden mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 text-center">
          <p class="text-xs text-gray-500 mb-1">Mã voucher vừa tạo:</p>
          <p id="generatedCodeText" class="text-2xl font-bold tracking-widest text-pink-600 font-mono"></p>
          <button onclick="copyCode()" class="mt-2 text-xs text-gray-500 hover:text-pink-500 transition">
            <i class="fas fa-copy mr-1"></i>Sao chép
          </button>
        </div>
      </div>

      <!-- Voucher List -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
            <i class="fas fa-list text-pink-500"></i>Danh sách Voucher
          </h2>
          <button onclick="loadVouchers()" class="text-sm text-pink-500 hover:underline">
            <i class="fas fa-sync-alt mr-1"></i>Làm mới
          </button>
        </div>
        <div id="voucherList" class="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
        </div>
      </div>
    </div>
  </div>

</main>

<!-- PRODUCT MODAL -->
<div id="productModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 id="modalTitle" class="font-bold text-xl text-gray-900">Thêm sản phẩm mới</h2>
      <button onclick="closeProductModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <form id="productForm" onsubmit="saveProduct(event)" class="px-6 py-5 space-y-6">
      <input type="hidden" id="productId">
      
      <!-- Basic Info -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Tên sản phẩm *</label>
          <input type="text" id="pName" required placeholder="VD: Áo thun Unisex Premium" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá bán (VNĐ) *</label>
          <input type="number" id="pPrice" required placeholder="299000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá gốc (VNĐ)</label>
          <input type="number" id="pOriginalPrice" placeholder="399000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Danh mục</label>
          <select id="pCategory" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            <option value="unisex">Unisex</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Thương hiệu</label>
          <input type="text" id="pBrand" placeholder="VD: FashionVN" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Chất liệu</label>
          <input type="text" id="pMaterial" placeholder="VD: 100% Cotton Combed" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Mô tả</label>
          <textarea id="pDescription" rows="3" placeholder="Mô tả chi tiết về sản phẩm..." class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Số lượng tồn kho</label>
          <input type="number" id="pStock" placeholder="100" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="flex items-center gap-6 pt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pFeatured" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pActive" checked class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Hiển thị</span>
          </label>
        </div>
      </div>
      
      <!-- Thumbnail -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-image text-pink-400 mr-1"></i>Thumbnail chính</label>
        <div class="flex gap-3 items-start">
          <div class="img-slot w-28 h-28 flex flex-col items-center justify-center" id="thumbnailPreviewBox" onclick="document.getElementById('thumbnailInput').click()">
            <img id="thumbnailPreview" src="" alt="" class="w-full h-full object-cover rounded-xl hidden">
            <div id="thumbnailPlaceholder" class="flex flex-col items-center gap-1 text-gray-400">
              <i class="fas fa-camera text-2xl"></i>
              <span class="text-xs">Thêm ảnh</span>
            </div>
          </div>
          <div class="flex-1">
            <input type="url" id="pThumbnail" placeholder="Dán URL ảnh thumbnail..." class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 mb-2" oninput="previewThumbnail(this.value)">
            <input type="file" id="thumbnailInput" accept="image/*" class="hidden" onchange="handleThumbnailFile(this)">
            <p class="text-xs text-gray-400">Nhập URL hoặc tải lên từ máy tính</p>
          </div>
        </div>
      </div>
      
      <!-- Gallery (9 images) -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-images text-pink-400 mr-1"></i>Thư viện ảnh <span class="text-gray-400 font-normal">(tối đa 9 ảnh)</span></label>
        <div class="grid grid-cols-3 gap-3" id="galleryGrid">
          ${[0,1,2,3,4,5,6,7,8].map(i => `
          <div class="img-slot relative flex flex-col items-center justify-center" id="slot-${i}">
            <img id="galleryImg-${i}" src="" alt="" class="w-full h-full object-cover rounded-xl hidden absolute inset-0">
            <div class="flex flex-col items-center gap-1 text-gray-400 text-center p-2" id="slotPlaceholder-${i}">
              <i class="fas fa-plus text-lg"></i>
              <span class="text-xs">Ảnh ${i+1}</span>
            </div>
            <button type="button" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden text-xs z-10" 
              id="slotDel-${i}" onclick="removeGalleryImg(${i})">×</button>
            <input type="file" accept="image/*" class="hidden" id="galleryFile-${i}" onchange="handleGalleryFile(${i},this)">
          </div>`).join('')}
        </div>
        <p class="text-xs text-gray-400 mt-2">Nhấn vào ô để thêm ảnh; hoặc dán URL bên dưới</p>
        <div class="mt-2 flex gap-2">
          <input type="url" id="galleryUrlInput" placeholder="Dán URL ảnh rồi nhấn Thêm..." class="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <button type="button" onclick="addGalleryUrl()" class="btn-pink text-white px-4 py-2 rounded-xl text-sm font-semibold">Thêm</button>
        </div>
      </div>
      
      <!-- Colors -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc</label>
        <div id="colorTags" class="flex flex-wrap gap-2 mb-2 min-h-[36px]"></div>
        <div class="flex gap-2">
          <input type="text" id="colorInput" placeholder="VD: Đen, Trắng, Navy..." class="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400" 
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('color')}">
          <button type="button" onclick="addTag('color')" class="btn-pink text-white px-4 py-2 rounded-xl text-sm">Thêm</button>
        </div>
        <p class="text-xs text-gray-400 mt-1">Nhấn Enter hoặc Thêm để thêm màu</p>
      </div>
      
      <!-- Sizes -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-ruler text-pink-400 mr-1"></i>Size số</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button type="button" onclick="addPresetSizes(['XS','S','M','L','XL','XXL'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ XS→XXL</button>
          <button type="button" onclick="addPresetSizes(['28','29','30','31','32','33','34'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size quần</button>
          <button type="button" onclick="addPresetSizes(['35','36','37','38','39','40','41','42'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size giày</button>
        </div>
        <div id="sizeTags" class="flex flex-wrap gap-2 mb-2 min-h-[36px]"></div>
        <div class="flex gap-2">
          <input type="text" id="sizeInput" placeholder="VD: S, M, L, XL, 28, 29..." class="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('size')}">
          <button type="button" onclick="addTag('size')" class="btn-pink text-white px-4 py-2 rounded-xl text-sm">Thêm</button>
        </div>
      </div>
      
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeProductModal()" class="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Huỷ</button>
        <button type="submit" class="flex-1 btn-pink text-white py-3 rounded-xl font-semibold">
          <i class="fas fa-save mr-2"></i><span id="saveBtn">Lưu sản phẩm</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ORDER DETAIL MODAL -->
<div id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-lg">
    <div class="border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-xl text-gray-900">Chi tiết đơn hàng</h2>
      <button onclick="document.getElementById('orderDetailModal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div id="orderDetailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- TOAST -->
<div id="adminToast" class="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
// ── STATE ─────────────────────────────────────────
let adminProducts = []
let adminOrders = []
let colors = []
let sizes = []
let galleryImages = ['','','','','','','','','']
let editingId = null
let gallerySlotClickBound = false

// ── NAVIGATION ────────────────────────────────────
function showPage(name) {
  ['dashboard','products','orders','vouchers'].forEach(p => {
    document.getElementById('page-'+p).classList.toggle('hidden', p !== name)
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.page === name)
    })
  })
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', orders:'Quản lý Đơn hàng', vouchers:'Quản lý Voucher'}
  document.getElementById('pageTitle').textContent = titles[name] || name

  if (name === 'dashboard') loadDashboard()
  else if (name === 'products') loadAdminProducts()
  else if (name === 'orders') loadAdminOrders()
  else if (name === 'vouchers') loadVouchers()

  // Close mobile sidebar
  document.getElementById('sidebar').classList.add('-translate-x-full')
  document.getElementById('sidebarOverlay').classList.add('hidden')
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-full')
  document.getElementById('sidebarOverlay').classList.toggle('hidden')
}

// ── DASHBOARD ─────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await axios.get('/api/admin/stats')
    const d = res.data.data
    document.getElementById('statProducts').textContent = d.totalProducts
    document.getElementById('statOrders').textContent = d.totalOrders
    document.getElementById('statPending').textContent = d.pendingOrders
    document.getElementById('statRevenue').textContent = fmtPrice(d.revenue)
    
    if (d.pendingOrders > 0) {
      document.getElementById('pendingBadge').textContent = d.pendingOrders
      document.getElementById('pendingBadge').classList.remove('hidden')
    }
    
    const recent = d.recentOrders
    if (!recent.length) {
      document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Tổng tiền</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' +
      recent.map(o => '<tr class="border-b last:border-0"><td class="py-2 pr-4 font-mono text-xs text-blue-600">' + o.order_code + '</td><td class="py-2 pr-4">' + o.customer_name + '</td><td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(o.total_price) + '</td><td class="py-2 text-center"><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td></tr>').join('') +
      '</tbody></table>'
  } catch(e) { console.error(e) }
}

// ── PRODUCTS ─────────────────────────────────────
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    adminProducts = res.data.data || []
    renderAdminProducts(adminProducts)
  } catch(e) { grid.innerHTML = '<div class="col-span-4 text-center py-12 text-red-400">Lỗi tải dữ liệu</div>' }
}

function filterAdminProducts() {
  const q = document.getElementById('productSearch').value.toLowerCase()
  const cat = document.getElementById('productCatFilter').value
  const filtered = adminProducts.filter(p => 
    (!q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)) &&
    (!cat || p.category === cat)
  )
  renderAdminProducts(filtered)
}

function renderAdminProducts(products) {
  const grid = document.getElementById('adminProductsGrid')
  if (!products.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm</p></div>'
    return
  }
  grid.innerHTML = products.map(p => {
    const colors = safeJson(p.colors)
    const sizes = safeJson(p.sizes)
    return \`
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!p.is_active ? 'opacity-60' : ''}">
      <div class="relative h-48 bg-gray-100 overflow-hidden">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}" alt="\${p.name}" 
          class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <div class="absolute top-2 left-2 flex gap-1">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">\${catLabel(p.category)}</span>
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">⭐ Hot</span>' : ''}
        </div>
        <div class="absolute top-2 right-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block \${p.is_active ? 'bg-green-400' : 'bg-gray-400'}"></span>
        </div>
      </div>
      <div class="p-4">
        \${p.brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-xs text-gray-400 line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${colors.slice(0,3).map(c=>\`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}\${colors.length>3?\`<span class="text-xs text-gray-400">+\${colors.length-3}</span>\`:''}</div>\` : ''}
        \${sizes.length ? \`<div class="flex flex-wrap gap-1 mb-3">\${sizes.slice(0,4).map(s=>\`<span class="text-xs border text-gray-600 px-1.5 py-0.5 rounded">\${s}</span>\`).join('')}\${sizes.length>4?\`<span class="text-xs text-gray-400">+\${sizes.length-4}</span>\`:''}</div>\` : ''}
        <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
        <div class="flex gap-2">
          <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
            <i class="fas fa-edit mr-1"></i>Sửa
          </button>
          <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${p.is_active ? 'Ẩn' : 'Hiện'}">
            <i class="fas fa-\${p.is_active ? 'eye-slash' : 'eye'} text-gray-500"></i>
          </button>
          <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
}

async function toggleProductActive(id) {
  try {
    await axios.patch('/api/admin/products/' + id + '/toggle')
    loadAdminProducts()
    showAdminToast('Đã cập nhật trạng thái', 'success')
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('Đã xoá sản phẩm', 'success')
  } catch(e) { showAdminToast('Lỗi xoá sản phẩm', 'error') }
}

// ── PRODUCT MODAL ─────────────────────────────────
async function openProductModal(id = null) {
  editingId = id
  colors = []
  sizes = []
  galleryImages = ['','','','','','','','','']
  
  resetProductForm()
  document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'
  
  // Bind gallery slots
  for (let i = 0; i < 9; i++) {
    const slot = document.getElementById('slot-'+i)
    slot.onclick = () => handleGallerySlotClick(i)
  }
  
  if (id) {
    try {
      const res = await axios.get('/api/products/'+id)
      const p = res.data.data
      document.getElementById('productId').value = p.id
      document.getElementById('pName').value = p.name
      document.getElementById('pPrice').value = p.price
      document.getElementById('pOriginalPrice').value = p.original_price || ''
      document.getElementById('pCategory').value = p.category
      document.getElementById('pBrand').value = p.brand || ''
      document.getElementById('pMaterial').value = p.material || ''
      document.getElementById('pDescription').value = p.description || ''
      document.getElementById('pStock').value = p.stock || 0
      document.getElementById('pFeatured').checked = !!p.is_featured
      document.getElementById('pActive').checked = !!p.is_active
      
      // Thumbnail
      previewThumbnail(p.thumbnail || '')
      document.getElementById('pThumbnail').value = p.thumbnail || ''
      
      // Gallery
      const imgs = safeJson(p.images)
      imgs.forEach((url, i) => { if (i < 9 && url) setGallerySlot(i, url) })
      
      // Colors & sizes
      colors = safeJson(p.colors)
      sizes = safeJson(p.sizes)
      renderTags('color')
      renderTags('size')
    } catch(e) { showAdminToast('Lỗi tải sản phẩm', 'error'); return }
  }
  
  document.getElementById('productModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
  document.body.style.overflow = ''
  editingId = null
}

function resetProductForm() {
  document.getElementById('productForm').reset()
  document.getElementById('productId').value = ''
  document.getElementById('pActive').checked = true
  previewThumbnail('')
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  colors = []; sizes = []
  renderTags('color'); renderTags('size')
  galleryImages = ['','','','','','','','','']
}

async function saveProduct(e) {
  e.preventDefault()
  const btn = document.getElementById('saveBtn')
  btn.textContent = 'Đang lưu...'
  
  const imgList = galleryImages.filter(v => v && v.trim())
  
  const data = {
    name: document.getElementById('pName').value,
    price: document.getElementById('pPrice').value,
    original_price: document.getElementById('pOriginalPrice').value || null,
    category: document.getElementById('pCategory').value,
    brand: document.getElementById('pBrand').value,
    material: document.getElementById('pMaterial').value,
    description: document.getElementById('pDescription').value,
    thumbnail: document.getElementById('pThumbnail').value,
    images: imgList,
    colors: colors,
    sizes: sizes,
    stock: document.getElementById('pStock').value || 0,
    is_featured: document.getElementById('pFeatured').checked,
    is_active: document.getElementById('pActive').checked
  }
  
  try {
    if (editingId) {
      await axios.put('/api/admin/products/' + editingId, data)
      showAdminToast('Cập nhật sản phẩm thành công!', 'success')
    } else {
      await axios.post('/api/admin/products', data)
      showAdminToast('Thêm sản phẩm thành công!', 'success')
    }
    closeProductModal()
    loadAdminProducts()
  } catch(e) {
    showAdminToast('Lỗi lưu sản phẩm', 'error')
  } finally {
    btn.textContent = 'Lưu sản phẩm'
  }
}

// ── GALLERY ───────────────────────────────────────
function handleGallerySlotClick(i) {
  const hasImg = galleryImages[i]
  if (!hasImg) {
    document.getElementById('galleryFile-'+i).click()
  }
}

function setGallerySlot(i, url) {
  galleryImages[i] = url
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = url
  img.classList.remove('hidden')
  placeholder.classList.add('hidden')
  delBtn.classList.remove('hidden')
  delBtn.classList.add('flex')
  slot.classList.add('has-img')
}

function clearGallerySlot(i) {
  galleryImages[i] = ''
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = ''; img.classList.add('hidden')
  placeholder.classList.remove('hidden')
  delBtn.classList.add('hidden'); delBtn.classList.remove('flex')
  slot.classList.remove('has-img')
}

function removeGalleryImg(i) {
  event.stopPropagation()
  clearGallerySlot(i)
}

function handleGalleryFile(i, input) {
  const file = input.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => setGallerySlot(i, e.target.result)
  reader.readAsDataURL(file)
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim()
  if (!url) return
  const emptySlot = galleryImages.findIndex(v => !v)
  if (emptySlot === -1) { showAdminToast('Đã đầy 9 ảnh', 'error'); return }
  setGallerySlot(emptySlot, url)
  document.getElementById('galleryUrlInput').value = ''
}

function previewThumbnail(url) {
  const img = document.getElementById('thumbnailPreview')
  const placeholder = document.getElementById('thumbnailPlaceholder')
  const box = document.getElementById('thumbnailPreviewBox')
  if (url) {
    img.src = url; img.classList.remove('hidden'); placeholder.classList.add('hidden')
    box.classList.add('has-img')
  } else {
    img.src = ''; img.classList.add('hidden'); placeholder.classList.remove('hidden')
    box.classList.remove('has-img')
  }
}

function handleThumbnailFile(input) {
  const file = input.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    document.getElementById('pThumbnail').value = e.target.result
    previewThumbnail(e.target.result)
  }
  reader.readAsDataURL(file)
}

// ── TAGS (Colors/Sizes) ────────────────────────────
function addTag(type) {
  const input = document.getElementById(type === 'color' ? 'colorInput' : 'sizeInput')
  const val = input.value.trim()
  if (!val) return
  const arr = type === 'color' ? colors : sizes
  val.split(',').map(v => v.trim()).filter(v => v && !arr.includes(v)).forEach(v => arr.push(v))
  renderTags(type)
  input.value = ''
}

function removeTag(type, val) {
  if (type === 'color') colors = colors.filter(c => c !== val)
  else sizes = sizes.filter(s => s !== val)
  renderTags(type)
}

function renderTags(type) {
  const arr = type === 'color' ? colors : sizes
  const container = document.getElementById(type === 'color' ? 'colorTags' : 'sizeTags')
  container.innerHTML = arr.map(v => \`
    <span class="tag-item">\${v}<span class="tag-del" onclick="removeTag('\${type}','\${v}')">×</span></span>
  \`).join('')
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
}

// ── ORDERS ────────────────────────────────────────
async function loadAdminOrders() {
  document.getElementById('ordersTable').innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>'
  try {
    const status = document.getElementById('orderStatusFilter').value
    const res = await axios.get('/api/admin/orders' + (status !== 'all' ? '?status='+status : ''))
    adminOrders = res.data.data || []
    filterOrders()
  } catch(e) { document.getElementById('ordersTable').innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400">Lỗi tải dữ liệu</td></tr>' }
}

function filterOrders() {
  const q = document.getElementById('orderSearch').value.toLowerCase()
  const filtered = q ? adminOrders.filter(o =>
    o.customer_name.toLowerCase().includes(q) ||
    o.customer_phone.includes(q) ||
    o.order_code.toLowerCase().includes(q) ||
    o.product_name.toLowerCase().includes(q)
  ) : adminOrders
  
  renderOrdersTable(filtered)
  const total = filtered.reduce((s,o) => s + o.total_price, 0)
  document.getElementById('orderStats').textContent = \`\${filtered.length} đơn – Tổng: \${fmtPrice(total)}\`
}

function renderOrdersTable(orders) {
  const empty = document.getElementById('ordersEmpty')
  if (!orders.length) {
    document.getElementById('ordersTable').innerHTML = ''
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')
  
  document.getElementById('ordersTable').innerHTML = orders.map(o => \`
  <tr class="table-row border-b cursor-pointer">
    <td class="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">\${o.order_code}</td>
    <td class="px-4 py-3">
      <p class="font-medium text-gray-800 text-sm">\${o.customer_name}</p>
      <p class="text-gray-500 text-xs">\${o.customer_phone}</p>
    </td>
    <td class="px-4 py-3 hidden md:table-cell">
      <p class="text-sm text-gray-700 max-w-xs truncate">\${o.product_name}</p>
    </td>
    <td class="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
      \${o.color ? '<span class="bg-pink-50 text-pink-600 px-2 py-0.5 rounded text-xs mr-1">'+o.color+'</span>' : ''}
      \${o.size ? '<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">'+o.size+'</span>' : '—'}
    </td>
    <td class="px-4 py-3 text-center text-sm font-semibold hidden sm:table-cell">\${o.quantity}</td>
    <td class="px-4 py-3 text-right">
      <p class="font-bold text-gray-800">\${fmtPrice(o.total_price)}</p>
      \${o.discount_amount > 0 ? \`<p class="text-xs text-green-600">-\${fmtPrice(o.discount_amount)}</p>\` : ''}
    </td>
    <td class="px-4 py-3 text-center hidden lg:table-cell">
      \${o.voucher_code ? \`<span class="font-mono text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg font-semibold">\${o.voucher_code}</span>\` : '<span class="text-gray-300 text-xs">—</span>'}
    </td>
    <td class="px-4 py-3 text-center">
      <select onchange="updateOrderStatus(\${o.id}, this.value)" class="text-xs border rounded-lg px-2 py-1 focus:outline-none badge badge-\${o.status}" style="max-width:120px">
        <option value="pending" \${o.status==='pending'?'selected':''}>Chờ xử lý</option>
        <option value="confirmed" \${o.status==='confirmed'?'selected':''}>Xác nhận</option>
        <option value="shipping" \${o.status==='shipping'?'selected':''}>Đang giao</option>
        <option value="done" \${o.status==='done'?'selected':''}>Hoàn thành</option>
        <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Huỷ</option>
      </select>
    </td>
    <td class="px-4 py-3 text-center">
      <div class="flex justify-center gap-1">
        <button onclick="showOrderDetail(\${o.id})" class="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Chi tiết">
          <i class="fas fa-eye text-xs"></i>
        </button>
        <button onclick="deleteOrder(\${o.id})" class="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition" title="Xoá">
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    </td>
  </tr>\`).join('')
}

async function updateOrderStatus(id, status) {
  try {
    await axios.patch('/api/admin/orders/'+id+'/status', { status })
    showAdminToast('Cập nhật trạng thái thành công', 'success')
    await loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteOrder(id) {
  if (!confirm('Xoá đơn hàng này?')) return
  try {
    await axios.delete('/api/admin/orders/'+id)
    showAdminToast('Đã xoá đơn hàng', 'success')
    loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function showOrderDetail(id) {
  const o = adminOrders.find(x => x.id === id)
  if (!o) return
  document.getElementById('orderDetailContent').innerHTML = \`
  <div class="space-y-3 pb-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Mã đơn hàng</p>
        <p class="font-bold text-blue-600">\${o.order_code}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Trạng thái</p>
        <span class="badge badge-\${o.status}">\${statusLabel(o.status)}</span>
      </div>
    </div>
    <div class="bg-pink-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Khách hàng</p>
      <p class="font-semibold">\${o.customer_name}</p>
      <p class="text-sm text-gray-600">\${o.customer_phone}</p>
      <p class="text-sm text-gray-600">\${o.customer_address}</p>
    </div>
    <div class="bg-gray-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Sản phẩm</p>
      <p class="font-semibold">\${o.product_name}</p>
      <div class="flex gap-2 mt-1 flex-wrap">
        \${o.color ? \`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200">Màu: \${o.color}</span>\` : ''}
        \${o.size ? \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">Size: \${o.size}</span>\` : ''}
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">SL: \${o.quantity}</span>
      </div>
    </div>
    \${o.voucher_code ? \`
    <div class="bg-green-50 rounded-xl p-3 flex justify-between items-center">
      <div>
        <p class="text-xs text-gray-500">Voucher áp dụng</p>
        <p class="font-mono font-bold text-green-700 text-sm">\${o.voucher_code}</p>
      </div>
      <span class="font-bold text-green-600">-\${fmtPrice(o.discount_amount)}</span>
    </div>\` : ''}
    <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-3 space-y-1">
      \${o.discount_amount > 0 ? \`
      <div class="flex justify-between text-sm">
        <span class="text-gray-500">Tạm tính:</span>
        <span class="text-gray-700">\${fmtPrice(o.product_price * o.quantity)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-green-600">Giảm giá:</span>
        <span class="text-green-600 font-semibold">-\${fmtPrice(o.discount_amount)}</span>
      </div>\` : ''}
      <div class="flex justify-between items-center">
        <span class="font-semibold text-gray-700">Tổng tiền:</span>
        <span class="text-xl font-bold text-pink-600">\${fmtPrice(o.total_price)}</span>
      </div>
    </div>
    \${o.note ? \`<div class="bg-yellow-50 rounded-xl p-3"><p class="text-xs text-gray-500">Ghi chú</p><p class="text-sm">\${o.note}</p></div>\` : ''}
    <p class="text-xs text-gray-400 text-right">Đặt lúc: \${new Date(o.created_at).toLocaleString('vi-VN')}</p>
  </div>\`
  document.getElementById('orderDetailModal').classList.remove('hidden')
}

// ── EXCEL EXPORT ──────────────────────────────────
function exportExcel() {
  if (!adminOrders.length) { showAdminToast('Không có dữ liệu để xuất', 'error'); return }

  const data = adminOrders.map((o, i) => ({
    'STT': i + 1,
    'Mã đơn hàng': o.order_code,
    'Họ và tên': o.customer_name,
    'Số điện thoại': o.customer_phone,
    'Địa chỉ': o.customer_address,
    'Sản phẩm': o.product_name,
    'Đơn giá': o.product_price,
    'Màu sắc': o.color || '',
    'Size': o.size || '',
    'Số lượng': o.quantity,
    'Voucher': o.voucher_code || '',
    'Giảm giá': o.discount_amount || 0,
    'Tổng tiền': o.total_price,
    'Ghi chú': o.note || '',
    'Trạng thái': statusLabel(o.status),
    'Ngày đặt': new Date(o.created_at).toLocaleString('vi-VN')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    {wch:5},{wch:15},{wch:20},{wch:14},{wch:35},{wch:30},
    {wch:12},{wch:12},{wch:8},{wch:8},{wch:14},{wch:12},{wch:12},{wch:20},{wch:12},{wch:18}
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng')
  XLSX.writeFile(wb, 'DonHang_FashionVN_' + new Date().toISOString().split('T')[0] + '.xlsx')
  showAdminToast('Xuất Excel thành công!', 'success')
}

// ── VOUCHERS ──────────────────────────────────────
async function loadVouchers() {
  const list = document.getElementById('voucherList')
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>Chưa có voucher nào</p></div>'
      return
    }
    list.innerHTML = vouchers.map(v => {
      const now = new Date()
      const from = new Date(v.valid_from)
      const to = new Date(v.valid_to)
      const expired = to < now
      const notStarted = from > now
      const isValid = !expired && !notStarted && v.is_active
      return \`
      <div class="border rounded-2xl p-4 \${!v.is_active ? 'opacity-50 bg-gray-50' : isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold text-lg tracking-widest \${isValid ? 'text-green-700' : 'text-gray-500'}">\${v.code}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium \${isValid ? 'bg-green-100 text-green-700' : expired ? 'bg-gray-100 text-gray-500' : notStarted ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}">
              \${isValid ? '✅ Hiệu lực' : expired ? '⏰ Hết hạn' : notStarted ? '🕐 Chưa bắt đầu' : '🚫 Tắt'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xoá">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} → \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div class="flex gap-3 mt-1.5 text-xs text-gray-500">
          <span><i class="fas fa-users mr-1 text-gray-400"></i>Đã dùng: <strong>\${v.used_count}</strong>\${v.usage_limit > 0 ? '/'+v.usage_limit : ' (không giới hạn)'}</span>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>'
  }
}

async function createVoucher(e) {
  e.preventDefault()
  const btn = document.getElementById('createVoucherBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo...'
  try {
    const res = await axios.post('/api/admin/vouchers', {
      discount_amount: document.getElementById('vDiscount').value,
      valid_from: new Date(document.getElementById('vFrom').value).toISOString(),
      valid_to: new Date(document.getElementById('vTo').value).toISOString(),
      usage_limit: document.getElementById('vLimit').value || 0,
      custom_code: document.getElementById('vCode').value || ''
    })
    const code = res.data.code
    document.getElementById('generatedCode').classList.remove('hidden')
    document.getElementById('generatedCodeText').textContent = code
    showAdminToast('Tạo voucher ' + code + ' thành công!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lỗi tạo voucher: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('Đã cập nhật trạng thái voucher', 'success')
  } catch(e) { showAdminToast('Lỗi', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('Xoá voucher này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xoá voucher', 'success')
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('Đã sao chép: ' + code, 'success'))
}

// ── UTILS ─────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function catLabel(c) { return {unisex:'Unisex',male:'Nam',female:'Nữ'}[c]||c }
function statusLabel(s) { return {pending:'Chờ xử lý',confirmed:'Xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'}[s]||s }

function showAdminToast(msg, type='success') {
  const c = document.getElementById('adminToast')
  const t = document.createElement('div')
  t.className = \`toast-admin flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':type==='warning'?'bg-amber-500':'bg-green-500'}\`
  t.innerHTML = \`<i class="fas fa-\${type==='error'?'exclamation-circle':type==='warning'?'exclamation-triangle':'check-circle'}"></i>\${msg}\`
  c.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

// Init
loadDashboard()
<\/script>
</body>
</html>`
}

export default app
