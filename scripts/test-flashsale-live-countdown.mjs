import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const storefrontSource = fs.readFileSync(path.join(root, 'src', 'pages', 'storefrontPage.ts'), 'utf8')

assert.match(storefrontSource, /async function startFlashSaleCountdownTicker\(/, 'storefront should expose a flash sale countdown ticker')
assert.match(storefrontSource, /data-flash-sale-ends-at=/, 'flash sale countdown render should carry end-time data attributes')
assert.match(storefrontSource, /querySelectorAll\('\.flash-sale-countdown\[data-flash-sale-ends-at\]'/, 'ticker should update all countdown nodes')
assert.match(storefrontSource, /setInterval\(/, 'ticker should update countdowns on an interval')
assert.match(storefrontSource, /startFlashSaleCountdownTicker\(\)/, 'storefront should start the countdown ticker after rendering')

console.log('flash sale live countdown contract ok')
