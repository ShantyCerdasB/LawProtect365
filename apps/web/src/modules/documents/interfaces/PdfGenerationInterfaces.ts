/**
 * @fileoverview PDF Generation Interfaces - Types for PDF generation hook
 * @summary Type definitions for PDF generation and download state
 * @description
 * Defines interfaces used by the web-specific PDF generation hook that manages
 * PDF generation, download, and error states. These interfaces are web-specific.
 */

/**
 * @description Result of the usePdfGeneration hook.
 */
export interface UsePdfGenerationResult {
  /** Whether PDF is currently being generated */
  isGenerating: boolean;
  /** Error message if generation failed, or null */
  generateError: string | null;
  /** Whether generation was successful */
  generateSuccess: boolean;
  /** Generates and downloads PDF */
  generateAndDownload: (pdfBytes: Uint8Array | ArrayBuffer, filename?: string) => Promise<void>;
  /** Clears error and success states */
  clearGenerationState: () => void;
}

