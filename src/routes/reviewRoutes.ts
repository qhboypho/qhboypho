import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getUserSessionUserId } from '../lib/userSessionHelpers'

const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 500_000
const MAX_COMMENT_LENGTH = 1000
const MAX_REVIEWER_NAME_LENGTH = 120

function parseReviewImages(raw: unknown) {
  try {
    const parsed = JSON.parse(String(raw || '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function sanitizeReviewImages(images: unknown) {
  return Array.isArray(images)
    ? images.slice(0, MAX_IMAGES).map((value) => String(value || '').trim()).filter(Boolean)
    : []
}

function validateReviewContent(rating: number, images: string[]) {
  if (rating < 1 || rating > 5) return 'INVALID_RATING'
  for (const img of images) {
    if (!img) continue
    if (img.startsWith('data:image/')) {
      if (img.length > MAX_IMAGE_BYTES * 1.4) return 'IMAGE_TOO_LARGE'
      if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(img)) return 'INVALID_IMAGE_FORMAT'
    }
  }
  return ''
}

function sanitizeReviewerName(value: unknown) {
  return String(value || '').trim().slice(0, MAX_REVIEWER_NAME_LENGTH)
}

async function getReviewRow(db: D1Database, reviewId: number) {
  return db.prepare(`
    SELECT r.id, r.product_id, r.user_id, r.order_id, r.reviewer_name, r.reviewer_avatar, r.created_by_admin,
           r.rating, r.comment, r.images, r.created_at,
           p.name AS product_name, p.thumbnail AS product_thumbnail,
           o.order_code,
           COALESCE(NULLIF(r.reviewer_name, ''), u.name, 'Khách hàng') AS user_name,
           COALESCE(NULLIF(r.reviewer_avatar, ''), u.avatar, '') AS user_avatar
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    LEFT JOIN orders o ON o.id = r.order_id
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id = ?
  `).bind(reviewId).first() as Promise<any>
}

export function registerReviewRoutes(app: Hono<{ Bindings: AppBindings }>, deps: {
  initDB: (db: D1Database) => Promise<void>
}) {
  app.get('/api/reviews', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const productId = parseInt(c.req.query('productId') || '0', 10)
      if (!productId) return c.json({ success: false, error: 'MISSING_PRODUCT_ID' }, 400)

      const aggregate = await c.env.DB.prepare(`
        SELECT COUNT(*) as total_reviews, ROUND(AVG(rating), 1) as avg_rating
        FROM reviews
        WHERE product_id = ?
      `).bind(productId).first() as any

      const rows = await c.env.DB.prepare(`
        SELECT r.id, r.rating, r.comment, r.images, r.created_at,
               COALESCE(NULLIF(r.reviewer_name, ''), u.name, 'Khách hàng') AS user_name,
               COALESCE(NULLIF(r.reviewer_avatar, ''), u.avatar, '') AS user_avatar
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50
      `).bind(productId).all()

      const reviews = (rows.results || []).map((row: any) => ({
        ...row,
        images: parseReviewImages(row.images),
      }))

      return c.json({
        success: true,
        data: reviews,
        avgRating: Number(aggregate?.avg_rating || 0),
        total: Number(aggregate?.total_reviews || 0),
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/reviews/my-reviewable-orders', async (c) => {
    const userId = await getUserSessionUserId(c)
    if (!userId) return c.json({ success: false, error: 'UNAUTHORIZED' }, 401)

    const productId = parseInt(c.req.query('productId') || '0', 10)
    if (!productId) return c.json({ success: false, error: 'MISSING_PRODUCT_ID' }, 400)

    try {
      await deps.initDB(c.env.DB)
      const rows = await c.env.DB.prepare(`
        SELECT o.id as order_id, o.order_code
        FROM orders o
        LEFT JOIN reviews rv ON rv.order_id = o.id
        WHERE o.user_id = ?
          AND o.product_id = ?
          AND o.status = 'done'
          AND rv.id IS NULL
        ORDER BY o.created_at DESC
        LIMIT 5
      `).bind(Number(userId), productId).all()

      return c.json({ success: true, data: rows.results || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/reviews', async (c) => {
    return c.json({ success: false, error: 'ADMIN_ONLY' }, 403)
  })

  app.get('/api/admin/reviews', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const query = String(c.req.query('query') || '').trim().toLowerCase()
      const productId = parseInt(c.req.query('product_id') || '0', 10)
      const rating = parseInt(c.req.query('rating') || '0', 10)
      const hasImages = c.req.query('has_images') === '1'

      const rows = await c.env.DB.prepare(`
        SELECT r.id, r.product_id, r.user_id, r.order_id, r.reviewer_name, r.reviewer_avatar, r.created_by_admin,
               r.rating, r.comment, r.images, r.created_at,
               p.name AS product_name, p.thumbnail AS product_thumbnail,
               o.order_code,
               COALESCE(NULLIF(r.reviewer_name, ''), u.name, 'Khách hàng') AS user_name,
               COALESCE(NULLIF(r.reviewer_avatar, ''), u.avatar, '') AS user_avatar
        FROM reviews r
        JOIN products p ON p.id = r.product_id
        LEFT JOIN orders o ON o.id = r.order_id
        LEFT JOIN users u ON u.id = r.user_id
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT 500
      `).all()

      let reviews = (rows.results || []).map((row: any) => ({
        ...row,
        images: parseReviewImages(row.images),
      }))

      if (productId) reviews = reviews.filter((row: any) => Number(row.product_id) === productId)
      if (rating) reviews = reviews.filter((row: any) => Number(row.rating) === rating)
      if (hasImages) reviews = reviews.filter((row: any) => Array.isArray(row.images) && row.images.length > 0)
      if (query) {
        reviews = reviews.filter((row: any) => {
          const haystack = [
            row.product_name,
            row.user_name,
            row.comment,
            row.order_code,
          ].map((value) => String(value || '').toLowerCase())
          return haystack.some((value) => value.includes(query))
        })
      }

      return c.json({ success: true, data: reviews })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/reviews', async (c) => {
    let body: any = {}
    try { body = await c.req.json() } catch { return c.json({ success: false, error: 'INVALID_BODY' }, 400) }

    const productId = parseInt(body.product_id || 0, 10)
    const orderId = parseInt(body.order_id || 0, 10)
    const rating = parseInt(body.rating || 5, 10)
    const comment = String(body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH)
    const reviewerName = sanitizeReviewerName(body.reviewer_name)
    const reviewerAvatar = String(body.reviewer_avatar || '').trim()
    const images = sanitizeReviewImages(body.images)
    const validationError = productId ? validateReviewContent(rating, images) : 'MISSING_PRODUCT_ID'
    if (validationError) return c.json({ success: false, error: validationError }, 400)

    try {
      await deps.initDB(c.env.DB)

      const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ? LIMIT 1').bind(productId).first()
      if (!product) return c.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, 404)

      let userId: number | null = null
      let resolvedReviewerName = reviewerName

      if (orderId) {
        const order = await c.env.DB.prepare(`
          SELECT o.id, o.user_id, o.product_id, o.status, o.customer_name
          FROM orders o
          WHERE o.id = ?
        `).bind(orderId).first() as any

        if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
        if (String(order.status || '').toLowerCase() !== 'done') return c.json({ success: false, error: 'ORDER_NOT_ELIGIBLE' }, 403)
        if (Number(order.product_id) !== productId) return c.json({ success: false, error: 'ORDER_PRODUCT_MISMATCH' }, 400)

        const existing = await c.env.DB.prepare('SELECT id FROM reviews WHERE order_id = ? LIMIT 1').bind(orderId).first()
        if (existing) return c.json({ success: false, error: 'ALREADY_REVIEWED' }, 409)

        userId = order.user_id ? Number(order.user_id) : null
        if (!resolvedReviewerName) resolvedReviewerName = sanitizeReviewerName(order.customer_name)
      }

      if (!resolvedReviewerName) {
        return c.json({ success: false, error: 'MISSING_REVIEWER_NAME' }, 400)
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO reviews (
          product_id, user_id, order_id, reviewer_name, reviewer_avatar, created_by_admin,
          rating, comment, images
        )
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).bind(
        productId,
        userId,
        orderId || null,
        resolvedReviewerName,
        reviewerAvatar,
        rating,
        comment,
        JSON.stringify(images),
      ).run()

      const created = await getReviewRow(c.env.DB, Number(result.meta.last_row_id || 0))
      return c.json({
        success: true,
        data: created ? { ...created, images: parseReviewImages(created.images) } : null,
      })
    } catch (e: any) {
      if (String(e.message || '').includes('UNIQUE')) {
        return c.json({ success: false, error: 'ALREADY_REVIEWED' }, 409)
      }
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.patch('/api/admin/reviews/:id', async (c) => {
    let body: any = {}
    try { body = await c.req.json() } catch { return c.json({ success: false, error: 'INVALID_BODY' }, 400) }

    const reviewId = parseInt(c.req.param('id') || '0', 10)
    const rating = parseInt(body.rating || 5, 10)
    const comment = String(body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH)
    const images = sanitizeReviewImages(body.images)
    const reviewerName = sanitizeReviewerName(body.reviewer_name)
    const reviewerAvatar = String(body.reviewer_avatar || '').trim()
    const requestedProductId = parseInt(body.product_id || 0, 10)
    if (!reviewId) return c.json({ success: false, error: 'MISSING_REVIEW_ID' }, 400)
    const validationError = validateReviewContent(rating, images)
    if (validationError) return c.json({ success: false, error: validationError }, 400)

    try {
      await deps.initDB(c.env.DB)

      const existing = await c.env.DB.prepare(`
        SELECT id, product_id, order_id, reviewer_name, reviewer_avatar
        FROM reviews
        WHERE id = ?
      `).bind(reviewId).first() as any
      if (!existing) return c.json({ success: false, error: 'REVIEW_NOT_FOUND' }, 404)

      let nextProductId = requestedProductId || Number(existing.product_id)
      if (existing.order_id) {
        const order = await c.env.DB.prepare('SELECT product_id, status FROM orders WHERE id = ?').bind(existing.order_id).first() as any
        if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
        if (String(order.status || '').toLowerCase() !== 'done') return c.json({ success: false, error: 'ORDER_NOT_ELIGIBLE' }, 403)
        nextProductId = Number(order.product_id)
      }

      const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ? LIMIT 1').bind(nextProductId).first()
      if (!product) return c.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, 404)

      await c.env.DB.prepare(`
        UPDATE reviews
        SET product_id = ?, reviewer_name = ?, reviewer_avatar = ?, rating = ?, comment = ?, images = ?
        WHERE id = ?
      `).bind(
        nextProductId,
        reviewerName || String(existing.reviewer_name || ''),
        reviewerAvatar || String(existing.reviewer_avatar || ''),
        rating,
        comment,
        JSON.stringify(images),
        reviewId,
      ).run()

      const updated = await getReviewRow(c.env.DB, reviewId)
      return c.json({
        success: true,
        data: updated ? { ...updated, images: parseReviewImages(updated.images) } : null,
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/reviews/:id', async (c) => {
    const reviewId = parseInt(c.req.param('id') || '0', 10)
    if (!reviewId) return c.json({ success: false, error: 'MISSING_REVIEW_ID' }, 400)

    try {
      await deps.initDB(c.env.DB)
      const existing = await c.env.DB.prepare('SELECT id FROM reviews WHERE id = ?').bind(reviewId).first()
      if (!existing) return c.json({ success: false, error: 'REVIEW_NOT_FOUND' }, 404)
      await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewId).run()
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
