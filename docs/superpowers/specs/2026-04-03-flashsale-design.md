# Flash Sale Phase 1 Design

## Goal

Add a `Marketing > Flashsale` feature to the admin and a matching storefront flash sale experience.

Phase 1 should:

- let admins create and manage flash sale campaigns
- let admins attach products to a flash sale with promotional pricing
- make flash sale pricing override the normal displayed product price
- show flash sale state clearly on the storefront with countdown and promotional UI

Phase 1 should **not** try to fully clone Shopee/TikTok Shop behavior. It should deliver a solid first release with clear boundaries and low regression risk.

## Scope

Included in phase 1:

- admin sidebar group `Marketing`
- admin submenu `Flashsale`
- flash sale listing page with tabs:
  - `Tất cả trạng thái`
  - `Đang diễn ra`
  - `Sắp tới`
- create flash sale modal
- choose products for a flash sale
- assign sale price or percentage discount at product level
- storefront flash sale UI on:
  - product cards
  - product detail modal
  - a dedicated `Flash Sale của shop` section
- countdown rendering for active campaigns
- flash sale price taking top display priority over regular product pricing

Out of scope for phase 1:

- flash sale at variant level
- flash sale reserved inventory
- per-user purchase enforcement
- live stream channel targeting
- seller/creator-specific channel distribution logic
- advanced campaign analytics
- backend pagination for flash sale admin pages

## Product Rules

### Price priority

Flash sale has the highest display priority.

When a product has an active flash sale item:

1. storefront shows flash sale price first
2. old display price is shown as struck-through reference
3. normal promotional display logic is suppressed for that product card/detail view

Voucher logic remains unchanged:

- vouchers still apply during checkout/order submission
- vouchers do not replace the flash sale display price on product cards

### Active campaign rule

A flash sale item is considered active only when:

- the campaign is enabled
- the item is enabled
- current time is `>= start_at`
- current time is `< end_at`

### Product-level only

Phase 1 flash sale applies at the product level, not by color/size variant.

This keeps the first release compatible with the current codebase and avoids introducing price resolution complexity into:

- variant selection
- order history
- shipping tables
- flash sale countdown rendering

## Data Model

### Table: `flash_sales`

Fields:

- `id`
- `name`
- `start_at`
- `end_at`
- `is_active`
- `created_at`
- `updated_at`

Derived statuses:

- `Đang diễn ra`
- `Sắp tới`
- `Đã kết thúc`
- `Đã vô hiệu hoá`

Status should be derived from time and enable state rather than stored redundantly.

### Table: `flash_sale_items`

Fields:

- `id`
- `flash_sale_id`
- `product_id`
- `sale_price`
- `discount_percent`
- `purchase_limit`
- `is_enabled`
- `created_at`
- `updated_at`

Rules:

- exactly one promotional value should be used for display
- `sale_price` is preferred when provided
- otherwise `discount_percent` is used to derive display price
- invalid derived prices (`<= 0`) should be excluded from storefront display

## Admin UX

### Sidebar

Add a new collapsible menu group:

- `Marketing`

With submenu:

- `Flashsale`

This should follow the same interaction pattern as the existing `Cài đặt` menu group.

### Flash sale page

Page title:

- `Quản lý Flashsale`

Top actions:

- page title
- short description
- `Tạo flashsale` button

Tabs:

- `Tất cả trạng thái`
- `Đang diễn ra`
- `Sắp tới`

Listing columns:

- `Tên khuyến mãi`
- `Trạng thái`
- `Thời gian bắt đầu`
- `Thời gian kết thúc`
- `Số sản phẩm`
- `Thao tác`

The page should visually match the existing admin design system:

- white cards
- rounded panels
- compact colored status badges
- no default browser-heavy table styling

### Create flash sale modal

Fields:

- `Tên khuyến mãi`
- `Thời gian bắt đầu`
- `Thời gian kết thúc`
- product selection
- pricing setup per selected product
- optional `Giới hạn mua`

Recommended flow inside the modal:

1. Basic campaign information
2. Select products
3. Configure promotional pricing for each selected product

Product pricing row fields:

- product thumbnail
- product name
- original price
- flash sale price
- or percent discount
- optional purchase limit

Validation:

- required campaign name
- required start/end time
- end time must be after start time
- at least one product
- each selected product must have valid promotional pricing

## Storefront UX

### Product cards

When a product has an active flash sale:

- show a `Flash Sale` badge
- show countdown
- show flash sale price
- show original price struck through

Card layout should reuse the existing product card structure as much as possible.

### Product detail modal

When the product is in flash sale:

- show a stronger flash sale strip/badge
- show countdown prominently
- show sale price in the main price slot
- show original price struck through

The buy flow remains unchanged:

- `Đặt hàng ngay`
- add-to-cart behavior
- color/size selection rules

### Dedicated storefront section

Add a dedicated section:

- `Flash Sale của shop`

This section should:

- appear near the main product discovery area
- only show products with active flash sale items
- work on desktop and mobile
- support compact promotional presentation

Recommended layout:

- desktop: horizontal strip or grid
- mobile: horizontal slider

## API Design

### Admin APIs

Add a route group for flash sales:

- `GET /api/admin/flash-sales`
- `POST /api/admin/flash-sales`
- `GET /api/admin/flash-sales/:id`
- `PUT /api/admin/flash-sales/:id`
- `PATCH /api/admin/flash-sales/:id/toggle`
- `DELETE /api/admin/flash-sales/:id`

Each listing response should include:

- campaign status
- item count
- timing summary

### Storefront APIs

Two acceptable strategies:

1. enrich existing product responses with flash sale data
2. provide a dedicated flash sale endpoint plus optional product enrichment

Recommended phase 1 approach:

- enrich existing product responses with flash sale fields
- add dedicated endpoint for the `Flash Sale của shop` section

Recommended storefront route:

- `GET /api/flash-sales/active-products`

Recommended product payload additions:

- `flash_sale_active`
- `flash_sale_name`
- `flash_sale_start_at`
- `flash_sale_end_at`
- `flash_sale_price`
- `flash_sale_discount_percent`

## Pricing Resolution

Recommended shared helper:

- resolve effective display price for product

Inputs:

- base product price
- original price
- flash sale metadata

Outputs:

- effective display price
- original comparison price
- flash sale badge/countdown metadata

This helper should be reused by:

- storefront product card rendering
- detail modal rendering
- active flash sale section rendering

## Error Handling

Admin:

- invalid date range should block save with inline validation
- empty product selection should block save
- invalid promotional price should show per-row feedback

Storefront:

- if flash sale data is missing or invalid, gracefully fall back to normal product pricing
- countdown should hide rather than break the card if time parsing fails

## Verification Plan

Phase 1 should be verified with:

- migration success
- admin create flash sale flow
- admin listing status changes across time windows
- storefront card price override
- storefront detail modal price override
- storefront flash sale section rendering
- regression check for:
  - product listing load
  - detail modal
  - quick order modal
  - add-to-cart
  - existing voucher flow

Use:

- `npm run build`
- `npm run check:ui-safety`

## Recommended Implementation Order

1. database migration for flash sale tables
2. backend admin CRUD routes
3. backend storefront active flash sale query logic
4. admin sidebar + page shell
5. create flash sale modal
6. storefront flash sale price resolution
7. storefront flash sale UI section and badges
8. regression verification

## Future Phase 2

Potential next upgrades after phase 1 is stable:

- variant-level flash sale pricing
- inventory reservation
- purchase limit enforcement by user
- flash sale analytics
- richer storefront campaign banners
- live/campaign channel targeting
