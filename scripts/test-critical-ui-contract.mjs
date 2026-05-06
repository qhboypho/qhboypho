import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const purchaseToastSource = await readFile(new URL('../src/pages/storefront/script-purchase-toast.ts', import.meta.url), 'utf8')
const ordersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const storefrontModalsSource = await readFile(new URL('../src/pages/storefront/modals.ts', import.meta.url), 'utf8')
const storefrontSectionsSource = await readFile(new URL('../src/pages/storefront/sections.ts', import.meta.url), 'utf8')
const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const storefrontDetailOrderScriptSource = await readFile(new URL('../src/pages/storefront/script-detail-order.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminModalsSource = await readFile(new URL('../src/pages/admin/modals.ts', import.meta.url), 'utf8')
const adminStylesSource = await readFile(new URL('../src/pages/admin/styles.ts', import.meta.url), 'utf8')
const adminScriptSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const adminSettingsScriptSource = await readFile(new URL('../src/pages/admin/script-featured-settings.ts', import.meta.url), 'utf8')
const adminCustomersScriptSource = await readFile(new URL('../src/pages/admin/script-customers.ts', import.meta.url), 'utf8')
const customerRoutesSource = await readFile(new URL('../src/routes/customerRoutes.ts', import.meta.url), 'utf8')
const adminUtilityRoutesSource = await readFile(new URL('../src/routes/adminUtilityRoutes.ts', import.meta.url), 'utf8')
const voucherStatsRoutesSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')
const authRoutesSource = await readFile(new URL('../src/routes/authRoutes.ts', import.meta.url), 'utf8')
const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const blockRoutesSource = await readFile(new URL('../src/routes/blockRoutes.ts', import.meta.url), 'utf8')
const mobileOrderCardSource = ordersSource.slice(
  ordersSource.indexOf('function renderOrdersMobileList'),
  ordersSource.indexOf('function toggleOrderSelection'),
)

assert.match(
  purchaseToastSource,
  /Vừa mua xong/,
  'purchase toast should use the accented "Vừa mua xong" label',
)
assert.match(
  purchaseToastSource,
  /Khách/,
  'purchase toast should use the accented "Khách" label',
)
assert.doesNotMatch(
  purchaseToastSource,
  /Vua mua xong|Khach/,
  'purchase toast should not regress to the non-accented labels',
)
assert.doesNotMatch(
  purchaseToastSource,
  /#6366f1/i,
  'purchase toast should not keep the indigo accent that clashes with the storefront brand palette',
)

assert.match(
  ordersSource,
  /Hành động này không thể hoàn tác/,
  'bulk delete should warn that deleting selected orders cannot be undone',
)
assert.match(
  adminCustomersScriptSource,
  /function encodeCustomerHistoryPayload[\s\S]*encodeURIComponent\(JSON\.stringify/,
  'admin customers should encode history modal payloads instead of concatenating quoted onclick arguments',
)
assert.doesNotMatch(
  adminCustomersScriptSource,
  /openCustomerOrderHistory\(\\'/,
  'admin customers should not use template-string escaped single quotes that collapse into invalid inline JavaScript',
)
assert.match(
  adminCustomersScriptSource,
  /function encodeCustomerBlockPayload[\s\S]*encodeURIComponent\(JSON\.stringify/,
  'admin customers should encode block/unblock payloads instead of concatenating quoted onclick arguments',
)
assert.doesNotMatch(
  adminCustomersScriptSource,
  /onclick="(?:un)?blockCustomer\(/,
  'admin customers should not wire block/unblock buttons through inline quoted function arguments',
)
assert.match(
  adminCustomersScriptSource,
  /customersTableBody[\s\S]*finally[\s\S]*renderCustomersTable/,
  'admin customers loading state should always settle through renderCustomersTable, even on request failure',
)
assert.match(
  customerRoutesSource,
  /WITH[\s\S]*ranked_orders[\s\S]*ROW_NUMBER\(\) OVER[\s\S]*GROUP BY customer_key/,
  'admin customers API should aggregate customers in SQL instead of fetching every order and grouping in JS',
)
assert.doesNotMatch(
  customerRoutesSource,
  /new Map\(\)[\s\S]*customerMap/,
  'admin customers API should not group all orders in memory for the customer list',
)
assert.match(
  customerRoutesSource,
  /normalizeCustomerListThumbnail[\s\S]*\^data:/,
  'admin customers API should strip large inline data thumbnails from the list payload',
)
assert.doesNotMatch(
  customerRoutesSource,
  /selected_color_image[\s\S]*AS product_thumbnail/,
  'admin customers list API should not fallback to selected_color_image because it can make the list payload megabytes',
)
assert.match(
  mobileOrderCardSource,
  /mobile-order-title-row[\s\S]*mobile-order-total[\s\S]*fmtPrice\(getOrderAmountDue\(o\)\)/,
  'admin mobile order cards should show the order total in the product title row instead of the old quantity badge',
)
assert.match(
  mobileOrderCardSource,
  /mobile-order-sku-row[\s\S]*SKU:[\s\S]*mobile-order-quantity[\s\S]*x\\\$\{o\.quantity \|\| 1\}/,
  'admin mobile order cards should place quantity on the SKU row and align it to the right',
)
assert.doesNotMatch(
  mobileOrderCardSource,
  /mobile-order-meta|Tổng tiền|Voucher|voucherHtml/,
  'admin mobile order cards should remove the old total/voucher boxes and payment method tag to reduce card height',
)
assert.match(
  ordersSource,
  /compact[\s\S]*\? 'grid grid-cols-2 gap-2 items-stretch w-full min-w-0'/,
  'admin mobile order action controls should put the primary button and secondary dropdown in a 50:50 row',
)
assert.match(
  mobileOrderCardSource,
  /mobile-order-payment-status[\s\S]*justify-end[\s\S]*paymentStatusLabel\(o\.payment_status\)/,
  'admin mobile order cards should show only the payment status at the bottom right',
)

assert.doesNotMatch(
  storefrontModalsSource,
  /Trường này là bắt buộc/,
  'payment method should not render the required-field error before user interaction',
)
assert.match(
  storefrontModalsSource,
  /ckFieldPaymentMethod/,
  'cart checkout step should render a payment method selector field',
)
assert.match(
  storefrontModalsSource,
  /Không thể đặt hàng/,
  'blocked storefront modal should use the new purchase-blocked wording',
)
assert.doesNotMatch(
  storefrontModalsSource,
  /Tài khoản bị hạn chế|Bạn đã bị cấm mua hàng tạm thời/,
  'blocked storefront modal should not keep the old blocked-purchase copy',
)

assert.doesNotMatch(
  storefrontSectionsSource,
  /Quản trị/,
  'public storefront footer should not expose the admin link',
)
assert.match(
  storefrontSectionsSource,
  /grid grid-cols-2 md:grid-cols-4 gap-8 text-center/,
  'features section should use two columns on mobile instead of stacking into a single column',
)

assert.doesNotMatch(
  storefrontStylesSource,
  /\.add-to-cart-btn \{ background: #16a34a !important; \}/,
  'add-to-cart button should not keep the green background that clashes with the storefront palette',
)
assert.doesNotMatch(
  storefrontStylesSource,
  /border-left:4px solid #6366f1|rgba\(99,102,241,0\.08\)/i,
  'shared purchase toast styles should not keep the indigo brand mismatch',
)
assert.match(
  storefrontScriptSource,
  /Không thể đặt hàng/,
  'storefront blocked purchase buttons should use the new wording',
)
assert.doesNotMatch(
  storefrontScriptSource,
  /Đã bị chặn mua hàng|Không thể thêm vào giỏ|Bạn đã bị cấm mua hàng tạm thời/,
  'storefront blocked purchase controls should not keep the old copy',
)
assert.match(
  storefrontDetailOrderScriptSource,
  /Không thể đặt hàng/,
  'detail order storefront script should use the new blocked-purchase fallback text',
)
assert.doesNotMatch(
  storefrontDetailOrderScriptSource,
  /Bạn đã bị cấm mua hàng tạm thời/,
  'detail order storefront script should not keep the old blocked-purchase fallback text',
)

assert.doesNotMatch(
  storefrontScriptSource,
  /payment_method:\s*'COD'/,
  'cart checkout should no longer hardcode COD as the only payment method',
)

assert.doesNotMatch(
  adminSectionsSource,
  /<!-- FLASH SALE PAGE -->|Giai đoạn đầu|Phase 1|Task 8|sẽ được phát triển thêm sau/i,
  'admin flash sale page should not ship developer comments or temporary implementation notes in production HTML',
)

assert.match(
  storefrontSectionsSource,
  /searchInput[\s\S]*?w-64/,
  'storefront search input should expand to w-64 for a less cramped search field',
)
assert.match(
  storefrontSectionsSource,
  /Chính sách đổi trả|Chính sách bảo mật/,
  'storefront footer should include policy links',
)
assert.match(
  storefrontSectionsSource,
  /footerSocialLinks|TikTok|Shopee|Facebook|Threads/,
  'storefront footer should reserve a social links area for configured MXH handles',
)

assert.match(
  purchaseToastSource,
  /purchaseToastSessionCap|purchaseToastShownCount/,
  'purchase toast should cap how many times it can appear in a single page load',
)
assert.doesNotMatch(
  purchaseToastSource,
  /sessionStorage/,
  'purchase toast cap should not persist across reloads in the same tab',
)
assert.doesNotMatch(
  purchaseToastSource,
  /t=setTimeout\(show,1000\);\s*\},5000\);\s*\}\s*t=setTimeout\(show,5000\);/s,
  'purchase toast should not keep the old infinite loop without a page-load cap',
)

assert.match(
  storefrontScriptSource,
  /handleGlobalEscape|closeVisibleStorefrontOverlay|storefrontClosableOverlays/,
  'storefront script should centralize Escape handling for closable overlays',
)
assert.match(
  storefrontScriptSource,
  /const medalClass = \(i\) => i < 3 \? 'bs-medal bs-medal-top bs-medal-top-' \+ \(i \+ 1\) : 'bs-medal bs-medal-n'/,
  'storefront bestseller badges should render emoji-only medals for the top 3 and keep numbered circular badges for ranks 4+',
)
assert.match(
  storefrontScriptSource,
  /const medalIcon = \(i\) => i === 0 \? '🥇' : i === 1 \? '🥈' : i === 2 \? '🥉' : String\(i \+ 1\)/,
  'storefront bestseller badges should keep emoji medals for the top 3 ranks',
)
assert.match(
  storefrontStylesSource,
  /\.bs-medal-top \{[\s\S]*background: none;[\s\S]*box-shadow: none;[\s\S]*font-size: 24px;/,
  'storefront bestseller top-3 medals should drop the circle background and enlarge the emoji',
)
assert.match(
  storefrontStylesSource,
  /\.bs-medal-n \{[\s\S]*width: 32px;[\s\S]*height: 32px;[\s\S]*border-radius: 50%;[\s\S]*font-size: 15px;/,
  'storefront bestseller ranks 4+ should keep the circular numbered badge sizing',
)
assert.match(
  storefrontScriptSource,
  /cartOverlay|detailOverlay|userMenuOverlay|shippingJourneyOverlay|orderBankTransferOverlay/,
  'storefront Escape handling should cover the major modal and drawer overlays',
)

assert.match(
  adminSectionsSource,
  /Setting<\/span>|>Setting</,
  'admin sidebar should expose the Setting group label',
)
assert.match(
  adminModalsSource,
  /customerActionConfirmModal/,
  'admin pages should ship a reusable customer action confirm modal',
)
assert.ok(
  adminSectionsSource.indexOf('id=\\"marketingMenuBtn\\"') < adminSectionsSource.indexOf('data-page=\\"reviews\\"')
    && adminSectionsSource.indexOf('data-page=\\"reviews\\"') < adminSectionsSource.indexOf('id=\\"settingsMenuBtn\\"')
    && adminSectionsSource.indexOf('id=\\"settingsMenuBtn\\"') < adminSectionsSource.indexOf('</nav>'),
  'admin sidebar should place Reviews near the bottom and Setting as the last navigation group',
)
assert.match(
  adminSectionsSource,
  /data-sub-page="settings-social"|>MXH</,
  'admin sidebar should include the MXH settings submenu',
)
assert.match(
  adminSectionsSource,
  /page-settings-social|Cấu hình MXH|Lưu cấu hình MXH/,
  'admin settings page should include the MXH settings screen',
)
assert.match(
  adminSettingsScriptSource,
  /loadSocialSettings|saveSocialSettings|previewSocialUrl|socialTiktokHandle|socialShopeeHandle|socialFacebookHandle|socialThreadsHandle/,
  'admin settings script should load and save MXH handles with link previews',
)
assert.match(
  adminCustomersScriptSource,
  /openCustomerActionConfirmModal[\s\S]*closeCustomerActionConfirmModal/,
  'admin customers should use the UI confirm modal instead of browser confirm dialogs',
)
assert.doesNotMatch(
  adminCustomersScriptSource,
  /confirm\('/,
  'admin customers should not use native confirm dialogs for block/unblock actions',
)
assert.match(
  adminUtilityRoutesSource,
  /\/api\/admin\/settings\/social|\/api\/public\/social-links|social_tiktok_handle|social_shopee_handle|social_facebook_handle|social_threads_handle/,
  'routes should persist social handles for admin and expose public social links safely',
)
assert.match(
  adminStylesSource,
  /sidebar-collapsed|data-sidebar-state|sidebar-toggle-desktop|sidebar-mini/,
  'admin styles should include a desktop mini sidebar state',
)
assert.match(
  adminSectionsSource,
  /menuToggle[\s\S]*z-\[70\][\s\S]*menuToggleIcon/,
  'admin mobile sidebar toggle should stay above the sticky header and expose a stateful icon',
)
assert.match(
  adminStylesSource,
  /body\[data-mobile-sidebar-state='open'\] #menuToggle[\s\S]*left: calc\(16rem - 1\.375rem\)/,
  'admin mobile sidebar toggle should slide to the sidebar/content boundary when opened',
)
assert.match(
  adminStylesSource,
  /body\[data-mobile-sidebar-state='open'\] #sidebarOverlay[\s\S]*left: 16rem/,
  'admin mobile sidebar overlay should cover only the content area, not the opened sidebar',
)
assert.match(
  adminStylesSource,
  /\.sidebar-toggle-desktop[\s\S]*position: fixed[\s\S]*left: calc\(16rem - 1\.25rem\)[\s\S]*body\[data-sidebar-state='collapsed'\] \.sidebar-toggle-desktop[\s\S]*left: calc\(5\.5rem - 1\.25rem\)/,
  'admin desktop sidebar toggle should sit on the sidebar/content boundary in both states',
)
assert.match(
  adminStylesSource,
  /body\[data-sidebar-state='collapsed'\] \.sidebar-chevron,[\s\S]*\.sidebar-badge[\s\S]*display: none !important[\s\S]*body\[data-sidebar-state='collapsed'\] #sidebar \.nav-item[\s\S]*gap: 0[\s\S]*border-left: 0[\s\S]*#sidebar \.nav-item > i:first-child/,
  'collapsed admin sidebar should center icons without leftover badge, label gap, or active border offset',
)
assert.match(
  adminScriptSource,
  /function syncMobileSidebarToggle\(open\)[\s\S]*dataset\.mobileSidebarState[\s\S]*menuToggleIcon[\s\S]*fa-xmark/,
  'admin mobile sidebar script should keep the floating toggle position and icon in sync',
)
assert.match(
  adminScriptSource,
  /function resetAdminTransientSurface\(reason = 'navigation-reset'\)[\s\S]*closeMobileSidebar\(\)[\s\S]*scheduleAdminOverlaySanitize\(\)/,
  'admin dashboard should hard-reset stale mobile/sidebar overlays when entering from login or browser history',
)
assert.match(
  adminScriptSource,
  /window\.addEventListener\('pageshow', handleAdminPageShow\)/,
  'admin dashboard should sanitize restored browser sessions through a dedicated pageshow handler',
)
assert.doesNotMatch(
  adminScriptSource,
  /prev\.charCodeAt\(0\) > 127/,
  'admin customer-name display should not strip valid Vietnamese final letters such as the u in Hiếu',
)
assert.match(
  adminSectionsSource,
  /dashboard-stat-card[\s\S]*dashboard-stat-value-revenue[\s\S]*dashboard-recent-orders-panel[\s\S]*dashboardCustomerModal/,
  'admin dashboard should expose mobile-safe stat classes and a customer info modal',
)
assert.match(
  adminStylesSource,
  /\.dashboard-stat-value[\s\S]*overflow-wrap: anywhere[\s\S]*\.dashboard-recent-mobile-list/,
  'admin dashboard stat values should scale/wrap safely and define a mobile recent-order list',
)
assert.match(
  adminStylesSource,
  /@media \(max-width: 767px\)[\s\S]*\.dashboard-recent-desktop-table \{ display: none; \}[\s\S]*\.dashboard-recent-mobile-list \{ display: flex;/,
  'admin dashboard should hide the recent-order table and show card list on mobile',
)
assert.match(
  adminStylesSource,
  /\.orders-header-search\.expanded \{[\s\S]*left: 4rem;[\s\S]*right: 0\.5rem;[\s\S]*max-width: calc\(100vw - 4\.5rem\);/,
  'admin orders mobile expanded search should keep the previous input width while leaving room for the hamburger toggle',
)
assert.doesNotMatch(
  adminStylesSource,
  /\.orders-header-search\.expanded \{[\s\S]*left: 8px;[\s\S]*right: 8px;/,
  'admin orders mobile expanded search should not span under the hamburger toggle',
)
assert.match(
  adminStylesSource,
  /#adminAvatarMenuTrigger \{[\s\S]*background: transparent !important;[\s\S]*box-shadow: none !important;[\s\S]*#adminHeaderProfileName \{[\s\S]*display: none !important;/,
  'admin mobile header account trigger should render as avatar-only without the black pill or profile text',
)
assert.match(
  adminStylesSource,
  /#adminAvatarMenuRoot \{[\s\S]*width: 6\.5rem;[\s\S]*justify-content: flex-end;/,
  'admin mobile header should keep the original account slot width so the collapsed orders search icon does not shift right',
)
assert.match(
  adminStylesSource,
  /\.orders-header-search\.expanded \.orders-header-search-btn \{[\s\S]*display: none;/,
  'admin orders mobile expanded search should hide the search icon button while the input is open',
)
assert.doesNotMatch(
  adminScriptSource,
  /syncOrdersSearchAnchor|--orders-search-expanded-right/,
  'admin orders search should not use dynamic measured positioning for this simple mobile toggle',
)
assert.match(
  adminScriptSource,
  /function renderRecentDashboardOrders[\s\S]*dashboard-recent-desktop-table[\s\S]*dashboard-recent-mobile-list/,
  'admin dashboard should render desktop table plus mobile cards and open customer modal from mobile cards',
)
assert.match(
  adminScriptSource,
  /function openDashboardCustomerModal[\s\S]*dashboardCustomerModal[\s\S]*showAdminOverlay/,
  'admin dashboard should open the customer info modal from mobile cards',
)
assert.match(
  adminScriptSource,
  /getDashboardOrderImage[\s\S]*getOrderItemImage[\s\S]*product_thumbnail/,
  'admin dashboard mobile cards should resolve order thumbnails through existing order image data',
)
assert.match(
  adminScriptSource,
  /function fitDashboardStatValues[\s\S]*scrollWidth[\s\S]*clientWidth[\s\S]*fontSize/,
  'admin dashboard stat values should auto-fit their font size against actual rendered width',
)
assert.match(
  adminScriptSource,
  /statRevenueEl\.textContent = fmtPrice\(d\.revenue \|\| 0\)[\s\S]*fitDashboardStatValues\(\)/,
  'admin dashboard should re-fit stat values after loading large revenue numbers',
)
assert.match(
  adminScriptSource,
  /window\.addEventListener\('resize', fitDashboardStatValues\)/,
  'admin dashboard should re-fit stat values after viewport changes',
)
assert.match(
  voucherStatsRoutesSource,
  /p\.thumbnail AS product_thumbnail[\s\S]*p\.images AS product_images[\s\S]*p\.colors AS product_colors[\s\S]*LEFT JOIN products p ON p\.id = o\.product_id/,
  'admin stats recent orders should include joined product image data for dashboard cards',
)
assert.match(
  voucherStatsRoutesSource,
  /recentInternalFilterSql[\s\S]*LOWER\(COALESCE\(o\.status, ''\)\) != 'cancelled'/,
  'admin stats recent orders should exclude cancelled orders at the data source',
)

assert.match(
  authRoutesSource,
  /SELECT id as userId[\s\S]*is_blocked[\s\S]*blocked_reason[\s\S]*FROM users/,
  'auth me should expose customer block status so storefront can disable purchase controls after login',
)
assert.match(
  orderRoutesSource,
  /function normalizeOrderPhone[\s\S]*replace\(\/\\s\+\/g, ''\)[\s\S]*isBlockedValue\(user\.is_blocked\)/,
  'order creation should normalize phones and use numeric block checks instead of strict value equality',
)
assert.match(
  blockRoutesSource,
  /function normalizeBlockPhone[\s\S]*replace\(\/\\s\+\/g, ''\)[\s\S]*isBlockedValue\(user\.is_blocked\)/,
  'block status routes should normalize phone input and handle D1 numeric/string block flags',
)
assert.match(
  storefrontScriptSource,
  /normalizeCustomerPhone[\s\S]*assertCustomerCanShop[\s\S]*renderProductCardActions[\s\S]*checkCustomerBlockStatus/,
  'storefront should hide or block purchase controls for blocked logged-in customers',
)

console.log('Critical UI contract passed.')
