type InitDbDeps = {
  resolveSelectedColorImage: (productColors: any, selectedColor: any, fallbackImage?: string) => string
}

export function createInitDB(deps: InitDbDeps) {
  return async function initDB(db: D1Database) {
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
        is_trending INTEGER DEFAULT 0,
        trending_order INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        user_id INTEGER,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_price REAL NOT NULL,
        color TEXT,
        selected_color_image TEXT DEFAULT '',
        size TEXT,
        quantity INTEGER DEFAULT 1,
        total_price REAL NOT NULL,
        voucher_code TEXT DEFAULT '',
        discount_amount REAL DEFAULT 0,
        note TEXT,
        payment_method TEXT DEFAULT 'COD',
        payment_status TEXT DEFAULT 'unpaid',
        payment_paid_at DATETIME,
        payment_ref TEXT,
        payment_provider TEXT,
        payment_link_id TEXT,
        payment_checkout_url TEXT,
        payment_order_code INTEGER,
        shipping_arranged INTEGER DEFAULT 0,
        shipping_arranged_at DATETIME,
        shipping_carrier TEXT DEFAULT '',
        shipping_tracking_code TEXT,
        shipping_label TEXT,
        shipping_fee REAL DEFAULT 0,
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
      `CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)`,
      `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, tid TEXT UNIQUE, amount REAL, description TEXT, user_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT, avatar TEXT, balance REAL DEFAULT 0, is_admin INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS hero_banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        subtitle TEXT,
        title TEXT,
        price TEXT,
        product_id INTEGER,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]
    for (const sql of statements) {
      try { await db.prepare(sql).run() } catch (_) { }
    }

    try { await db.prepare("ALTER TABLE hero_banners ADD COLUMN product_id INTEGER").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE products ADD COLUMN is_trending INTEGER DEFAULT 0").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE products ADD COLUMN trending_order INTEGER DEFAULT 0").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN selected_color_image TEXT DEFAULT ''").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD'").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid'").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_paid_at DATETIME").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_ref TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_provider TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_link_id TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_checkout_url TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_order_code INTEGER").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_arranged INTEGER DEFAULT 0").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_arranged_at DATETIME").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_carrier TEXT DEFAULT ''").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_tracking_code TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_label TEXT").run() } catch (_) { }
    try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_fee REAL DEFAULT 0").run() } catch (_) { }

    try {
      const backfillRows = await db.prepare(`
        SELECT o.id, o.color, o.selected_color_image, p.colors AS product_colors, p.thumbnail AS product_thumbnail
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE (o.selected_color_image IS NULL OR TRIM(o.selected_color_image) = '')
          AND TRIM(COALESCE(o.color, '')) <> ''
          AND p.id IS NOT NULL
        ORDER BY o.id ASC
        LIMIT 1000
      `).all()
      const rows = Array.isArray(backfillRows?.results) ? backfillRows.results as any[] : []
      for (const row of rows) {
        const resolved = deps.resolveSelectedColorImage(row.product_colors, row.color, row.product_thumbnail || '')
        if (!resolved) continue
        await db.prepare(`UPDATE orders SET selected_color_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
          .bind(resolved, row.id)
          .run()
      }
    } catch (err) {
      console.error('Failed to backfill order color images', err)
    }

    try {
      const bannerCountResult = await db.prepare("SELECT COUNT(*) as num_rows FROM hero_banners").all()
      let count = 1
      if (bannerCountResult && bannerCountResult.results && bannerCountResult.results.length > 0) {
        count = bannerCountResult.results[0].num_rows as number || 0
      }
      if (count === 0) {
        const initialBanners = [
          ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', 'Mới nhất', 'Bộ sưu tập Spring 2026', 'Từ 299.000đ', null, 1],
          ['https://images.unsplash.com/photo-1550614000-4b95d4edc457?w=500', 'Bán chạy', 'Phong Cách Đường Phố', 'Giảm 20%', null, 2],
          ['https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=500', 'Nam giới', 'Lịch lãm & Tinh tế', 'Từ 450.000đ', null, 3]
        ]
        for (const [img, sub, title, price, pid, order] of initialBanners) {
          await db.prepare("INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order) VALUES (?, ?, ?, ?, ?, ?)").bind(img, sub, title, price, pid, order).run()
        }
      }
    } catch (err) {
      console.error('Failed to seed banners on init', err)
    }
  }
}

