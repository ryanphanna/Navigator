/**
 * Secure Storage Utility using Web Crypto API
 * Encrypts sensitive data before storing in localStorage
 */

const STORAGE_PREFIX = 'jobfit_secure_';
const MASTER_KEY_STORAGE_NAME = 'jobfit_master_key_v1';
const ENCRYPTION_ALGORITHM = 'AES-GCM';

/**
 * Gets or creates the master encryption key
 * This key is randomly generated and stored in localStorage
 */
export async function getMasterKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem(MASTER_KEY_STORAGE_NAME);

  if (storedKey) {
    try {
      const binaryKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        'raw',
        binaryKey,
        { name: ENCRYPTION_ALGORITHM },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.error('Failed to import master key, regenerating:', e);
    }
  }

  // Generate new random key
  const newKey = crypto.getRandomValues(new Uint8Array(32));
  const base64Key = btoa(String.fromCharCode(...newKey));

  localStorage.setItem(MASTER_KEY_STORAGE_NAME, base64Key);

  return crypto.subtle.importKey(
    'raw',
    newKey,
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
    const key = await getMasterKey();
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
async function decrypt(encryptedData: string, key?: CryptoKey): Promise<string> {
  try {
    const decryptionKey = key || await getMasterKey();

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
      decryptionKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    // We intentionally do not log here to allow silent failover in migration logic
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
    // Try decrypting with master key first
    return await decrypt(encrypted);
  } catch (error) {
    // Decryption failed. Data is likely corrupted or key is lost.
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
