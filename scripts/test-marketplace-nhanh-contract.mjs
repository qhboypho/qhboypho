import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'

const routePath = new URL('../src/routes/marketplaceRoutes.ts', import.meta.url)
const routeSource = existsSync(routePath) ? readFileSync(routePath, 'utf8') : ''
const appTypes = readFileSync(new URL('../src/types/app.ts', import.meta.url), 'utf8')
const runtimeConfig = readFileSync(new URL('../src/lib/runtimeConfigHelpers.ts', import.meta.url), 'utf8')
const permissions = readFileSync(new URL('../src/lib/adminPermissions.ts', import.meta.url), 'utf8')
const indexSource = readFileSync(new URL('../src/index.tsx', import.meta.url), 'utf8')
const adminPage = readFileSync(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')
const adminSections = readFileSync(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminScript = readFileSync(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')

describe('Nhanh marketplace integration contract', () => {
  it('declares Nhanh runtime secrets without exposing raw values to the admin UI', () => {
    for (const key of ['NHANH_APP_ID', 'NHANH_SECRET_KEY', 'NHANH_BUSINESS_ID', 'NHANH_ACCESS_TOKEN']) {
      assert.match(appTypes, new RegExp(`${key}\\?:\\s*string`))
      assert.match(runtimeConfig, new RegExp(`${key}:\\s*'nhanh_`))
    }
    assert.match(routeSource, /maskSecret/)
    assert.match(routeSource, /secretKeyMasked:\s*maskSecret\(config\.secretKey\)/)
    assert.match(routeSource, /accessTokenMasked:\s*maskSecret\(config\.accessToken\)/)
    assert.match(routeSource, /hasSecretKey:\s*!!config\.secretKey/)
    assert.match(routeSource, /hasAccessToken:\s*!!config\.accessToken/)
  })

  it('registers secured admin marketplace routes and the public OAuth callback', () => {
    assert.match(indexSource, /registerMarketplaceRoutes/)
    assert.match(routeSource, /app\.get\('\/api\/admin\/marketplaces\/config'/)
    assert.match(routeSource, /app\.put\('\/api\/admin\/marketplaces\/config'/)
    assert.match(routeSource, /app\.post\('\/api\/admin\/marketplaces\/nhanh\/exchange-token'/)
    assert.match(routeSource, /app\.get\('\/api\/admin\/marketplaces\/orders'/)
    assert.match(routeSource, /app\.get\('\/api\/nhanh\/oauth\/callback'/)
    assert.match(routeSource, /pos\.open\.nhanh\.vn\/v3\.0\/order\/list/)
    assert.match(routeSource, /pos\.open\.nhanh\.vn\/v3\.0\/ecom\/shop/)
    assert.match(routeSource, /pos\.open\.nhanh\.vn\/v3\.0\/ecom\/return/)
    assert.match(routeSource, /8855.*'tiktok'/)
    assert.match(routeSource, /8195.*'shopee'/)
  })

  it('adds a dedicated permission key for marketplaces', () => {
    assert.match(permissions, /\|\s*'marketplaces'/)
    assert.match(permissions, /key:\s*'marketplaces',\s*label:\s*'Sàn TMĐT'/)
    assert.match(permissions, /p\.startsWith\('\/api\/admin\/marketplaces'\).*key:\s*'marketplaces'/)
    assert.match(adminScript, /marketplaces:\s*'Sàn TMĐT'/)
  })

  it('renders the admin Sàn TMĐT sidebar item, page, filters and table', () => {
    assert.match(adminSections, /data-page="marketplaces"/)
    assert.match(adminSections, /Sàn TMĐT/)
    assert.match(adminSections, /page-marketplaces/)
    assert.match(adminSections, /marketplaceChannelTabs/)
    assert.match(adminSections, /marketplaceDateFilter/)
    assert.match(adminSections, /marketplaceStatusFilter/)
    assert.match(adminSections, /marketplaceOrdersTableBody/)
    assert.match(adminPage, /adminMarketplacesPage/)
    assert.match(adminScript, /loadMarketplaceOrders/)
    assert.match(adminScript, /renderMarketplaceOrders/)
    assert.match(adminScript, /setMarketplaceDate/)
    assert.match(adminScript, /shiftMarketplaceDate/)
    assert.match(adminScript, /date:\s*marketplaceFilters\.date/)
  })

  it('filters Nhanh orders by day/status and still supports paginated date windows', () => {
    assert.match(routeSource, /DEFAULT_MARKETPLACE_DAYS\s*=\s*365/)
    assert.match(routeSource, /MAX_NHANH_RANGE_DAYS\s*=\s*31/)
    assert.match(routeSource, /parseVietnamDayRange/)
    assert.match(routeSource, /parseNhanhStatusFilter/)
    assert.match(routeSource, /parseNhanhSaleChannelFilter/)
    assert.match(routeSource, /createdAtFrom:\s*unixSeconds\(cursorStart\)/)
    assert.match(routeSource, /createdAtTo:\s*unixSeconds\(cursorEnd\)/)
    assert.match(routeSource, /statuses:\s*statusCodes/)
    assert.match(routeSource, /saleChannels/)
    assert.match(routeSource, /page\.data\?\.paginator\?\.next\?\.id/)
    assert.match(routeSource, /fetchNhanhOrdersByRange\(config,\s*pageSize,\s*days,\s*statusCodes,\s*saleChannels,\s*dateFilter\)/)
  })

  it('uses marketplace order ids instead of Nhanh internal order ids in the table code column', () => {
    assert.match(routeSource, /const platformOrderCode = collectValues\(channel,\s*\['appOrderId'/)
    assert.match(routeSource, /const returnOrderCode = collectValues\(raw,\s*\['returnId'/)
    assert.match(routeSource, /code:\s*\(bucket === 'returns' \? returnOrderCode : ''\) \|\| platformOrderCode \|\| internalCode/)
    assert.match(routeSource, /code:\s*returnCode \|\| normalized\.code/)
  })
})
