# Hướng dẫn sử dụng Quản lý hoàn trả

## Giới thiệu

Tính năng "Quản lý hoàn trả" giúp bạn theo dõi và quản lý:
- **Đơn hoàn**: Đơn hàng khách đã nhận nhưng hoàn trả lại
- **Đơn huỷ**: Đơn hàng khách không nhận (bom hàng)

## Truy cập

1. Đăng nhập vào Admin Dashboard
2. Click menu **"Quản lý hoàn trả"** (icon ↩️) trên sidebar
3. Trang sẽ hiển thị 2 tabs:
   - **Đơn hoàn** (mặc định)
   - **Đơn huỷ**

## Chức năng chính

### 1. Xem danh sách đơn

**Desktop**: Hiển thị dạng bảng với các cột:
- Mã đơn
- Khách hàng (tên + SĐT)
- Sản phẩm
- Số lượng
- Tổng tiền
- Mã vận đơn
- Ngày tạo
- Hành động

**Mobile**: Hiển thị dạng card với thông tin rút gọn

### 2. Tìm kiếm đơn

Sử dụng ô tìm kiếm để lọc theo:
- Mã đơn hàng
- Tên khách hàng
- Số điện thoại

### 3. Đồng bộ từ GHTK

Click nút **"Đồng bộ từ GHTK"** để:
- Tự động kiểm tra trạng thái tất cả đơn có mã vận đơn GHTK
- Cập nhật đơn hoàn/huỷ dựa trên dữ liệu từ GHTK
- Hiển thị số đơn đã đồng bộ thành công

**Lưu ý**: Cần cấu hình GHTK token trong file `.dev.vars`

### 4. Xem chi tiết đơn

Click icon 👁️ ở cột "Hành động" để xem chi tiết đơn hàng

## Cách hoạt động

### Đồng bộ tự động với GHTK

Khi bạn click "Đồng bộ từ GHTK", hệ thống sẽ:

1. Lấy tất cả đơn hàng có mã vận đơn GHTK
2. Gọi API GHTK để kiểm tra trạng thái từng đơn
3. Phân loại dựa trên status từ GHTK:
   - **Status 9** hoặc text chứa "hủy" → Đơn huỷ
   - **Status 10** hoặc text chứa "hoàn" → Đơn hoàn
4. Tự động cập nhật vào database
5. Hiển thị kết quả đồng bộ

### Trạng thái đơn hàng

Mỗi đơn hàng có trường `return_status`:
- `NULL`: Đơn bình thường (không hoàn/huỷ)
- `'returned'`: Đơn hoàn (khách nhận rồi hoàn lại)
- `'cancelled'`: Đơn huỷ (khách không nhận - bom hàng)

## Cấu hình

### Environment Variables

Thêm vào file `.dev.vars`:
```env
GHTK_TOKEN=your_ghtk_token_here
GHTK_CLIENT_SOURCE=your_client_source_here
```

### Database Migration

Chạy migration để thêm cột `return_status`:
```bash
npm run db:migrate:local
```

## Tips & Best Practices

1. **Đồng bộ định kỳ**: Nên đồng bộ từ GHTK mỗi ngày để cập nhật trạng thái mới nhất

2. **Theo dõi khách bom hàng**: Sử dụng tab "Đơn huỷ" để xác định khách hàng hay bom hàng

3. **Phân tích xu hướng**: Theo dõi số lượng đơn hoàn/huỷ để cải thiện dịch vụ

4. **Xử lý đơn hoàn**: 
   - Kiểm tra lý do hoàn hàng
   - Liên hệ khách để giải quyết vấn đề
   - Cập nhật lại kho hàng

5. **Xử lý đơn huỷ**:
   - Xác nhận với đơn vị vận chuyển
   - Cập nhật blacklist nếu cần
   - Hoàn tiền cho khách (nếu đã thanh toán)

## Troubleshooting

### Không đồng bộ được từ GHTK

**Nguyên nhân**: 
- Thiếu GHTK token hoặc client source
- Token không hợp lệ
- Không có kết nối internet

**Giải pháp**:
1. Kiểm tra file `.dev.vars` có đầy đủ thông tin
2. Xác nhận token còn hiệu lực
3. Kiểm tra kết nối mạng

### Không hiển thị đơn

**Nguyên nhân**:
- Chưa có đơn nào có trạng thái hoàn/huỷ
- Chưa chạy migration

**Giải pháp**:
1. Chạy migration: `npm run db:migrate:local`
2. Đồng bộ từ GHTK để cập nhật trạng thái
3. Hoặc cập nhật thủ công qua API

## API Reference

### GET /api/admin/returns
Lấy danh sách tất cả đơn hoàn và đơn huỷ

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_code": "QH123456",
      "customer_name": "Nguyễn Văn A",
      "customer_phone": "0901234567",
      "product_name": "Áo thun basic",
      "quantity": 2,
      "total_price": 299000,
      "shipping_tracking_code": "S123456",
      "return_status": "returned",
      "created_at": "2026-04-28T10:00:00Z"
    }
  ]
}
```

### POST /api/admin/returns/sync-ghtk
Đồng bộ trạng thái từ GHTK

**Response**:
```json
{
  "success": true,
  "synced_count": 5,
  "total_checked": 20,
  "updated_orders": [
    {
      "order_code": "QH123456",
      "old_status": null,
      "new_status": "returned"
    }
  ]
}
```

### PATCH /api/admin/returns/:id/status
Cập nhật trạng thái thủ công

**Request**:
```json
{
  "return_status": "returned"
}
```

**Response**:
```json
{
  "success": true,
  "return_status": "returned"
}
```

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ team phát triển hoặc tạo issue trên GitHub.
