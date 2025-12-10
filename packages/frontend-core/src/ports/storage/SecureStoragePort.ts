/**
 * @fileoverview Secure Storage Port - Interface for secure key-value storage
 * @summary Platform-agnostic secure storage abstraction for sensitive data
 * @description Defines a contract for storing sensitive data (tokens, credentials)
 * with platform-specific encryption. Web uses sessionStorage or in-memory encryption,
 * mobile uses SecureStore/Keychain.
 */

/**
 * @description Interface for secure storage of sensitive data.
 * Implementations should use platform-native secure storage mechanisms.
 */
export interface SecureStoragePort {
  /**
   * @description Retrieves a secure value by key from encrypted storage.
   * @param key Storage key identifier
   * @returns Decrypted string value, or null if not found
   */
  getSecure(key: string): Promise<string | null>;

  /**
   * @description Stores a value securely with encryption.
   * @param key Storage key identifier
   * @param value String value to encrypt and store
   * @returns Promise that resolves when secure storage is complete
   */
  setSecure(key: string, value: string): Promise<void>;

  /**
   * @description Removes a secure value by key.
   * @param key Storage key identifier
   * @returns Promise that resolves when removal is complete
   */
  removeSecure(key: string): Promise<void>;
}

