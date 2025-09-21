/**
 * @fileoverview DocumentDownloadFormat enum - Document download format options
 * @summary Enum for document download format types
 * @description Defines the available formats for downloading documents,
 * including PDF and original format options for signed documents.
 */

/**
 * Document download format options
 * 
 * Defines the available formats when downloading documents from the system.
 * Used in download endpoints to specify the desired output format.
 */
export enum DocumentDownloadFormat {
  /**
   * Download as PDF format (default, processed)
   */
  PDF = 'pdf',
  
  /**
   * Download in original format (as uploaded/rendered)
   */
  ORIGINAL = 'original'
}
