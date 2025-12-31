/**
 * @fileoverview NewPdfObject - Type for new PDF objects in incremental updates
 * @summary Type definition for PDF objects added during incremental updates
 * @description
 * Represents a new PDF object to be added during incremental PDF updates.
 * Used when embedding signatures to add new objects without modifying existing content.
 */

/**
 * New PDF object to add during incremental update
 * @description
 * Represents a PDF object that will be added to the document during an incremental update.
 * The offset is calculated automatically during the update process.
 */
export interface NewPdfObject {
  /** PDF object number */
  id: number;
  /** PDF object generation number */
  generation: number;
  /** PDF object content as string */
  content: string;
  /** Byte offset in PDF (calculated during update) */
  offset: number;
}

