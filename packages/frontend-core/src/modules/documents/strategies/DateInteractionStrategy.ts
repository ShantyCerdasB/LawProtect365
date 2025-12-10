/**
 * @fileoverview Date Interaction Strategy - Strategy for handling date element interactions
 * @summary Handles drag, resize, and delete interactions for date elements
 * @description
 * Implements date element interaction strategy by extending BaseTextLikeInteractionStrategy.
 * This strategy handles all user interactions with date elements including:
 * - Deleting date elements via delete control
 * - Resizing date elements via resize handles (changes font size)
 * - Dragging date elements to reposition them (for both pending and placed dates)
 * 
 * Uses the base class for common interaction logic, only providing date-specific
 * configuration (element type, default dimensions, font size computation).
 * 
 * Supports both pending date elements (not yet placed on the PDF) and placed date elements
 * (already added to the document).
 */

import { BaseTextLikeInteractionStrategy, type TextLikeElementDimensions } from './BaseTextLikeInteractionStrategy';
import type { ElementInteractionContext } from './interfaces';
import { PdfElementType } from '../enums';
import { computeResizedDateFontSize } from '../use-cases/computeResizedDateFontSize';

/**
 * @description Default dimensions for pending date elements in PDF space.
 */
const DEFAULT_DATE_DIMENSIONS: TextLikeElementDimensions = {
  defaultWidthPDF: 80,
  defaultHeightPDF: 14,
};

/**
 * @description Strategy for handling date element interactions.
 */
export class DateInteractionStrategy extends BaseTextLikeInteractionStrategy {
  /**
   * @description Gets the element type this strategy handles.
   * @returns PdfElementType.Date
   */
  protected getElementType(): PdfElementType {
    return PdfElementType.Date;
  }

  /**
   * @description Gets the default dimensions for pending date elements.
   * @returns Default width (80) and height (14) in PDF space
   */
  protected getDefaultDimensions(): TextLikeElementDimensions {
    return DEFAULT_DATE_DIMENSIONS;
  }

  /**
   * @description Computes new font size for a resized date element.
   * @param startFontSizePDF Starting font size in PDF space
   * @param deltaYDisplay Vertical delta in display space
   * @param renderMetrics Render metrics for coordinate conversion
   * @returns New font size in PDF space
   */
  protected computeResizedFontSize(
    startFontSizePDF: number,
    deltaYDisplay: number,
    renderMetrics: { pdfPageWidth: number; pdfPageHeight: number; viewportWidth: number; viewportHeight: number }
  ): number {
    return computeResizedDateFontSize({
      startFontSizePDF,
      deltaYDisplay,
      renderMetrics,
    });
  }

  /**
   * @description Gets the date element array from context.
   * @param context Interaction context
   * @returns Array of date placements
   */
  protected getElementArray(context: ElementInteractionContext): Array<{ fontSize?: number; coordinates: { pageNumber: number } }> {
    return context.dates;
  }
}
