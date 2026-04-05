import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()

async function read(relativePath) {
  return fs.readFile(path.join(cwd, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const helperPath = 'src/lib/userSessionHelpers.ts'
const authPath = 'src/routes/authRoutes.ts'
const orderPath = 'src/routes/orderRoutes.ts'
const paymentPath = 'src/routes/paymentRoutes.ts'
const adminHelperPath = 'src/lib/adminHelpers.ts'
const appTypesPath = 'src/types/app.ts'

const [helper, auth, order, payment, adminHelpers, appTypes] = await Promise.all([
  read(helperPath).catch(() => ''),
  read(authPath),
  read(orderPath),
  read(paymentPath),
  read(adminHelperPath),
  read(appTypesPath).catch(() => ''),
])

assert(helper.includes("getSignedCookie") || helper.includes("setSignedCookie"), 'Expected user session helper to use signed cookies')
assert(helper.includes('getUserSessionUserId'), 'Expected helper to export getUserSessionUserId')
assert(helper.includes('setUserSessionCookie'), 'Expected helper to export setUserSessionCookie')
assert(helper.includes('clearUserSessionCookie'), 'Expected helper to export clearUserSessionCookie')
assert(helper.includes('getOrCreateUserSessionSecret'), 'Expected helper to manage a persisted signing secret')

for (const [label, source] of [
  ['authRoutes', auth],
  ['orderRoutes', order],
  ['paymentRoutes', payment],
  ['adminHelpers', adminHelpers],
]) {
  assert(!source.includes("getCookie(c, 'user_id')"), `Expected ${label} to stop reading raw user_id cookie`)
}

assert(auth.includes('getUserSessionUserId'), 'Expected authRoutes to use getUserSessionUserId')
assert(auth.includes('setUserSessionCookie'), 'Expected authRoutes to use setUserSessionCookie')
assert(order.includes('getUserSessionUserId'), 'Expected orderRoutes to use getUserSessionUserId')
assert(payment.includes('getUserSessionUserId'), 'Expected paymentRoutes to use getUserSessionUserId')
assert(adminHelpers.includes('getUserSessionUserId'), 'Expected adminHelpers to use getUserSessionUserId')
void appTypes

console.log('user session auth contract ok')
