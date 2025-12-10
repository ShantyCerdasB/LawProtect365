/**
 * @fileoverview Use Pending Element State - Hook for managing pending element state
 * @summary React hook for managing preview state of elements before placement
 * @description
 * Manages state for pending elements (signatures, text, dates) that are being
 * previewed before being placed on the PDF. This includes coordinates, preview data,
 * and default values. This is a web-specific hook for UI preview state.
 */

import { useState, useCallback } from 'react';
import { PdfElementType, normalizeDataUrl } from '@lawprotect/frontend-core';
import type { PDFCoordinates } from '@lawprotect/frontend-core';
import type { UsePendingElementStateResult } from '../interfaces';

/**
 * @description Default values for pending elements.
 */
const DEFAULT_SIGNATURE_WIDTH = 150;
const DEFAULT_SIGNATURE_HEIGHT = 60;
const DEFAULT_FONT_SIZE = 12;
const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';

/**
 * @description Hook for managing pending element state.
 * @returns Pending element state and handlers
 */
export function usePendingElementState(): UsePendingElementStateResult {
  const [pendingCoordinates, setPendingCoordinates] = useState<PDFCoordinates | null>(null);
  const [pendingSignatureImage, setPendingSignatureImage] = useState<string | null>(null);
  const [pendingSignatureWidth, setPendingSignatureWidth] = useState<number>(DEFAULT_SIGNATURE_WIDTH);
  const [pendingSignatureHeight, setPendingSignatureHeight] = useState<number>(DEFAULT_SIGNATURE_HEIGHT);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingTextFontSize, setPendingTextFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingDateFormat, setPendingDateFormat] = useState<string>(DEFAULT_DATE_FORMAT);
  const [pendingDateFontSize, setPendingDateFontSize] = useState<number>(DEFAULT_FONT_SIZE);

  /**
   * @description Updates pending signature preview with normalized data URL.
   * @param signatureImage Signature image as data URL or base64 string
   */
  const updateSignaturePreview = useCallback((signatureImage: string) => {
    if (!signatureImage || signatureImage.trim() === '') {
      return;
    }
    
    const normalized = normalizeDataUrl(signatureImage);
    setPendingSignatureImage(normalized);
  }, []);

  /**
   * @description Updates pending text preview.
   * @param text Text content
   * @param fontSize Font size
   */
  const updateTextPreview = useCallback((text: string, fontSize: number) => {
    setPendingText(text);
    setPendingTextFontSize(fontSize);
  }, []);

  /**
   * @description Updates pending date preview.
   * @param date Date object
   * @param format Date format string
   * @param fontSize Font size
   */
  const updateDatePreview = useCallback((date: Date, format: string, fontSize: number) => {
    setPendingDate(date);
    setPendingDateFormat(format);
    setPendingDateFontSize(fontSize);
  }, []);

  /**
   * @description Updates pending signature size.
   * @param width New width
   * @param height New height
   */
  const updateSignatureSize = useCallback((width: number, height: number) => {
    setPendingSignatureWidth(width);
    setPendingSignatureHeight(height);
  }, []);

  /**
   * @description Clears all pending state.
   */
  const clearPendingState = useCallback(() => {
    setPendingCoordinates(null);
    setPendingSignatureImage(null);
    setPendingSignatureWidth(DEFAULT_SIGNATURE_WIDTH);
    setPendingSignatureHeight(DEFAULT_SIGNATURE_HEIGHT);
    setPendingText(null);
    setPendingTextFontSize(DEFAULT_FONT_SIZE);
    setPendingDate(null);
    setPendingDateFormat(DEFAULT_DATE_FORMAT);
    setPendingDateFontSize(DEFAULT_FONT_SIZE);
  }, []);

  /**
   * @description Clears pending state for a specific element type.
   * @param type Element type to clear
   */
  const clearPendingElement = useCallback((type: PdfElementType) => {
    if (type === PdfElementType.Signature) {
      setPendingSignatureImage(null);
      setPendingSignatureWidth(DEFAULT_SIGNATURE_WIDTH);
      setPendingSignatureHeight(DEFAULT_SIGNATURE_HEIGHT);
    } else if (type === PdfElementType.Text) {
      setPendingText(null);
      setPendingTextFontSize(DEFAULT_FONT_SIZE);
    } else if (type === PdfElementType.Date) {
      setPendingDate(null);
      setPendingDateFormat(DEFAULT_DATE_FORMAT);
      setPendingDateFontSize(DEFAULT_FONT_SIZE);
    }
  }, []);

  return {
    pendingCoordinates,
    pendingSignatureImage,
    pendingSignatureWidth,
    pendingSignatureHeight,
    pendingText,
    pendingTextFontSize,
    pendingDate,
    pendingDateFormat,
    pendingDateFontSize,
    setPendingCoordinates,
    updateSignaturePreview,
    updateTextPreview,
    updateDatePreview,
    updateSignatureSize,
    clearPendingState,
    clearPendingElement,
  };
}

