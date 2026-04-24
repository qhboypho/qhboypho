import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getUserSessionUserId } from '../lib/userSessionHelpers'

const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 500_000 // 500KB per image as base64
const MAX_COMMENT_LENGTH = 1000

export function registerReviewRoutes(app: Hono<{ Bindings: AppBindings }>, deps: {
    initDB: (db: D1Database) => Promise<void>
}) {

    // GET /api/reviews?productId=X  — Public: list reviews for a product
    app.get('/api/reviews', async (c) => {
        try {
            await deps.initDB(c.env.DB)
            const productId = parseInt(c.req.query('productId') || '0', 10)
            if (!productId) return c.json({ success: false, error: 'MISSING_PRODUCT_ID' }, 400)

            const rows = await c.env.DB.prepare(`
        SELECT r.id, r.rating, r.comment, r.images, r.created_at,
               u.name as user_name, u.avatar as user_avatar
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50
      `).bind(productId).all()

            const reviews = (rows.results || []).map((r: any) => ({
                ...r,
                images: (() => { try { return JSON.parse(r.images || '[]') } catch { return [] } })()
            }))

            const avgRating = reviews.length
                ? Math.round((reviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviews.length) * 10) / 10
                : 0

            return c.json({ success: true, data: reviews, avgRating, total: reviews.length })
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500)
        }
    })

    // GET /api/reviews/my-reviewable-orders?productId=X
    // Returns order IDs the logged-in user can review for a product (status=done, not yet reviewed)
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

    // POST /api/reviews — Submit a review (auth required + must have purchased)
    app.post('/api/reviews', async (c) => {
        const userId = await getUserSessionUserId(c)
        if (!userId) return c.json({ success: false, error: 'UNAUTHORIZED' }, 401)

        let body: any = {}
        try { body = await c.req.json() } catch { return c.json({ success: false, error: 'INVALID_BODY' }, 400) }

        const productId = parseInt(body.product_id || 0, 10)
        const orderId = parseInt(body.order_id || 0, 10)
        const rating = parseInt(body.rating || 5, 10)
        const comment = String(body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH)
        const images: string[] = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : []

        // Validate fields
        if (!productId) return c.json({ success: false, error: 'MISSING_PRODUCT_ID' }, 400)
        if (!orderId) return c.json({ success: false, error: 'MISSING_ORDER_ID' }, 400)
        if (rating < 1 || rating > 5) return c.json({ success: false, error: 'INVALID_RATING' }, 400)

        // Validate images (must be base64 data URLs or empty http URLs from storage)
        for (const img of images) {
            if (!img) continue
            if (img.startsWith('data:image/')) {
                if (img.length > MAX_IMAGE_BYTES * 1.4) { // base64 is ~4/3 of raw
                    return c.json({ success: false, error: 'IMAGE_TOO_LARGE' }, 400)
                }
                if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(img)) {
                    return c.json({ success: false, error: 'INVALID_IMAGE_FORMAT' }, 400)
                }
            }
        }

        try {
            await deps.initDB(c.env.DB)

            // Security: verify the order belongs to this user, is for this product, status=done
            const order = await c.env.DB.prepare(`
        SELECT id FROM orders
        WHERE id = ? AND user_id = ? AND product_id = ? AND status = 'done'
      `).bind(orderId, Number(userId), productId).first() as any

            if (!order) {
                return c.json({ success: false, error: 'ORDER_NOT_ELIGIBLE' }, 403)
            }

            // Prevent duplicate review for same order
            const existing = await c.env.DB.prepare(
                'SELECT id FROM reviews WHERE user_id = ? AND order_id = ?'
            ).bind(Number(userId), orderId).first()

            if (existing) {
                return c.json({ success: false, error: 'ALREADY_REVIEWED' }, 409)
            }

            const imagesJson = JSON.stringify(images.filter(Boolean))
            const result = await c.env.DB.prepare(`
        INSERT INTO reviews (product_id, user_id, order_id, rating, comment, images)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(productId, Number(userId), orderId, rating, comment, imagesJson).run()

            const reviewId = result.meta.last_row_id

            // Fetch the created review with user info to return
            const created = await c.env.DB.prepare(`
        SELECT r.id, r.rating, r.comment, r.images, r.created_at,
               u.name as user_name, u.avatar as user_avatar
        FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.id = ?
      `).bind(reviewId).first() as any

            return c.json({
                success: true,
                data: {
                    ...created,
                    images: (() => { try { return JSON.parse(created?.images || '[]') } catch { return [] } })()
                }
            })
        } catch (e: any) {
            if (String(e.message).includes('UNIQUE')) {
                return c.json({ success: false, error: 'ALREADY_REVIEWED' }, 409)
            }
            return c.json({ success: false, error: e.message }, 500)
        }
    })
}
