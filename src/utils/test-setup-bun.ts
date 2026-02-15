
// Mock localStorage
const store = new Map<string, string>();

if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index: number) => Array.from(store.keys())[index] || null,
  } as Storage;
}

// Mock Navigator
if (typeof global.navigator === 'undefined') {
  // @ts-ignore
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Test Browser; Linux x86_64)',
    language: 'en-US',
  } as Navigator;
}

// Mock Screen
if (typeof global.screen === 'undefined') {
  // @ts-ignore
  global.screen = {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  } as Screen;
}
