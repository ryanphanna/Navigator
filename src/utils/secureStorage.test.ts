import './test-setup-bun';
import { setSecureItem, getSecureItem, migrateToSecureStorage, getMasterKey } from './secureStorage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const store = new Map();
    const mockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn().mockImplementation((key) => {
            const req: any = { onsuccess: null, result: store.get(key) };
            setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
            return req;
          }),
          put: vi.fn().mockImplementation((val, key) => {
            store.set(key, val);
            const req: any = { onsuccess: null };
            setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
            return req;
          }),
        })
      }),
      close: vi.fn()
    };

    // Cast window.indexedDB to any to avoid type errors on mocks
    const idb = window.indexedDB as any;
    idb.open.mockImplementation(() => {
      const req: any = {
        onupgradeneeded: null,
        onsuccess: null,
        result: mockDB
      };
      setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
      return req;
    });
  });

  describe('setSecureItem and getSecureItem', () => {
    it('should encrypt and store a value using IndexedDB master key', async () => {
      const key = 'test_key';
      const value = 'secret_value';

      await setSecureItem(key, value);

      const retrieved = await getSecureItem(key);
      expect(retrieved).toBe(value);

      expect(localStorage.getItem('jobfit_secure_test_key')).toBeTruthy();
      expect(localStorage.getItem('jobfit_secure_test_key')).not.toBe(value);
    });

    it('should migrate legacy key from localStorage to IndexedDB', async () => {
      const legacyKey = 'dGhpcyBpcyBhIDMyIGJ5dGUgcmFuZG9tIGtleS4uLg=='; // base64
      localStorage.setItem('jobfit_master_key_v1', legacyKey);

      await getMasterKey();

      // Should be removed from localStorage
      expect(localStorage.getItem('jobfit_master_key_v1')).toBeNull();
      // Should have opened IndexedDB
      expect(window.indexedDB.open).toHaveBeenCalled();
    });
  });

  describe('security', () => {
    it('should generate non-extractable keys', async () => {
      const spy = vi.spyOn(crypto.subtle, 'generateKey');

      await getMasterKey();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM' }),
        false, // extractable
        ['encrypt', 'decrypt']
      );
    });

    it('should not store master key in localStorage anymore', async () => {
      await setSecureItem('test', 'data');
      expect(localStorage.getItem('jobfit_master_key_v1')).toBeNull();
    });
  });

  describe('migration', () => {
    it('should migrate unencrypted items', async () => {
      localStorage.setItem('old_data', 'plain_text');
      await migrateToSecureStorage('old_data', 'new_secure_data');

      expect(localStorage.getItem('old_data')).toBeNull();
      const retrieved = await getSecureItem('new_secure_data');
      expect(retrieved).toBe('plain_text');
    });
  });
});
