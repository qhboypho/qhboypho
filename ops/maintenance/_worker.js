// Temporary release artifact only. No DB, provider, asset or auth operations.
// Deploy with the dedicated ops/maintenance-site configuration, never Vite.
export default {
  async fetch(request) {
    const api = new URL(request.url).pathname.startsWith('/api/')
    const body = api
      ? JSON.stringify({ success: false, error: 'RELEASE_MAINTENANCE', retry_after: 300 })
      : '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QH Clothes — Bảo trì</title><main><h1>QH Clothes đang cập nhật hệ thống</h1><p>Shop tạm ngưng nhận đơn trong ít phút. Vui lòng quay lại sau.</p><p>Nếu đã chuyển khoản, đừng thanh toán lại. Shop sẽ đối soát giao dịch của bạn.</p></main></html>'
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 503,
      headers: {
        'Content-Type': api ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
        'Cache-Control': 'no-store', 'Retry-After': '300',
        'X-QH-Maintenance': 'release', 'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff'
      }
    })
  }
}
