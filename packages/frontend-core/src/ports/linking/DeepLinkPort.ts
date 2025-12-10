/**
 * @fileoverview Deep Link Port - Interface for deep linking operations
 * @summary Platform-agnostic deep linking abstraction
 * @description Defines a contract for handling deep links and URL navigation
 * across web (window.location) and mobile (expo-linking/React Native Linking) platforms.
 */

/**
 * @description Interface for deep linking operations.
 * Implementations should handle platform-specific URL and navigation APIs.
 */
export interface DeepLinkPort {
  /**
   * @description Gets the initial URL that opened the app (if launched via deep link).
   * @returns Promise that resolves to the initial URL, or null if not launched via link
   */
  getInitialUrl(): Promise<string | null>;

  /**
   * @description Adds a listener for deep link events.
   * @param callback Function to call when a deep link is received
   * @returns Unsubscribe function to remove the listener
   */
  addListener(callback: (url: string) => void): () => void;

  /**
   * @description Opens a URL in the default browser or app.
   * @param url URL to open
   * @returns Promise that resolves when the URL is opened
   */
  openUrl(url: string): Promise<void>;
}

