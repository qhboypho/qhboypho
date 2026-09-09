import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const readConfig = (file) => {
  const parsed = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8'))
  assert.equal(parsed.error, undefined, `${file} must parse`)
  return parsed.config
}
const pages = readConfig('wrangler.jsonc')
assert.equal(pages.name, 'qhclothes')
assert.equal(pages.migrations, undefined, 'Pages cannot own Durable Object migrations')
assert.equal(pages.triggers, undefined, 'Pages cannot run scheduled handlers')
assert.deepEqual(pages.env.preview.d1_databases, [], 'Unprovisioned preview must not inherit production DB')
assert.deepEqual(pages.env.preview.r2_buckets, [], 'Unprovisioned preview must not inherit production images')
assert.deepEqual(pages.env.preview.durable_objects.bindings, [], 'Unprovisioned preview must not inherit live chat')
const chat = readConfig('wrangler.chat.jsonc')
assert.equal(pages.durable_objects.bindings[0].script_name, chat.name)
assert.equal(chat.workers_dev, false, 'Chat broadcast must not be publicly exposed')
assert.equal(chat.preview_urls, false)
assert.ok(chat.migrations.some(m => m.new_sqlite_classes?.includes('LiveChatRoom')))
assert.equal(fs.readFileSync('src/index.tsx', 'utf8').includes("export { LiveChatRoom }"), false)
const config = readConfig('tsconfig.json')
assert.equal(config.compilerOptions.strict, true)
assert.equal(config.compilerOptions.noEmit, true)
assert.equal(config.compilerOptions.allowImportingTsExtensions, true)
console.log('Release configuration contract passed')
