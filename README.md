```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## ZaloPay local integration

Add these values to `.dev.vars`:

```txt
ZALOPAY_APP_ID="your_app_id"
ZALOPAY_KEY1="your_key1"
ZALOPAY_KEY2="your_key2"
# Optional override endpoints (sandbox defaults are used when omitted)
# ZALOPAY_CREATE_ENDPOINT="https://sb-openapi.zalopay.vn/v2/create"
# ZALOPAY_QUERY_ENDPOINT="https://sb-openapi.zalopay.vn/v2/query"
# Optional public callback URL (recommended on production)
# ZALOPAY_CALLBACK_URL="https://your-domain.com/api/payments/zalopay/callback"
```

Test local callback flow:

```txt
npm run test:zalopay-local
```

## MoMo integration

Configure the following server-side values in `.dev.vars` for sandbox and as Cloudflare Worker secrets for production. Do not expose `MOMO_SECRET_KEY` in browser code or committed files.

```txt
MOMO_PARTNER_CODE="your_partner_code"
MOMO_ACCESS_KEY="your_access_key"
MOMO_SECRET_KEY="your_secret_key"
# Must be an HTTPS endpoint reachable by MoMo. Example:
MOMO_IPN_URL="https://your-domain.com/api/payments/momo/ipn"
# Optional: sandbox defaults are used when omitted.
# MOMO_CREATE_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/create"
# MOMO_QUERY_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/query"
```

The checkout sends customers to MoMo using `captureWallet`. The IPN endpoint validates MoMo's HMAC signature, partner code, payment amount, and linked order before marking an order paid.

Verify the implementation contract with:

```txt
npm run test:momo-contract
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
