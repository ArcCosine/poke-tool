import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock localStorage for test environment (happy-dom workaround)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    length: 0,
    key: (_index: number) => null,
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Run cleanup after each test case (e.g. clearing jsdom/happy-dom)
afterEach(() => {
  cleanup();
});
