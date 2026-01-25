import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Web Crypto API for tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: vi.fn(async () => new ArrayBuffer(32)),
      importKey: vi.fn(async () => ({} as CryptoKey)),
      encrypt: vi.fn(async (_algo, _key, data) => {
        // Simple mock: just return the data with a prefix
        const prefix = new TextEncoder().encode('encrypted:');
        const combined = new Uint8Array(prefix.length + (data as ArrayBuffer).byteLength);
        combined.set(prefix);
        combined.set(new Uint8Array(data as ArrayBuffer), prefix.length);
        return combined.buffer;
      }),
      decrypt: vi.fn(async (_algo, _key, data) => {
        // Simple mock: remove the prefix
        const prefix = new TextEncoder().encode('encrypted:');
        return (data as ArrayBuffer).slice(prefix.length);
      }),
    },
  },
});
