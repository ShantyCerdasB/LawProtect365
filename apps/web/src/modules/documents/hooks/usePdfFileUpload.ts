/**
 * @fileoverview Use PDF File Upload - Hook for handling PDF file uploads
 * @summary React hook for managing PDF file upload state
 * @description
 * Manages state for PDF file uploads including file selection, conversion to ArrayBuffer,
 * and clearing state. This is a web-specific hook that uses the File API.
 */

import { useState, useCallback } from 'react';
import type { UsePdfFileUploadResult } from '../interfaces';

/**
 * @description Hook for managing PDF file uploads.
 * @returns File upload state and handlers
 */
export function usePdfFileUpload(): UsePdfFileUploadResult {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfSource, setPdfSource] = useState<ArrayBuffer | null>(null);

  /**
   * @description Handles file input change event.
   * @param event File input change event
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      setPdfSource(arrayBuffer);
    }
  }, []);

  /**
   * @description Clears the selected file and source.
   */
  const clearFile = useCallback(() => {
    setPdfFile(null);
    setPdfSource(null);
  }, []);

  return {
    pdfFile,
    pdfSource,
    handleFileUpload,
    clearFile,
  };
}

