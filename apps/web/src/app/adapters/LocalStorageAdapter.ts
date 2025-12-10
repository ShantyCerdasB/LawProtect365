/**
 * @fileoverview LocalStorage Adapter - Web implementation of StoragePort
 * @summary Adapts browser localStorage to the StoragePort interface
 * @description
 * This adapter is web-specific infrastructure that implements the platform-agnostic
 * `StoragePort` defined in `@lawprotect/frontend-core`. It can be replaced by other
 * implementations (e.g., IndexedDB) without changing core logic.
 */

import type { StoragePort } from '@lawprotect/frontend-core';

/**
 * @description LocalStorage-based implementation of StoragePort for the web app.
 */
export class LocalStorageAdapter implements StoragePort {
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  }

  async remove(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    window.localStorage.clear();
  }
}


