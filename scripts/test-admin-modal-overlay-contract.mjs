import assert from 'node:assert/strict'
import fs from 'node:fs'

const adminScriptSource = fs.readFileSync(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const ordersScriptSource = fs.readFileSync(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const flashSaleScriptSource = fs.readFileSync(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')
const modalsSource = fs.readFileSync(new URL('../src/pages/admin/modals.ts', import.meta.url), 'utf8')

assert.match(adminScriptSource, /function showAdminOverlay\(el,\s*displayMode = 'flex'\)/, 'admin core script should expose a reusable modal show helper')
assert.match(adminScriptSource, /function openChangeAdminPasswordModal\(\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'change password button should reopen the modal after overlay sanitize')
assert.match(adminScriptSource, /async function openProductModal\(id = null\)\s*\{[\s\S]*showAdminOverlay\(document\.getElementById\('productModal'\)\)/, 'product edit/create buttons should reopen product modal after overlay sanitize')
assert.match(ordersScriptSource, /function openArrangeSuccessModal\(count,\s*failedList\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'shipping arrange success button flow should reopen its modal after overlay sanitize')
assert.match(ordersScriptSource, /function closeOrderDetailModal\(\)\s*\{[\s\S]*forceHideAdminOverlay\(document\.getElementById\('orderDetailModal'\)\)/, 'order detail modal should close via the shared overlay hide helper')
assert.match(ordersScriptSource, /function showOrderDetail\(id\)\s*\{[\s\S]*showAdminOverlay\(document\.getElementById\('orderDetailModal'\)\)/, 'order detail button should reopen order detail modal after overlay sanitize')
assert.ok(modalsSource.includes('onclick="if(event.target === this) closeOrderDetailModal()"'), 'order detail backdrop should use the shared close helper')
assert.ok(modalsSource.includes('onclick="closeOrderDetailModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"'), 'order detail close button should use the shared close helper')
assert.ok(modalsSource.includes('id="adminChangePasswordModal"') && modalsSource.includes('class="fixed inset-0 modal-overlay z-50 hidden items-start justify-center p-4 overflow-y-auto"'), 'change password modal should start hidden so overlay sanitize does not mis-detect it as open on admin bootstrap')
assert.match(flashSaleScriptSource, /function openFlashSaleProductPickerModal\(\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'flashsale product picker button should reopen its modal after overlay sanitize')
assert.match(flashSaleScriptSource, /function openFlashSaleCreateModal\(\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'flashsale create button should reopen create modal after overlay sanitize')
assert.match(flashSaleScriptSource, /async function openFlashSaleEditModal\(id\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'flashsale edit button should reopen create modal in edit mode after overlay sanitize')
assert.match(flashSaleScriptSource, /async function openFlashSaleDuplicateModal\(id\)\s*\{[\s\S]*showAdminOverlay\(modal\)/, 'flashsale duplicate button should reopen create modal in duplicate mode after overlay sanitize')

console.log('admin modal overlay contract passed')
