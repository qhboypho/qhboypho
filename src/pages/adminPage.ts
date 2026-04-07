import { adminStyles } from './admin/styles'
import {
  adminBodyOpen,
  adminMobileMenuToggle,
  adminSidebarOverlay,
  adminSidebarSection,
  adminMainContentStart,
  adminDashboardPage,
  adminProductsPage,
  adminOrdersPage,
  adminVouchersPage,
  adminFeaturedPage,
  adminFlashSalePage,
  adminSettingsPage,
  adminBannersPage,
  adminBodyClose,
} from './admin/sections'
import { adminModalsSection } from './admin/modals'
import { adminInlineScript } from './admin/script'

export function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QH Clothes Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
${adminStyles()}
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

${adminVouchersPage()}

${adminFeaturedPage()}

${adminFlashSalePage()}

${adminSettingsPage()}

${adminBannersPage()}

${adminModalsSection()}

<script>
${adminInlineScript()}
</script>
${adminBodyClose()}
</html>`
}
