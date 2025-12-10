/**
 * @fileoverview Normalize Data URL - Utility for normalizing data URL format
 * @summary Platform-agnostic utility for normalizing image data URLs
 * @description
 * Provides a reusable function to normalize data URLs to a consistent format.
 * This is a pure function that can be used in both web and mobile applications.
 * 
 * Handles cases where:
 * - Data URL already has proper format (data:image/png;base64,...)
 * - Only base64 string is provided (adds data URL prefix)
 */

/**
 * @description Normalizes a data URL to ensure it has the proper format.
 * @param dataUrl Data URL string or base64 string
 * @returns Normalized data URL with proper prefix
 * @description
 * Ensures the data URL has the proper format. If the input already starts with 'data:',
 * it returns it as-is. Otherwise, it assumes it's a base64 string and adds the
 * 'data:image/png;base64,' prefix.
 * 
 * Example:
 * - normalizeDataUrl('data:image/png;base64,iVBORw0KG...') → 'data:image/png;base64,iVBORw0KG...'
 * - normalizeDataUrl('iVBORw0KG...') → 'data:image/png;base64,iVBORw0KG...'
 */
export function normalizeDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  return `data:image/png;base64,${dataUrl}`;
}

