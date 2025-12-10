/**
 * @fileoverview PDF Element Interaction Interfaces - Types for interactive PDF elements
 * @summary Type definitions for interactive PDF elements and render metrics
 * @description
 * Defines interfaces used to describe interactive PDF elements (signatures, texts, dates)
 * and the render metrics required to convert between PDF coordinates and display coordinates.
 */

import type {
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../types';
import { ResizeHandle } from '../enums';

export type { ResizeHandle };

import { PdfElementType, ControlType } from '../enums';

export { PdfElementType, ControlType };

/**
 * @description Hit-test result for interactive PDF elements.
 */
export interface PdfElementHit {
  /** Element type that was hit */
  type: PdfElementType;
  /** Index of the element within its corresponding array */
  index: number;
}

/**
 * @description Metrics describing how a PDF page is rendered on screen.
 */
export interface PdfRenderMetrics {
  /** Page width in PDF points at scale 1.0 */
  pdfPageWidth: number;
  /** Page height in PDF points at scale 1.0 */
  pdfPageHeight: number;
  /** Viewport width in display pixels (CSS or display space) */
  viewportWidth: number;
  /** Viewport height in display pixels (CSS or display space) */
  viewportHeight: number;
}

/**
 * @description Input required to perform hit-testing for interactive PDF elements.
 */
export interface PdfHitTestInput {
  /** X coordinate in display space (viewport coordinates) */
  displayX: number;
  /** Y coordinate in display space (viewport coordinates) */
  displayY: number;
  /** Current page number (1-based) */
  pageNumber: number;
  /** Render metrics for the current page */
  renderMetrics: PdfRenderMetrics;
  /** Signature placements for the current document */
  signatures: SignaturePlacement[];
  /** Text placements for the current document */
  texts: TextPlacement[];
  /** Date placements for the current document */
  dates: DatePlacement[];
}

/**
 * @description Hit-test result for interactive controls (resize handles or delete buttons).
 */
export interface PdfControlHit {
  /** Type of control that was hit */
  type: ControlType;
  /** Resize handle position (only when type is 'resize') */
  handle?: ResizeHandle;
}

/**
 * @description Element bounds in display space.
 */
export interface ElementDisplayBounds {
  /** X coordinate in display space */
  x: number;
  /** Y coordinate in display space */
  y: number;
  /** Width in display space */
  width: number;
  /** Height in display space */
  height: number;
}

/**
 * @description Input for computing resized signature dimensions.
 */
export interface ComputeResizedSignatureDimensionsInput {
  /** Resize handle being dragged */
  handle: ResizeHandle;
  /** Starting width in display space */
  startWidthDisplay: number;
  /** Starting height in display space */
  startHeightDisplay: number;
  /** Starting X coordinate in PDF space */
  startXPDF: number;
  /** Starting Y coordinate in PDF space */
  startYPDF: number;
  /** Pointer delta X in display space */
  deltaXDisplay: number;
  /** Pointer delta Y in display space */
  deltaYDisplay: number;
  /** Render metrics for coordinate conversion */
  renderMetrics: PdfRenderMetrics;
  /** Minimum width in PDF space */
  minWidthPDF?: number;
  /** Minimum height in PDF space */
  minHeightPDF?: number;
}

/**
 * @description Result of computing resized signature dimensions.
 */
export interface ResizedSignatureDimensions {
  /** New width in PDF space */
  widthPDF: number;
  /** New height in PDF space */
  heightPDF: number;
  /** New X coordinate in PDF space (may differ from startX if handle is on left side) */
  xPDF: number;
  /** New Y coordinate in PDF space (may differ from startY if handle is on top side) */
  yPDF: number;
}

/**
 * @description Input for computing resized text font size.
 */
export interface ComputeResizedTextFontSizeInput {
  /** Starting font size in PDF space */
  startFontSizePDF: number;
  /** Pointer delta Y in display space */
  deltaYDisplay: number;
  /** Render metrics for coordinate conversion */
  renderMetrics: PdfRenderMetrics;
  /** Minimum font size */
  minFontSize?: number;
  /** Maximum font size */
  maxFontSize?: number;
}

/**
 * @description Input for computing resized date font size.
 */
export interface ComputeResizedDateFontSizeInput {
  /** Starting font size in PDF space */
  startFontSizePDF: number;
  /** Pointer delta Y in display space */
  deltaYDisplay: number;
  /** Render metrics for coordinate conversion */
  renderMetrics: PdfRenderMetrics;
  /** Minimum font size */
  minFontSize?: number;
  /** Maximum font size */
  maxFontSize?: number;
}

