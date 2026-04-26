import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const purchaseToastSource = await readFile(new URL('../src/pages/storefront/script-purchase-toast.ts', import.meta.url), 'utf8')
const ordersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const storefrontModalsSource = await readFile(new URL('../src/pages/storefront/modals.ts', import.meta.url), 'utf8')
const storefrontSectionsSource = await readFile(new URL('../src/pages/storefront/sections.ts', import.meta.url), 'utf8')
const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminStylesSource = await readFile(new URL('../src/pages/admin/styles.ts', import.meta.url), 'utf8')
const adminScriptSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const adminSettingsScriptSource = await readFile(new URL('../src/pages/admin/script-featured-settings.ts', import.meta.url), 'utf8')
const adminUtilityRoutesSource = await readFile(new URL('../src/routes/adminUtilityRoutes.ts', import.meta.url), 'utf8')

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
  /const medalIcon = \(i\) => String\(i \+ 1\)/,
  'storefront bestseller badges should render stable numeric ranks instead of emoji medals',
)
assert.doesNotMatch(
  storefrontScriptSource,
  /🥇|🥈|🥉/,
  'storefront bestseller badges should not depend on emoji medal rendering',
)
assert.match(
  storefrontStylesSource,
  /\.bs-medal \{[\s\S]*width: 32px; height: 32px;[\s\S]*font-size: 18px;[\s\S]*font-weight: 900;/,
  'storefront bestseller badge should keep the circle size while enlarging the rank number',
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

console.log('Critical UI contract passed.')
