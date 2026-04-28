# Tính năng Quản lý hoàn trả

## Tổng quan
Đã thêm tính năng "Quản lý hoàn trả" vào admin dashboard để quản lý:
- **Đơn hoàn**: Đơn khách nhận nhưng hoàn hàng lại
- **Đơn huỷ**: Đơn khách không nhận hàng (bom hàng)

## Các thay đổi

### 1. Database Migration
**File**: `migrations/0007_add_return_status.sql`
- Thêm cột `return_status` vào bảng `orders`
- Giá trị: `NULL` (đơn bình thường), `'returned'` (đơn hoàn), `'cancelled'` (đơn huỷ)
- Tạo index cho cột `return_status` để tăng tốc query
- Tự động cập nhật các đơn đã huỷ có mã vận đơn

### 2. UI Components

#### Sidebar Menu
**File**: `src/pages/admin/sections.ts`
- Thêm menu item "Quản lý hoàn trả" với icon `fa-undo`
- Vị trí: Giữa "Đơn hàng" và "Voucher"

#### Returns Page
**File**: `src/pages/admin/sections.ts` - Function `adminReturnsPage()`
- **2 Tabs**:
  - Tab "Đơn hoàn": Hiển thị đơn có `return_status = 'returned'`
  - Tab "Đơn huỷ": Hiển thị đơn có `return_status = 'cancelled'`
- **Tính năng**:
  - Tìm kiếm theo tên/SĐT/mã đơn
  - Nút "Đồng bộ từ GHTK" để cập nhật trạng thái từ GHTK API
  - Bảng hiển thị: Mã đơn, Khách hàng, Sản phẩm, SL, Tổng tiền, Mã vận đơn, Ngày tạo
  - Responsive: Desktop (table) và Mobile (card list)

### 3. Client-side Logic

#### Script File
**File**: `src/pages/admin/script-returns.ts`
- `switchReturnsTab()`: Chuyển đổi giữa 2 tabs
- `loadReturns()`: Load dữ liệu từ API
- `filterReturns()`: Lọc theo tab và search
- `renderReturnsTable()`: Render bảng desktop và mobile
- `syncReturnsFromGHTK()`: Đồng bộ trạng thái từ GHTK
- `viewReturnDetail()`: Xem chi tiết đơn hàng

#### Integration
**File**: `src/pages/admin/script.ts`
- Cập nhật `showPage()` để thêm page `'returns'`
- Thêm title "Quản lý hoàn trả"
- Gọi `loadReturns()` khi vào trang

**File**: `src/pages/adminPage.ts`
- Import `adminReturnsScript` và `adminReturnsPage`
- Thêm vào HTML template

### 4. API Routes

#### Returns Routes
**File**: `src/routes/returnsRoutes.ts`

##### GET `/api/admin/returns`
- Lấy tất cả đơn hoàn và đơn huỷ
- Filter: `return_status IN ('returned', 'cancelled')`
- Sắp xếp: Mới nhất trước

##### POST `/api/admin/returns/sync-ghtk`
- Đồng bộ trạng thái từ GHTK API
- Lấy tất cả đơn có `shipping_tracking_code` và `shipping_carrier = 'GHTK'`
- Gọi GHTK API: `GET /services/shipment/v2/{tracking_code}`
- Map GHTK status:
  - Status 9 hoặc text chứa "hủy/huy" → `return_status = 'cancelled'`
  - Status 10 hoặc text chứa "hoàn/hoan" → `return_status = 'returned'`
- Trả về: Số đơn đã sync, danh sách đơn đã cập nhật

##### PATCH `/api/admin/returns/:id/status`
- Cập nhật `return_status` thủ công
- Giá trị cho phép: `'returned'`, `'cancelled'`, `null`

#### Registration
**File**: `src/index.tsx`
- Import `registerReturnsRoutes`
- Đăng ký routes với dependencies

### 5. GHTK Integration

#### Status Mapping
GHTK API trả về status_id và status text:
- **Status 9**: Đã huỷ → `return_status = 'cancelled'`
- **Status 10**: Đã hoàn → `return_status = 'returned'`
- Text matching: Tìm từ khoá "hủy", "huy", "hoàn", "hoan"

#### API Endpoint
```
GET https://services.giaohangtietkiem.vn/services/shipment/v2/{tracking_code}
Headers:
  - Token: {GHTK_TOKEN}
  - X-Client-Source: {GHTK_CLIENT_SOURCE}
```

## Cách sử dụng

### 1. Xem đơn hoàn trả
1. Vào Admin Dashboard
2. Click menu "Quản lý hoàn trả"
3. Chọn tab "Đơn hoàn" hoặc "Đơn huỷ"
4. Sử dụng ô tìm kiếm để lọc đơn

### 2. Đồng bộ từ GHTK
1. Click nút "Đồng bộ từ GHTK"
2. Hệ thống sẽ:
   - Lấy tất cả đơn có mã vận đơn GHTK
   - Gọi API GHTK để kiểm tra trạng thái
   - Tự động cập nhật `return_status` nếu phát hiện đơn hoàn/huỷ
3. Hiển thị thông báo số đơn đã đồng bộ

### 3. Xem chi tiết đơn
- Click icon "eye" ở cột "Hành động"
- Mở modal chi tiết đơn hàng (sử dụng modal có sẵn)

## Cấu trúc dữ liệu

### Bảng orders
```sql
return_status TEXT DEFAULT NULL
  -- NULL: Đơn bình thường
  -- 'returned': Đơn hoàn (khách nhận nhưng hoàn lại)
  -- 'cancelled': Đơn huỷ (khách không nhận - bom hàng)
```

### API Response
```typescript
{
  success: boolean
  data: Array<{
    id: number
    order_code: string
    customer_name: string
    customer_phone: string
    customer_address: string
    product_name: string
    quantity: number
    total_price: number
    shipping_tracking_code: string
    return_status: 'returned' | 'cancelled' | null
    created_at: string
    // ... other order fields
  }>
}
```

## Testing

### 1. Kiểm tra UI
```bash
npm run dev
```
- Vào http://localhost:5173/admin
- Click menu "Quản lý hoàn trả"
- Kiểm tra 2 tabs hoạt động
- Test tìm kiếm

### 2. Kiểm tra API
```bash
# Get returns
curl http://localhost:5173/api/admin/returns \
  -H "Cookie: admin_token=YOUR_TOKEN"

# Sync from GHTK
curl -X POST http://localhost:5173/api/admin/returns/sync-ghtk \
  -H "Cookie: admin_token=YOUR_TOKEN"

# Update status manually
curl -X PATCH http://localhost:5173/api/admin/returns/123/status \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"return_status": "returned"}'
```

### 3. Kiểm tra Migration
```bash
npm run db:migrate:local
```

## Environment Variables

Cần có các biến môi trường GHTK trong `.dev.vars`:
```
GHTK_TOKEN=your_ghtk_token
GHTK_CLIENT_SOURCE=your_client_source
```

## Files Changed/Created

### Created
- `migrations/0007_add_return_status.sql`
- `src/routes/returnsRoutes.ts`
- `src/pages/admin/script-returns.ts`
- `RETURNS_FEATURE.md`

### Modified
- `src/pages/admin/sections.ts`
  - Added `adminReturnsPage()` function
  - Updated sidebar menu
- `src/pages/admin/script.ts`
  - Updated `showPage()` function
- `src/pages/adminPage.ts`
  - Imported and integrated returns components
- `src/index.tsx`
  - Registered returns routes

## Future Enhancements

1. **Thống kê**: Thêm dashboard widget hiển thị số đơn hoàn/huỷ
2. **Lý do hoàn trả**: Thêm trường ghi chú lý do khách hoàn/huỷ
3. **Tự động đồng bộ**: Chạy cron job định kỳ đồng bộ từ GHTK
4. **Export**: Xuất Excel danh sách đơn hoàn/huỷ
5. **Thông báo**: Gửi thông báo khi có đơn hoàn/huỷ mới
6. **Phân tích**: Biểu đồ xu hướng đơn hoàn/huỷ theo thời gian
7. **Blacklist**: Đánh dấu khách hàng bom hàng nhiều lần

## Notes

- Tính năng sử dụng GHTK API để đồng bộ trạng thái tự động
- Cần có GHTK token và client source hợp lệ
- Migration tự động cập nhật các đơn đã huỷ có mã vận đơn
- UI responsive, hoạt động tốt trên mobile và desktop
- Tích hợp với hệ thống đơn hàng hiện có, không ảnh hưởng logic cũ
