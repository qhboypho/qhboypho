# Payment / order launch checklist

This checklist covers COD, PayOS bank transfer, explicitly configured manual
VietQR, order recording and shipment creation. MoMo remains hidden. Apple Pay
is not implemented. Local tests do not constitute approval of live merchant or
carrier credentials, and this change must not be deployed before verification.

## Local verification

Use Node 22 or later with `node:sqlite` support:

```powershell
npm ci
npm run test:launch
npm run build
npm audit --omit=dev --audit-level=high
npx wrangler deploy --dry-run --config wrangler.payments.jsonc
```

The launch suite uses isolated SQLite databases and mocked external providers.
Do not substitute `test:payos-local` or other historical live-provider scripts:
those may read `.dev.vars` and create provider payment sessions.

## Release sequence — requires explicit production approval

1. Export/backup production D1 and record the current Pages deployment version.
   Keep the backup private; it contains customer and order data.
2. Rehearse **all pending migrations** on a staging copy, including the new
   0031–0034 order, payment, shipping and audit migrations. Do not copy or expose
   production customer data in a public staging environment.
3. Check old orders separately. New inventory reservation markers deliberately
   do not claim that historical orders reserved inventory. Audit existing stock
   before selling it. Failed delivery is not proof that stock has returned.
4. Use a maintenance window to pause new checkout/order mutations, apply the
   migrations, deploy the matching Pages bundle, and verify it before reopening.
   Do not leave old order-creation code writing alongside the new reservation
   and voucher triggers.
5. Verify merchant settings and the registered webhook URL using an authorized
   payment-settings administrator. The webhook must reach the production site
   at `/api/payments/payos/webhook` over HTTPS. Optionally set
   `PAYOS_WEBHOOK_URL` to that exact URL.
6. Deploy the separate scheduler only after migration and application checks.
   `wrangler.payments.jsonc` binds to the same D1 database and schedules a
   bounded reconciliation pass every five minutes. It has no public HTTP route.
   A Pages deployment alone does **not** deploy this Worker or run its cron.
7. Verify a real, low-value transaction and a carrier sandbox/test shipment with
   the owner present. Do not issue real payments, refunds or shipments merely to
   make an automated test pass.

## Configuration

- PayOS requires `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
  Keep these server-side, out of the frontend bundle and source control.
- Pages secrets do not automatically become secrets on the separate scheduler.
  Configure the scheduler with the same PayOS credentials, or verify the app's
  shared runtime settings are populated correctly. Never paste keys into this
  document or a support screenshot.
- Manual QR is an explicit `BANK_TRANSFER_PROVIDER=MANUAL_VIETQR` choice, not a
  fallback for a failed PayOS request. Configure and independently verify
  `MANUAL_VIETQR_BANK_ID`, `MANUAL_VIETQR_ACCOUNT_NO`, and
  `MANUAL_VIETQR_ACCOUNT_NAME` before enabling it. The optional template is
  `MANUAL_VIETQR_TEMPLATE`.
- A manual transfer requires an operator to verify actual bank receipt and
  record the amount and unique bank reference. The customer's success screen,
  screenshot, redirect URL or “I have paid” message is not payment evidence.

## Live acceptance checks

- A guest can retry a lost checkout response without creating a second order;
  the order access token survives the return from hosted payment.
- The exact signed PayOS webhook confirms the matching order once. A forged,
  insufficient, unrelated or duplicate callback does not double-process it.
- Closing the tab or losing the webhook does not lose the order; server-side
  reconciliation can recover the payment. Inspect scheduler invocation logs.
- Unpaid online orders are visible to the shop but cannot become COD shipments.
  Paid online orders must send a zero collection amount to the carrier.
- Duplicate/concurrent shipment requests create at most one external shipment.
  A timeout or lost response is put into reconciliation, not blindly retried.
- Cancellation never silently leaves a carrier shipment active. If a provider
  cannot be safely cancelled through the integration, resolve it on the carrier
  system first; do not force a local status to make the warning disappear.
- A payment received after cancellation is visible for review/refund handling;
  it must not resurrect fulfilment automatically. Refunds require a separate
  verified operator action on the payment/bank system.
- Verify the changed order filters, payment states and checkout retry flow in
  desktop and mobile browsers, including blocked popups and network failure.

## Recovery

If validation fails, pause checkout and shipment mutations and disable the new
scheduler before investigating. Do not drop the new audit tables or restore a
stale database over newly received payments. Reconcile external payment and
carrier records before replaying any operation. Restoring an old Pages bundle
alone is not a safe rollback once the new database triggers are installed:
prefer a forward fix, or restore a coordinated database/application snapshot
only after accounting for all post-snapshot transactions.

## Existing checks outside this change

The main Pages local runner currently rejects the inline `LiveChatRoom`
Durable Object because the generated Pages bundle does not export that class.
The payment scheduler dry-run does not prove the Pages deployment configuration
is valid. Verify/fix the Pages and Durable Object deployment arrangement on
staging before launch; the browser checks use an isolated Vite/D1 adapter.

SPX shipment creation/labels remain explicitly unimplemented. GHN/SPX cancellation
requires carrier-side reconciliation where an automated cancellation connector
is unavailable. Do not advertise these capabilities as fully automated.

The repository's full TypeScript check has pre-existing errors in unrelated
live-chat, product/flash-sale and marketplace modules. The historical
`test:admin-source-contract` also expects an `adminOrderNotifyButton` absent in
the baseline UI. Do not describe the entire repository as green merely because
the narrower launch suite passes; these require separate triage.
