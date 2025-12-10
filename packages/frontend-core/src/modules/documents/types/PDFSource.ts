/**
 * @fileoverview PDF Source - Types for PDF document sources
 * @summary Type definitions for PDF input sources
 * @description Defines types for representing PDF documents from various sources
 * (ArrayBuffer, Uint8Array, base64 string) to ensure type safety across the module.
 */

/**
 * @description Union type for PDF document sources.
 * Represents all valid formats for PDF input data.
 */
export type PDFSource = ArrayBuffer | Uint8Array | string;

/**
 * @description Type guard to check if a value is a valid PDF source.
 * @param value Value to check
 * @returns True if value is a valid PDF source
 */
export function isPDFSource(value: unknown): value is PDFSource {
  return (
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array ||
    (typeof value === 'string' && value.length > 0)
  );
}

