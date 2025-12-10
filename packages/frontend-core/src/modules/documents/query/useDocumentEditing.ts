/**
 * @fileoverview useDocumentEditing Hook - React hook for PDF document editing workflow
 * @summary Custom hook for managing document editing state and operations
 * @description
 * Provides a React hook to manage the complete document editing workflow:
 * - Managing signature, text, and date placements (add, remove, update)
 * - Applying all elements to PDF using the use-case
 * - Converting modified PDF to base64 or Uint8Array
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useState, useCallback } from 'react';
import type {
  PDFCoordinates,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../types';
import { applyElementsToPdf } from '../use-cases';
import type { UseDocumentEditingConfig, UseDocumentEditingResult } from '../interfaces';

/**
 * @description React hook for managing PDF document editing workflow.
 * @param config Configuration with PDF source
 * @returns Hook result with element management functions
 */
export function useDocumentEditing(config: UseDocumentEditingConfig): UseDocumentEditingResult {
  const { pdfSource } = config;
  const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);
  const [texts, setTexts] = useState<TextPlacement[]>([]);
  const [dates, setDates] = useState<DatePlacement[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Adds a new signature placement to the document.
   * @param signatureImage Signature image as data URL or base64 string
   * @param coordinates PDF coordinates where signature should be placed
   * @param width Optional width of the signature in PDF points
   * @param height Optional height of the signature in PDF points
   */
  const addSignature = useCallback((signatureImage: string, coordinates: PDFCoordinates, width?: number, height?: number) => {
    setSignatures((prev) => [
      ...prev,
      {
        signatureImage,
        coordinates,
        width,
        height,
      },
    ]);
    setError(null);
  }, []);

  /**
   * @description Adds a new text placement to the document.
   * @param text Text content to place on the PDF
   * @param coordinates PDF coordinates where text should be placed
   * @param fontSize Font size in PDF points (default: 12)
   */
  const addText = useCallback(
    (text: string, coordinates: PDFCoordinates, fontSize = 12) => {
      setTexts((prev) => [
        ...prev,
        {
          text,
          coordinates,
          fontSize,
        },
      ]);
      setError(null);
    },
    []
  );

  /**
   * @description Adds a new date placement to the document.
   * @param date Date object to format and place on the PDF
   * @param coordinates PDF coordinates where date should be placed
   * @param format Date format string (default: 'MM/DD/YYYY')
   * @param fontSize Font size in PDF points (default: 12)
   */
  const addDate = useCallback(
    (date: Date, coordinates: PDFCoordinates, format = 'MM/DD/YYYY', fontSize = 12) => {
      setDates((prev) => [
        ...prev,
        {
          date,
          format,
          coordinates,
          fontSize,
        },
      ]);
      setError(null);
    },
    []
  );

  /**
   * @description Removes a signature placement by index.
   * @param index Index of the signature to remove
   */
  const removeSignature = useCallback((index: number) => {
    setSignatures((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  /**
   * @description Removes a text placement by index.
   * @param index Index of the text to remove
   */
  const removeText = useCallback((index: number) => {
    setTexts((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  /**
   * @description Removes a date placement by index.
   * @param index Index of the date to remove
   */
  const removeDate = useCallback((index: number) => {
    setDates((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  /**
   * @description Updates the coordinates of a signature placement by index.
   * @param index Index of the signature to update
   * @param coordinates New PDF coordinates for the signature
   */
  const updateSignatureCoordinates = useCallback((index: number, coordinates: PDFCoordinates) => {
    setSignatures((prev) =>
      prev.map((sig, i) => (i === index ? { ...sig, coordinates } : sig))
    );
    setError(null);
  }, []);

  /**
   * @description Updates the coordinates of a text placement by index.
   * @param index Index of the text to update
   * @param coordinates New PDF coordinates for the text
   */
  const updateTextCoordinates = useCallback((index: number, coordinates: PDFCoordinates) => {
    setTexts((prev) =>
      prev.map((text, i) => (i === index ? { ...text, coordinates } : text))
    );
    setError(null);
  }, []);

  /**
   * @description Updates the coordinates of a date placement by index.
   * @param index Index of the date to update
   * @param coordinates New PDF coordinates for the date
   */
  const updateDateCoordinates = useCallback((index: number, coordinates: PDFCoordinates) => {
    setDates((prev) =>
      prev.map((date, i) => (i === index ? { ...date, coordinates } : date))
    );
    setError(null);
  }, []);

  /**
   * @description Updates the font size of a text placement by index.
   * @param index Index of the text to update
   * @param fontSize New font size in PDF points
   */
  const updateTextFontSize = useCallback((index: number, fontSize: number) => {
    setTexts((prev) =>
      prev.map((text, i) => (i === index ? { ...text, fontSize } : text))
    );
    setError(null);
  }, []);

  /**
   * @description Updates the font size of a date placement by index.
   * @param index Index of the date to update
   * @param fontSize New font size in PDF points
   */
  const updateDateFontSize = useCallback((index: number, fontSize: number) => {
    setDates((prev) =>
      prev.map((date, i) => (i === index ? { ...date, fontSize } : date))
    );
    setError(null);
  }, []);

  /**
   * @description Updates the size of a signature placement by index.
   * @param index Index of the signature to update
   * @param width New width in PDF points
   * @param height New height in PDF points
   */
  const updateSignatureSize = useCallback((index: number, width: number, height: number) => {
    setSignatures((prev) =>
      prev.map((sig, i) => (i === index ? { ...sig, width, height } : sig))
    );
    setError(null);
  }, []);

  /**
   * @description Clears all elements (signatures, texts, and dates) from the document.
   */
  const clearAll = useCallback(() => {
    setSignatures([]);
    setTexts([]);
    setDates([]);
    setError(null);
  }, []);

  /**
   * @description Applies all elements (signatures, texts, dates) to the PDF and returns as Uint8Array.
   * @returns Promise resolving to modified PDF as Uint8Array
   * @throws Error if applying elements fails
   * @description
   * Converts the PDF source to Uint8Array, applies all elements using the use-case,
   * and returns the modified PDF bytes. This method is useful when you need the raw
   * bytes for further processing or when working with file systems.
   */
  const applyElementsAsBytes = useCallback(async (): Promise<Uint8Array> => {
    setIsApplying(true);
    setError(null);

    try {
      // Convert pdfSource to Uint8Array
      let pdfBytes: Uint8Array;
      if (typeof pdfSource === 'string') {
        // Assume base64 string
        const binaryString = atob(pdfSource.includes(',') ? pdfSource.split(',')[1] : pdfSource);
        pdfBytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
      } else if (pdfSource instanceof ArrayBuffer) {
        pdfBytes = new Uint8Array(pdfSource);
      } else {
        pdfBytes = pdfSource;
      }

      // Apply all elements using use-case
      const modifiedPdfBytes = await applyElementsToPdf(pdfBytes, signatures, texts, dates);

      setIsApplying(false);
      return modifiedPdfBytes;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to apply elements to PDF';
      setError(errorMsg);
      setIsApplying(false);
      throw err;
    }
  }, [pdfSource, signatures, texts, dates]);

  /**
   * @description Applies all elements (signatures, texts, dates) to the PDF and returns as base64 string.
   * @returns Promise resolving to modified PDF as base64 string
   * @throws Error if applying elements fails
   * @description
   * Applies all elements to the PDF and converts the result to a base64 string.
   * This method is useful when submitting the PDF to APIs that expect base64-encoded data.
   */
  const applyElements = useCallback(async (): Promise<string> => {
    const modifiedPdfBytes = await applyElementsAsBytes();
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...modifiedPdfBytes));
    return base64;
  }, [applyElementsAsBytes]);

  return {
    signatures,
    texts,
    dates,
    addSignature,
    addText,
    addDate,
    removeSignature,
    removeText,
    removeDate,
    updateSignatureCoordinates,
    updateTextCoordinates,
    updateDateCoordinates,
    updateTextFontSize,
    updateDateFontSize,
    updateSignatureSize,
    clearAll,
    applyElements,
    applyElementsAsBytes,
    isApplying,
    error,
  };
}

