import type { AppBindings } from '../types/app'

type ProductAssetBucket = NonNullable<AppBindings['PRODUCT_IMAGES']>
type ProductAssetPutValue = Parameters<ProductAssetBucket['put']>[1]
type ProductAssetPutOptions = Parameters<ProductAssetBucket['put']>[2]
type ProductAssetObject = Awaited<ReturnType<ProductAssetBucket['get']>>

const MEDIA_PREFIX = '/media/'

export function getProductAssetBucket(env: AppBindings): ProductAssetBucket | null {
  return env.PRODUCT_IMAGES || null
}

export function normalizeProductAssetKey(value: string): string {
  return String(value || '').trim().replace(/^\/+/, '')
}

export function isUnsafeProductAssetKey(key: string): boolean {
  return !key || key.includes('..') || key.includes('\\') || key.startsWith('/')
}

export function buildPublicAssetUrl(env: AppBindings, key: string): string {
  const cleanKey = normalizeProductAssetKey(key)
  const base = String(env.PRODUCT_IMAGES_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '')
  if (base) return `${base}/${cleanKey}`
  return `${MEDIA_PREFIX}${cleanKey}`
}

export function productAssetKeyFromUrl(rawUrl: string): string {
  const value = String(rawUrl || '').trim()
  if (!value) return ''
  if (value.startsWith(MEDIA_PREFIX)) {
    return normalizeProductAssetKey(decodeURIComponent(value.slice(MEDIA_PREFIX.length)))
  }
  try {
    const parsed = new URL(value)
    if (parsed.pathname.startsWith(MEDIA_PREFIX)) {
      return normalizeProductAssetKey(decodeURIComponent(parsed.pathname.slice(MEDIA_PREFIX.length)))
    }
  } catch {
    // not an absolute URL
  }
  return ''
}

export async function readProductAssetObject(env: AppBindings, key: string): Promise<ProductAssetObject | null> {
  const bucket = getProductAssetBucket(env)
  const cleanKey = normalizeProductAssetKey(key)
  if (!bucket || isUnsafeProductAssetKey(cleanKey)) return null
  return bucket.get(cleanKey)
}

export async function writeProductAssetObject(
  env: AppBindings,
  key: string,
  value: ProductAssetPutValue,
  options?: ProductAssetPutOptions
): Promise<boolean> {
  const bucket = getProductAssetBucket(env)
  const cleanKey = normalizeProductAssetKey(key)
  if (!bucket || isUnsafeProductAssetKey(cleanKey)) return false
  await bucket.put(cleanKey, value, options)
  return true
}
