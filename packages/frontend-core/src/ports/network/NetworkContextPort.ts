/**
 * @fileoverview Network Context Port - Interface for network context information
 * @summary Platform-agnostic network context abstraction
 * @description Defines a contract for retrieving network context (IP, country, user agent)
 * across web (browser APIs, geolocation services) and mobile (native APIs) platforms.
 */

import type { NetworkContext } from '../../foundation/http/types';

/**
 * @description Interface for network context operations.
 * Implementations should retrieve platform-specific network information.
 */
export interface NetworkContextPort {
  /**
   * @description Gets the client IP address if available.
   * @returns Promise that resolves to the IP address, or undefined if unavailable
   */
  getIp(): Promise<string | undefined>;

  /**
   * @description Gets the client country code (ISO alpha-2) if available.
   * @returns Promise that resolves to the country code, or undefined if unavailable
   */
  getCountry(): Promise<string | undefined>;

  /**
   * @description Gets the client user agent string if available.
   * @returns Promise that resolves to the user agent, or undefined if unavailable
   */
  getUserAgent(): Promise<string | undefined>;

  /**
   * @description Gets the complete network context (IP, country, user agent).
   * @returns Promise that resolves to the network context, or undefined if unavailable
   */
  getContext(): Promise<NetworkContext | undefined>;
}

