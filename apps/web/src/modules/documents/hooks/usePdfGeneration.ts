/**
 * @fileoverview Use PDF Generation - Hook for managing PDF generation and download state
 * @summary React hook for managing PDF generation, download, and error states
 * @description
 * Manages state for PDF generation including loading state, success/error messages,
 * and download functionality. This is a web-specific hook that uses browser download APIs.
 */

import { useState, useCallback } from 'react';
import { downloadPdfFile } from '../utils/downloadPdfFile';
import type { UsePdfGenerationResult } from '../interfaces';

/**
 * @description Hook for managing PDF generation and download.
 * @returns PDF generation state and handlers
 */
export function usePdfGeneration(): UsePdfGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  /**
   * @description Generates and downloads PDF file.
   * @param pdfBytes PDF file as Uint8Array or ArrayBuffer
   * @param filename Optional filename for the download
   */
  const generateAndDownload = useCallback(async (pdfBytes: Uint8Array | ArrayBuffer, filename?: string) => {
    setIsGenerating(true);
    setGenerateError(null);
    setGenerateSuccess(false);

    try {
      downloadPdfFile(pdfBytes, filename);
      setGenerateSuccess(true);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * @description Clears error and success states.
   */
  const clearGenerationState = useCallback(() => {
    setGenerateError(null);
    setGenerateSuccess(false);
  }, []);

  return {
    isGenerating,
    generateError,
    generateSuccess,
    generateAndDownload,
    clearGenerationState,
  };
}

