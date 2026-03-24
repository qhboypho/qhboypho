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

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
