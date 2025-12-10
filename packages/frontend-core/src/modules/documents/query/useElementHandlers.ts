/**
 * @fileoverview Use Element Handlers - Hook for centralizing element operation handlers
 * @summary React hook for managing handlers for element operations (move, delete, resize)
 * @description
 * Provides centralized handlers for element operations (move, delete, resize) that
 * delegate to the appropriate functions based on element type. This is a reusable
 * hook that can be used in both web and mobile applications.
 */

import { useCallback } from 'react';
import { PdfElementType } from '../enums';
import type { PDFCoordinates } from '../types';
import type { UseElementHandlersConfig, UseElementHandlersResult } from '../interfaces';

/**
 * @description Hook for centralizing element operation handlers.
 * @param config Configuration with callbacks for element operations
 * @returns Centralized element handlers
 */
export function useElementHandlers(config: UseElementHandlersConfig): UseElementHandlersResult {
  const {
    updateSignatureCoordinates,
    updateTextCoordinates,
    updateDateCoordinates,
    updateTextFontSize,
    updateDateFontSize,
    updateSignatureSize,
    removeSignature,
    removeText,
    removeDate,
  } = config;

  /**
   * @description Handles element move operation.
   * @param elementType Type of element being moved
   * @param index Index of element in array
   * @param coordinates New coordinates
   */
  const handleElementMove = useCallback(
    (elementType: PdfElementType, index: number, coordinates: PDFCoordinates) => {
      if (elementType === PdfElementType.Signature) {
        updateSignatureCoordinates(index, coordinates);
      } else if (elementType === PdfElementType.Text) {
        updateTextCoordinates(index, coordinates);
      } else if (elementType === PdfElementType.Date) {
        updateDateCoordinates(index, coordinates);
      }
    },
    [updateSignatureCoordinates, updateTextCoordinates, updateDateCoordinates]
  );

  /**
   * @description Handles element delete operation.
   * @param elementType Type of element being deleted
   * @param index Index of element in array
   */
  const handleElementDelete = useCallback(
    (elementType: PdfElementType, index: number) => {
      if (elementType === PdfElementType.Signature) {
        removeSignature(index);
      } else if (elementType === PdfElementType.Text) {
        removeText(index);
      } else if (elementType === PdfElementType.Date) {
        removeDate(index);
      }
    },
    [removeSignature, removeText, removeDate]
  );

  /**
   * @description Handles text resize operation.
   * @param index Index of text element
   * @param fontSize New font size
   */
  const handleTextResize = useCallback(
    (index: number, fontSize: number) => {
      updateTextFontSize(index, fontSize);
    },
    [updateTextFontSize]
  );

  /**
   * @description Handles date resize operation.
   * @param index Index of date element
   * @param fontSize New font size
   */
  const handleDateResize = useCallback(
    (index: number, fontSize: number) => {
      updateDateFontSize(index, fontSize);
    },
    [updateDateFontSize]
  );

  /**
   * @description Handles signature resize operation.
   * @param index Index of signature element
   * @param width New width
   * @param height New height
   */
  const handleSignatureResize = useCallback(
    (index: number, width: number, height: number) => {
      updateSignatureSize(index, width, height);
    },
    [updateSignatureSize]
  );

  return {
    handleElementMove,
    handleElementDelete,
    handleTextResize,
    handleDateResize,
    handleSignatureResize,
  };
}

