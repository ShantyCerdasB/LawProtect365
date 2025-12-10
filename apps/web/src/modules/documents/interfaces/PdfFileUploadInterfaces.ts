/**
 * @fileoverview PDF File Upload Interfaces - Types for PDF file upload hook
 * @summary Type definitions for PDF file upload state and handlers
 * @description
 * Defines interfaces used by the web-specific PDF file upload hook that manages
 * file selection and conversion to ArrayBuffer. These interfaces are web-specific.
 */

/**
 * @description Result of the usePdfFileUpload hook.
 */
export interface UsePdfFileUploadResult {
  /** Selected PDF file, or null if no file selected */
  pdfFile: File | null;
  /** PDF file as ArrayBuffer, or null if no file selected */
  pdfSource: ArrayBuffer | null;
  /** Handler for file input change events */
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Clears the selected file and source */
  clearFile: () => void;
}

