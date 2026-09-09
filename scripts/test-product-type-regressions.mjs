import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const tscPath = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url))
if (!existsSync(tscPath)) {
  console.error(`TypeScript compiler was not found at ${tscPath}.`)
  process.exit(1)
}

const targetFiles = [
  'src/lib/flashSaleHelpers.ts',
  'src/lib/productSkuHelpers.ts',
  'src/routes/productRoutes.ts'
]

const result = spawnSync(process.execPath, [tscPath, '--noEmit', '--pretty', 'false', '--listFiles'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})

const diagnostics = `${result.stdout || ''}${result.stderr || ''}`
if (result.error || result.status === null) {
  console.error(`TypeScript compiler could not complete: ${result.error?.message || 'process terminated without an exit status'}`)
  process.exit(1)
}

const normalizedOutput = diagnostics.replaceAll('\\', '/')
const missingTargetFiles = targetFiles.filter((file) => (
  !normalizedOutput.split(/\r?\n/).some((line) => line.trim().endsWith(file))
))
if (missingTargetFiles.length > 0) {
  console.error('TypeScript did not include the expected target files:')
  for (const file of missingTargetFiles) console.error(`- ${file}`)
  process.exit(1)
}

const targetDiagnosticLines = normalizedOutput
  .split(/\r?\n/)
  .filter((line) => (
    targetFiles.some((file) => line.includes(`${file}(`)) &&
    /\b(?:error|warning|suggestion) TS\d+:/.test(line)
  ))

if (targetDiagnosticLines.length > 0) {
  console.error('Targeted product type diagnostics remain:')
  for (const line of targetDiagnosticLines) console.error(`- ${line}`)
  process.exit(1)
}

console.log('Targeted product type diagnostics are absent.')
if (result.status !== 0) {
  if (!diagnostics.trim()) {
    console.error('TypeScript exited unsuccessfully without diagnostic output.')
    process.exit(1)
  }
  console.log('TypeScript still reports unrelated baseline diagnostics; those are outside this regression check.')
}

const runtimeCheck = spawnSync(process.execPath, [
  '--experimental-strip-types',
  '--input-type=module',
  '-e',
  `
    import assert from 'node:assert/strict'
    import { shapeFlashSaleProductRow } from './src/lib/flashSaleHelpers.ts'
    import { findProductSkuMatch } from './src/lib/productSkuHelpers.ts'

    const shaped = shapeFlashSaleProductRow({
      id: 101,
      name: 'Null campaign product',
      price: 120000,
      flash_sale_id: null
    })
    assert.equal(shaped.has_flash_sale, false)
    assert.equal(shaped.flash_sale, null)
    assert.equal(shaped.display_price, 120000)

    const matched = findProductSkuMatch([
      { id: 7, color: null, size: undefined, is_active: 1 },
      { id: 8, color: 'Red', size: 'M', is_active: 1 }
    ], null, undefined)
    assert.equal(matched?.id, 7)
  `
], {
  cwd: process.cwd(),
  encoding: 'utf8'
})

if (runtimeCheck.error || runtimeCheck.status === null) {
  console.error(`Runtime regression check could not complete: ${runtimeCheck.error?.message || 'process terminated without an exit status'}`)
  process.exit(1)
}
if (runtimeCheck.status !== 0) {
  console.error('Runtime null-value regression assertions failed:')
  console.error(`${runtimeCheck.stdout || ''}${runtimeCheck.stderr || ''}`.trim())
  process.exit(1)
}

console.log('Runtime null campaign and nullable SKU assertions passed.')
