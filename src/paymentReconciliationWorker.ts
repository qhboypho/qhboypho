import type { AppBindings } from './types/app'
import { reconcilePendingPayments } from './lib/paymentHelpers'

type PaymentReconciliationEnv = Pick<AppBindings,
  'DB' | 'PAYOS_CLIENT_ID' | 'PAYOS_API_KEY' | 'PAYOS_CHECKSUM_KEY' |
  'ZALOPAY_APP_ID' | 'ZALOPAY_KEY1' | 'ZALOPAY_KEY2' |
  'ZALOPAY_QUERY_ENDPOINT' | 'MOMO_PARTNER_CODE' | 'MOMO_ACCESS_KEY' |
  'MOMO_SECRET_KEY' | 'MOMO_QUERY_ENDPOINT'>

// Pages does not run scheduled handlers. Deploy this separate, non-public
// Worker only after the payment migrations and provider configuration exist.
export default {
  async scheduled(_controller: ScheduledController, env: PaymentReconciliationEnv) {
    const result = await reconcilePendingPayments(env.DB, env, 25)
    // Keep transaction references, customer information and credentials out of logs.
    console.log('payment-reconciliation', {
      scanned: result.scanned,
      paid: result.paid,
      pending: result.pending,
      failed: result.failed,
    })
    if (result.failed > 0) {
      throw new Error(`Payment reconciliation failed for ${result.failed} order(s); inspect the payment review queue`)
    }
  },
} satisfies ExportedHandler<PaymentReconciliationEnv>
