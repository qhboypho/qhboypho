function base64UrlEncode(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)

const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey))
const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)

console.log('WEB_PUSH_VAPID_PUBLIC_KEY=' + base64UrlEncode(publicRaw))
console.log('WEB_PUSH_VAPID_PRIVATE_KEY=' + privateJwk.d)
console.log('WEB_PUSH_VAPID_SUBJECT=mailto:admin@boypho.local')
