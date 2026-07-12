import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'flashSaleRoutes.ts'), 'utf8')
const scriptSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script-flashsale.ts'), 'utf8')

assert.match(
  routeSource,
  /app\.patch\('\/api\/admin\/flash-sales\/:id\/active'/,
  'flash sale routes should expose an active toggle endpoint'
)
assert.match(
  routeSource,
  /SET is_active = \?, updated_at = CURRENT_TIMESTAMP[\s\S]*WHERE id = \?/,
  'active toggle endpoint should only update campaign active flag'
)
assert.doesNotMatch(
  routeSource,
  /SET name = \?, start_at = \?, end_at = \?, is_active = 1, updated_at = CURRENT_TIMESTAMP/,
  'editing an existing flash sale should not force disabled campaigns back on'
)
assert.match(
  scriptSource,
  /data-flashsale-toggle-btn/,
  'admin flash sale list should render a stable toggle switch hook'
)
assert.match(
  scriptSource,
  /const isCampaignEnabled = isCampaignActiveFlag && !isEnded/,
  'ended flash sales should render the switch as off even if the stored active flag is still on'
)
assert.match(
  scriptSource,
  /isEnded \? 'Flashsale đã kết thúc'/,
  'ended flash sales should explain that the switch is locked because the campaign ended'
)
assert.match(
  scriptSource,
  /async function toggleFlashSaleCampaignActive/,
  'admin flash sale runtime should toggle campaign active state'
)
assert.match(
  scriptSource,
  /axios\.patch\('\/api\/admin\/flash-sales\/' \+ id \+ '\/active'/,
  'admin flash sale switch should call the active toggle endpoint'
)

console.log('flash sale active toggle contract ok')
