/**
 * Cache interface with basic and batch operations.
 */
export interface CachePort {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;
  mset<T = unknown>(entries: Array<{ key: string; value: T; ttlSeconds?: number }>): Promise<void>;
}

/**
 * Distributed lock interface.
 */
export interface LockPort {
  acquire(key: string, ttlMs: number, owner?: string): Promise<boolean>;
  release(key: string, owner?: string): Promise<void>;
  renew?(key: string, ttlMs: number, owner?: string): Promise<void>;
}
