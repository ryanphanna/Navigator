import './test-setup-bun';
import { setSecureItem, getSecureItem, removeSecureItem, getMasterKey } from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('setSecureItem and getSecureItem', () => {
    it('should encrypt and store a value', async () => {
      const key = 'test_key';
      const value = 'secret_value';

      await setSecureItem(key, value);

      // Value should be stored in localStorage with prefix
      const stored = localStorage.getItem('jobfit_secure_test_key');
      expect(stored).toBeTruthy();
      expect(stored).not.toBe(value); // Should be encrypted, not plain text
    });

    it('should decrypt and retrieve a stored value', async () => {
      const key = 'test_key';
      const value = 'secret_value';

      await setSecureItem(key, value);
      const retrieved = await getSecureItem(key);

      expect(retrieved).toBe(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await getSecureItem('non_existent_key');

      expect(result).toBeNull();
    });

    it('should handle API keys', async () => {
      const apiKey = 'AIzaSyDEMO_KEY_123456789';

      await setSecureItem('api_key', apiKey);
      const retrieved = await getSecureItem('api_key');

      expect(retrieved).toBe(apiKey);
    });

    it('should handle special characters in values', async () => {
      const value = 'Test!@#$%^&*(){}[]|\\:;"<>?,./';

      await setSecureItem('special_chars', value);
      const retrieved = await getSecureItem('special_chars');

      expect(retrieved).toBe(value);
    });

    it('should handle unicode characters', async () => {
      const value = '你好世界 🚀 émojis';

      await setSecureItem('unicode', value);
      const retrieved = await getSecureItem('unicode');

      expect(retrieved).toBe(value);
    });

    it('should handle empty string', async () => {
      await setSecureItem('empty', '');
      const retrieved = await getSecureItem('empty');

      expect(retrieved).toBe('');
    });

    it('should handle very long values', async () => {
      const value = 'x'.repeat(10000);

      await setSecureItem('long_value', value);
      const retrieved = await getSecureItem('long_value');

      expect(retrieved).toBe(value);
    });
  });

  describe('removeSecureItem', () => {
    it('should remove a stored value', async () => {
      const key = 'test_key';

      await setSecureItem(key, 'value');
      expect(await getSecureItem(key)).toBe('value');

      removeSecureItem(key);
      expect(await getSecureItem(key)).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => removeSecureItem('non_existent')).not.toThrow();
    });
  });

  describe('data isolation', () => {
    it('should keep different keys separate', async () => {
      await setSecureItem('key1', 'value1');
      await setSecureItem('key2', 'value2');

      expect(await getSecureItem('key1')).toBe('value1');
      expect(await getSecureItem('key2')).toBe('value2');
    });

    it('should not affect other localStorage items', async () => {
      localStorage.setItem('normal_key', 'normal_value');

      await setSecureItem('secure_key', 'secure_value');

      expect(localStorage.getItem('normal_key')).toBe('normal_value');
      expect(await getSecureItem('secure_key')).toBe('secure_value');
    });
  });

  describe('overwrite behavior', () => {
    it('should overwrite existing values', async () => {
      const key = 'test_key';

      await setSecureItem(key, 'old_value');
      await setSecureItem(key, 'new_value');

      expect(await getSecureItem(key)).toBe('new_value');
    });
  });

  describe('key stability', () => {
    it('should maintain access even if browser fingerprint changes', async () => {
      const key = 'stable_key';
      const value = 'stable_value';

      await setSecureItem(key, value);

      // Simulate browser change
      const originalUA = navigator.userAgent;

      // Use Object.defineProperty to ensure we can overwrite read-only property if needed
      Object.defineProperty(navigator, 'userAgent', {
        value: 'New Browser v2.0',
        configurable: true
      });

      try {
        const retrieved = await getSecureItem(key);
        expect(retrieved).toBe(value);
      } finally {
        // Restore
        Object.defineProperty(navigator, 'userAgent', {
          value: originalUA,
          configurable: true
        });
      }
    });

    it('should generate a new random key if storage is cleared (proving non-deterministic generation)', async () => {
      // 1. Generate first key
      await getMasterKey();
      const storedKey1 = localStorage.getItem('jobfit_master_key_v1');
      expect(storedKey1).toBeTruthy();

      // 2. Clear storage (simulating a fresh start or lost key)
      localStorage.clear();

      // 3. Generate second key
      await getMasterKey();
      const storedKey2 = localStorage.getItem('jobfit_master_key_v1');
      expect(storedKey2).toBeTruthy();

      // 4. Compare stored keys directly
      // If generation was deterministic (e.g. based on user agent), these would be identical.
      // Since it is random, they should be different.
      expect(storedKey1).not.toBe(storedKey2);
    });
  });
});
