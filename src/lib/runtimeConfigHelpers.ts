const RUNTIME_CONFIG_KEYS = {
  GOOGLE_CLIENT_ID: 'google_client_id',
  GOOGLE_CLIENT_SECRET: 'google_client_secret',
  GOOGLE_REDIRECT_URI: 'google_redirect_uri',
  TURNSTILE_SITE_KEY: 'turnstile_site_key',
  TURNSTILE_SECRET_KEY: 'turnstile_secret_key',
  CASSO_SECURE_TOKEN: 'casso_secure_token',
  BANK_TRANSFER_PROVIDER: 'bank_transfer_provider',
  MANUAL_VIETQR_BANK_ID: 'manual_vietqr_bank_id',
  MANUAL_VIETQR_ACCOUNT_NO: 'manual_vietqr_account_no',
  MANUAL_VIETQR_ACCOUNT_NAME: 'manual_vietqr_account_name',
  MANUAL_VIETQR_TEMPLATE: 'manual_vietqr_template',
  PAYOS_CLIENT_ID: 'payos_client_id',
  PAYOS_API_KEY: 'payos_api_key',
  PAYOS_CHECKSUM_KEY: 'payos_checksum_key',
  ZALOPAY_APP_ID: 'zalopay_app_id',
  ZALOPAY_KEY1: 'zalopay_key1',
  ZALOPAY_KEY2: 'zalopay_key2',
  ZALOPAY_CREATE_ENDPOINT: 'zalopay_create_endpoint',
  ZALOPAY_QUERY_ENDPOINT: 'zalopay_query_endpoint',
  ZALOPAY_CALLBACK_URL: 'zalopay_callback_url',
  MOMO_PARTNER_CODE: 'momo_partner_code',
  MOMO_ACCESS_KEY: 'momo_access_key',
  MOMO_SECRET_KEY: 'momo_secret_key',
  MOMO_IPN_URL: 'momo_ipn_url',
  MOMO_CREATE_ENDPOINT: 'momo_create_endpoint',
  MOMO_QUERY_ENDPOINT: 'momo_query_endpoint',
  GHTK_TOKEN: 'ghtk_token',
  GHTK_CLIENT_SOURCE: 'ghtk_client_source',
  GHTK_PICK_ADDRESS_ID: 'ghtk_pick_address_id',
  GHTK_PICK_NAME: 'ghtk_pick_name',
  GHTK_PICK_ADDRESS: 'ghtk_pick_address',
  GHTK_PICK_PROVINCE: 'ghtk_pick_province',
  GHTK_PICK_DISTRICT: 'ghtk_pick_district',
  GHTK_PICK_WARD: 'ghtk_pick_ward',
  GHTK_PICK_TEL: 'ghtk_pick_tel',
  SPX_USER_ID: 'spx_user_id',
  SPX_SECRET_KEY: 'spx_secret_key',
  SPX_ACCOUNT_ID: 'spx_account_id',
  SPX_CREATE_ORDER_ENDPOINT: 'spx_create_order_endpoint',
  SPX_LABEL_ENDPOINT: 'spx_label_endpoint',
  GHN_TOKEN: 'ghn_token',
  GHN_SHOP_ID: 'ghn_shop_id',
  GHN_CLIENT_ID: 'ghn_client_id',
  GHN_DEFAULT_WEIGHT_GRAM: 'ghn_default_weight_gram',
  GHN_DEFAULT_LENGTH_CM: 'ghn_default_length_cm',
  GHN_DEFAULT_WIDTH_CM: 'ghn_default_width_cm',
  GHN_DEFAULT_HEIGHT_CM: 'ghn_default_height_cm',
  NHANH_APP_ID: 'nhanh_app_id',
  NHANH_SECRET_KEY: 'nhanh_secret_key',
  NHANH_BUSINESS_ID: 'nhanh_business_id',
  NHANH_ACCESS_TOKEN: 'nhanh_access_token'
} as const

type RuntimeConfigKey = keyof typeof RUNTIME_CONFIG_KEYS

/** Runtime-config consumers need only these optional string variables. */
export type RuntimeConfigEnv = Partial<Record<RuntimeConfigKey, string | undefined>>

function getEnvValue(env: RuntimeConfigEnv, envKey: RuntimeConfigKey) {
  return String(env[envKey] || '').trim()
}

async function hydrateRuntimeConfigFromEnv(db: D1Database, dbKey: string, envValue: string) {
  if (!envValue) return
  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value=CASE
        WHEN app_settings.value IS NULL OR TRIM(app_settings.value) = '' THEN excluded.value
        ELSE app_settings.value
      END,
      updated_at=CASE
        WHEN app_settings.value IS NULL OR TRIM(app_settings.value) = '' THEN CURRENT_TIMESTAMP
        ELSE app_settings.updated_at
      END
  `).bind(dbKey, envValue).run()
}

export async function getRuntimeConfigValues(
  db: D1Database,
  env: RuntimeConfigEnv,
  envKeys: RuntimeConfigKey[]
) {
  const uniqueKeys = Array.from(new Set(envKeys))
  const dbKeys = uniqueKeys.map((key) => RUNTIME_CONFIG_KEYS[key])
  const result: Record<string, string> = {}
  if (!dbKeys.length) return result

  const rows = await db.prepare(`
    SELECT key, value
    FROM app_settings
    WHERE key IN (${dbKeys.map(() => '?').join(',')})
  `).bind(...dbKeys).all()
  const map = new Map<string, string>()
  for (const row of (rows.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }

  for (const envKey of uniqueKeys) {
    const dbKey = RUNTIME_CONFIG_KEYS[envKey]
    const dbValue = String(map.get(dbKey) || '').trim()
    const envValue = getEnvValue(env, envKey)
    if (!dbValue && envValue) {
      await hydrateRuntimeConfigFromEnv(db, dbKey, envValue)
    }
    result[envKey] = dbValue || envValue
  }

  return result
}

export async function getRuntimeConfigValue(
  db: D1Database,
  env: RuntimeConfigEnv,
  envKey: RuntimeConfigKey,
  fallback = ''
) {
  const values = await getRuntimeConfigValues(db, env, [envKey])
  return values[envKey] || fallback
}
