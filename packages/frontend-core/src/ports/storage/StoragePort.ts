/**
 * @fileoverview Storage Port - Interface for key-value storage operations
 * @summary Platform-agnostic storage abstraction for web and mobile
 * @description Defines a contract for storing and retrieving data locally,
 * allowing different implementations for web (localStorage) and mobile (AsyncStorage).
 */

/**
 * @description Interface for key-value storage operations.
 * Implementations should handle serialization/deserialization of values.
 */
export interface StoragePort {
  /**
   * @description Retrieves a value by key from storage.
   * @param key Storage key identifier
   * @returns Parsed value of type T, or null if not found
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * @description Stores a value with the given key.
   * @param key Storage key identifier
   * @param value Value to store (will be serialized)
   * @returns Promise that resolves when storage is complete
   */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * @description Removes a value by key from storage.
   * @param key Storage key identifier
   * @returns Promise that resolves when removal is complete
   */
  remove(key: string): Promise<void>;

  /**
   * @description Clears all stored values.
   * @returns Promise that resolves when clearing is complete
   */
  clear(): Promise<void>;
}

