/**
 * Secure Storage Utility using Web Crypto API
 * Encrypts sensitive data before storing in localStorage
 */

const STORAGE_PREFIX = 'jobfit_secure_';
const ENCRYPTION_ALGORITHM = 'AES-GCM';

/**
 * Generates a device-specific encryption key
 * This key is derived from browser fingerprint + user session
 * Note: This provides obfuscation, not military-grade security
 * For true security, API keys should be stored server-side only
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Create a stable fingerprint from browser/device characteristics
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.colorDepth.toString(),
    screen.width.toString() + 'x' + screen.height.toString()
  ].join('|');

  // Convert fingerprint to crypto key
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ENCRYPTION_ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string value using AES-GCM
 */
async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an encrypted string value
 */
async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Securely stores a value in localStorage with encryption
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value);
  localStorage.setItem(STORAGE_PREFIX + key, encrypted);
}

/**
 * Retrieves and decrypts a value from localStorage
 */
export async function getSecureItem(key: string): Promise<string | null> {
  const encrypted = localStorage.getItem(STORAGE_PREFIX + key);
  if (!encrypted) return null;

  try {
    return await decrypt(encrypted);
  } catch (error) {
    // If decryption fails, remove corrupted data
    console.error('Failed to decrypt stored data:', error);
    localStorage.removeItem(STORAGE_PREFIX + key);
    return null;
  }
}

/**
 * Removes a secure item from storage
 */
export function removeSecureItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Migrates an existing unencrypted item to encrypted storage
 */
export async function migrateToSecureStorage(oldKey: string, newKey: string): Promise<void> {
  const value = localStorage.getItem(oldKey);
  if (value) {
    await setSecureItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
}
