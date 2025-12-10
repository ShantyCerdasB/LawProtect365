/**
 * @fileoverview Compute Dragged Element Coordinates - Drag math for interactive PDF elements
 * @summary Computes new PDF coordinates for elements dragged in display space
 * @description
 * Provides a shared, platform-agnostic helper that mirrors the drag behavior implemented
 * in the web PDF viewer. It takes the current drag state and display-space pointer
 * coordinates and returns updated PDF coordinates with correct center alignment.
 */

import type {
  PDFCoordinates,
} from '../types';
import type {
  DraggedElementDescriptor,
  ComputeDraggedElementCoordinatesInput,
} from '../interfaces';
import { PdfElementType } from '../enums';

export type {
  DraggedElementDescriptor,
  ComputeDraggedElementCoordinatesInput,
};

export function computeDraggedElementCoordinates(
  input: ComputeDraggedElementCoordinatesInput,
): PDFCoordinates {
  const {
    draggedElement,
    nextDisplayX,
    nextDisplayY,
    currentPage,
    renderMetrics,
    signatures,
    texts,
    dates,
  } = input;

  const {
    pdfPageWidth,
    pdfPageHeight,
    viewportWidth,
    viewportHeight,
  } = renderMetrics;

  const scaleX = pdfPageWidth / viewportWidth;
  const scaleY = pdfPageHeight / viewportHeight;

  // Element dimensions in display space
  let elementWidthDisplay = 0;
  let elementHeightDisplay = 0;
  let isTextOrDate = false;

  if (draggedElement.type === PdfElementType.Signature) {
    const sig = signatures[draggedElement.index];
    const sigWidthPDF = sig.width ?? 150;
    const sigHeightPDF = sig.height ?? 60;
    elementWidthDisplay = sigWidthPDF * (viewportWidth / pdfPageWidth);
    elementHeightDisplay = sigHeightPDF * (viewportHeight / pdfPageHeight);
  } else if (draggedElement.type === PdfElementType.Text) {
    const text = texts[draggedElement.index];
    const fontSize = text.fontSize ?? 12;
    const fontSizeDisplay = fontSize * (viewportHeight / pdfPageHeight);
    elementWidthDisplay = text.text.length * fontSizeDisplay * 0.6;
    elementHeightDisplay = fontSizeDisplay;
    isTextOrDate = true;
  } else {
    const date = dates[draggedElement.index];
    const fontSize = date.fontSize ?? 12;
    const fontSizeDisplay = fontSize * (viewportHeight / pdfPageHeight);
    elementWidthDisplay = 80 * (viewportWidth / pdfPageWidth);
    elementHeightDisplay = fontSizeDisplay;
    isTextOrDate = true;
  }

  // Adjust position to account for center offset
  // For signatures: center is middle of the box
  // For text/date: Y is at baseline, so center is at baseline - half height
  const adjustedXDisplay = nextDisplayX - elementWidthDisplay / 2;
  let adjustedYDisplay = 0;

  if (isTextOrDate) {
    // For text/date, pointer is at visual center, but PDF coordinates use baseline (bottom)
    // Baseline = centerY + halfHeight
    adjustedYDisplay = nextDisplayY + elementHeightDisplay / 2;
  } else {
    // For signatures, center is geometric center of the box
    adjustedYDisplay = nextDisplayY - elementHeightDisplay / 2;
  }

  const adjustedX = adjustedXDisplay * scaleX;
  const adjustedY = adjustedYDisplay * scaleY;

  const coordinates: PDFCoordinates = {
    x: adjustedX,
    y: adjustedY,
    pageNumber: currentPage,
    pageWidth: pdfPageWidth,
    pageHeight: pdfPageHeight,
  };

  return coordinates;
}


