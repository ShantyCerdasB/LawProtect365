/**
 * @fileoverview PayloadExtractor - Utility for extracting values from event payloads
 * @summary Provides type-safe extraction methods for event payloads and metadata
 * @description This utility class provides common methods for extracting and validating
 * values from event payloads and metadata objects. Used by mappers and strategies.
 */

/**
 * Utility class for extracting values from event payloads and metadata
 * 
 * Provides type-safe extraction methods that handle undefined values
 * and type checking consistently across the domain.
 */
export class PayloadExtractor {
  /**
   * @description Extracts string value from object
   * @param {Record<string, unknown>} obj - Object to extract from
   * @param {string} key - Key to extract
   * @returns {string | undefined} String value or undefined
   */
  static extractString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * @description Extracts number value from object
   * @param {Record<string, unknown>} obj - Object to extract from
   * @param {string} key - Key to extract
   * @returns {number | undefined} Number value or undefined
   */
  static extractNumber(obj: Record<string, unknown>, key: string): number | undefined {
    const value = obj[key];
    return typeof value === 'number' ? value : undefined;
  }

  /**
   * @description Extracts boolean value from object
   * @param {Record<string, unknown>} obj - Object to extract from
   * @param {string} key - Key to extract
   * @returns {boolean | undefined} Boolean value or undefined
   */
  static extractBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
    const value = obj[key];
    return typeof value === 'boolean' ? value : undefined;
  }

  /**
   * @description Extracts metadata from payload as a safe object
   * @param {Record<string, unknown>} payload - Event payload
   * @returns {Record<string, unknown>} Payload metadata or empty object
   */
  static extractPayloadMetadata(payload: Record<string, unknown>): Record<string, unknown> {
    return (payload.metadata as Record<string, unknown> | undefined) || {};
  }
}

