import { adminMobilePwaStyles, adminStyles } from './admin/styles'
import {
  adminBodyOpen,
  adminMobileMenuToggle,
  adminSidebarOverlay,
  adminSidebarSection,
  adminMainContentStart,
  adminDashboardPage,
  adminProductsPage,
  adminOrdersPage,
  adminReturnsPage,
  adminCustomersPage,
  adminMarketplacesPage,
  adminLiveChatPage,
  adminReviewsPage,
  adminVouchersPage,
  adminFeaturedPage,
  adminFlashSalePage,
  adminSettingsPage,
  adminPaymentSettingsPage,
  adminBackupPage,
  adminTextUiSettingsPage,
  adminImageSettingsPage,
  adminMembersPage,
  adminNotificationSettingsPage,
  adminAdminUiSettingsPage,
  adminBannersPage,
  adminBodyClose,
} from './admin/sections'
import { adminModalsSection } from './admin/modals'
import { adminInlineScript, adminBootstrapScript } from './admin/script'
import { adminOrdersScript } from './admin/script-orders'
import { adminFeaturedSettingsScript } from './admin/script-featured-settings'
import { adminFlashSaleScript } from './admin/script-flashsale'
import { adminReturnsScript } from './admin/script-returns'
import { adminCustomersScript } from './admin/script-customers'
import { adminLiveChatScript } from './admin/script-live-chat.ts'

export function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>QH Boypho Admin</title>
  <meta name="theme-color" content="#0f172a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QH Admin">
  <link rel="manifest" href="/admin-manifest.webmanifest">
  <link rel="icon" type="image/png" href="/qh-logo.png">
  <link rel="apple-touch-icon" href="/qh-logo.png">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<style>
${adminStyles()}
${adminMobilePwaStyles()}
body[data-admin-permission-ready='0'] #sidebar > nav { opacity: 0; pointer-events: none; }
body[data-admin-permission-ready='1'] #sidebar > nav { opacity: 1; transition: opacity 0.14s ease; }
.sidebar-brand-area { position: relative; }
.sidebar-brand-shell { position: relative; min-height: 2.5rem; }
.sidebar-brand-logo { position: relative; flex: 0 0 auto; transition: opacity 0.2s ease; }
.sidebar-brand-copy, .sidebar-label, .sidebar-sub-label { white-space: nowrap; }
.sidebar-brand-copy { flex: 1 1 auto; min-width: 0; overflow: hidden; }
.admin-sidebar-panel-icon { position: relative; display: inline-block; width: 1.15rem; height: 1.15rem; border: 1.7px solid currentColor; border-radius: 0.3rem; color: currentColor; }
.admin-sidebar-panel-icon::before { content: ''; position: absolute; top: 0.18rem; bottom: 0.18rem; left: 0.43rem; width: 1.7px; border-radius: 999px; background: currentColor; opacity: 0.9; }
.admin-sidebar-panel-icon::after { content: none; }
.sidebar-mobile-toggle > #menuToggleIcon { position: relative; z-index: 1; color: #374151; }
.sidebar-mobile-toggle .admin-sidebar-panel-icon { color: #374151; }
.sidebar-toggle-desktop { position: static; inset: auto; z-index: auto; width: 2rem; height: 2rem; margin-left: auto; border: 0; border-radius: 0.8rem; color: #cbd5e1; background: rgba(255,255,255,0.06); box-shadow: none; transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
.sidebar-toggle-desktop:hover { color: #fff; background: rgba(255,255,255,0.12); transform: translateY(-1px); }
.sidebar-toggle-desktop:active { transform: translateY(0); }
.collapsed-sidebar-tooltip {
  position: fixed;
  z-index: 1400;
  max-width: min(15rem, calc(100vw - 7rem));
  transform: translate(0.35rem, -50%) scale(0.98);
  transform-origin: left center;
  opacity: 0;
  pointer-events: none;
  border-radius: 0.65rem;
  background: rgba(15, 23, 42, 0.96);
  color: #fff;
  padding: 0.45rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.15;
  white-space: nowrap;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.24);
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.collapsed-sidebar-tooltip::before {
  content: '';
  position: absolute;
  left: -0.28rem;
  top: 50%;
  width: 0.55rem;
  height: 0.55rem;
  transform: translateY(-50%) rotate(45deg);
  border-radius: 0.08rem;
  background: rgba(15, 23, 42, 0.96);
}
.collapsed-sidebar-tooltip.is-visible {
  opacity: 1;
  transform: translate(0, -50%) scale(1);
}
@media (min-width: 768px) {
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-brand-shell { justify-content: center; }
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-brand-copy { display: none; }
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-toggle-desktop {
    position: absolute;
    left: 50%;
    top: 50%;
    right: auto;
    bottom: auto;
    margin: 0;
    width: 2.5rem;
    height: 2.5rem;
    color: #fff;
    background: rgba(15, 23, 42, 0.86);
    opacity: 0;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(0.92);
    box-shadow: none;
  }
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-brand-area:hover .sidebar-toggle-desktop,
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-toggle-desktop:hover,
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-toggle-desktop:focus-visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.26);
  }
  body[data-sidebar-state='collapsed'] #sidebar .sidebar-brand-area:hover .sidebar-brand-logo { opacity: 0; }
  body[data-sidebar-toggle-motion='collapsing'][data-sidebar-state='collapsed'] #sidebar .sidebar-toggle-desktop {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.92);
    box-shadow: none;
    transition: none;
  }
  body[data-sidebar-toggle-motion='collapsing'][data-sidebar-state='collapsed'] #sidebar .sidebar-brand-logo {
    opacity: 1;
    transition: none;
  }
}
</style>
</head>
${adminBodyOpen()}

${adminMobileMenuToggle()}

${adminSidebarOverlay()}

${adminSidebarSection()}

${adminMainContentStart()}

${adminDashboardPage()}

${adminProductsPage()}

${adminOrdersPage()}

${adminReturnsPage()}

${adminCustomersPage()}

${adminMarketplacesPage()}

${adminLiveChatPage()}

${adminReviewsPage()}

${adminVouchersPage()}

${adminFeaturedPage()}

${adminFlashSalePage()}

${adminSettingsPage()}

${adminPaymentSettingsPage()}

${adminBackupPage()}

${adminTextUiSettingsPage()}

${adminImageSettingsPage()}

${adminMembersPage()}

${adminNotificationSettingsPage()}

${adminAdminUiSettingsPage()}

${adminBannersPage()}

${adminModalsSection()}

<script>
${adminInlineScript()}
</script>
<script>
${adminOrdersScript()}
</script>
<script>
${adminReturnsScript()}
</script>
<script>
${adminCustomersScript()}
</script>
<script>
${adminLiveChatScript()}
</script>
<script>
${adminFlashSaleScript()}
</script>
<script>
${adminFeaturedSettingsScript()}
</script>
<script>
${adminBootstrapScript()}
</script>
${adminBodyClose()}
</html>`
}
