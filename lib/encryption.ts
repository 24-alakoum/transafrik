/**
 * Chiffrement AES-256-GCM pour les données PII sensibles.
 * Utilisé pour : numéro permis, date de naissance, ID national des chauffeurs.
 * SERVEUR UNIQUEMENT — jamais importé côté client.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits pour AES-GCM

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY is not defined')
  if (key.length !== 64) throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  return key
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = Buffer.from(hexKey, 'hex')
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM, length: KEY_LENGTH }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Chiffre une chaîne en AES-256-GCM.
 * Retourne une chaîne base64 contenant IV + données chiffrées.
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return ''

  const key = await importKey(getEncryptionKey())
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded)

  // Combiner IV + ciphertext
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)

  return Buffer.from(combined).toString('base64')
}

/**
 * Déchiffre une chaîne chiffrée avec encrypt().
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return ''

  const key = await importKey(getEncryptionKey())
  const combined = Buffer.from(ciphertext, 'base64')

  const iv = combined.slice(0, IV_LENGTH)
  const data = combined.slice(IV_LENGTH)

  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)

  return new TextDecoder().decode(decrypted)
}

/**
 * Vérifie si une chaîne est chiffrée (base64 valide avec longueur minimale).
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 20) return false
  try {
    const decoded = Buffer.from(value, 'base64')
    return decoded.length > IV_LENGTH
  } catch {
    return false
  }
}
