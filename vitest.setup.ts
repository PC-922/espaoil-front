import { beforeEach, vi } from 'vitest';

// Node.js v22+ exposes a native localStorage/sessionStorage via the webstorage
// module that doesn't fully implement the Web Storage spec (e.g. no .clear()).
// Stub both with in-memory implementations so tests work regardless of the
// Node.js version or jsdom environment ordering.

const createStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
    _reset: () => {
      store = {};
    },
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', sessionStorageMock);

beforeEach(() => {
  localStorageMock._reset();
  sessionStorageMock._reset();
});
