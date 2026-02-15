import './test-setup-bun';
import { getSecureItem, getLegacyEncryptionKey } from './secureStorage';

describe('secureStorage Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function createLegacyEncryptedData(keyStr: string, value: string) {
    const key = await getLegacyEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    const encrypted = btoa(String.fromCharCode(...combined));
    localStorage.setItem('jobfit_secure_' + keyStr, encrypted);
  }

  it('should migrate legacy data to master key', async () => {
    const keyName = 'legacy_item';
    const secretValue = 'my_secret_legacy_data';

    // 1. Setup: Create data encrypted with legacy key
    await createLegacyEncryptedData(keyName, secretValue);

    // Verify it's there
    expect(localStorage.getItem('jobfit_secure_' + keyName)).toBeTruthy();

    // 2. Action: Retrieve using getSecureItem (triggers migration)
    const retrieved = await getSecureItem(keyName);

    // 3. Assertion: Value is correct
    expect(retrieved).toBe(secretValue);

    // 4. Assertion: Verify retrieval works subsequent times (persistence check)
    const retrievedAgain = await getSecureItem(keyName);
    expect(retrievedAgain).toBe(secretValue);
  });
});
