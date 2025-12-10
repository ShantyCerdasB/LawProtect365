/**
 * @fileoverview Text Interaction Strategy - Strategy for handling text element interactions
 * @summary Handles drag, resize, and delete interactions for text elements
 * @description
 * Implements text element interaction strategy by extending BaseTextLikeInteractionStrategy.
 * This strategy handles all user interactions with text elements including:
 * - Deleting text elements via delete control
 * - Resizing text elements via resize handles (changes font size)
 * - Dragging text elements to reposition them (for both pending and placed text)
 * 
 * Uses the base class for common interaction logic, only providing text-specific
 * configuration (element type, default dimensions, font size computation).
 * 
 * Supports both pending text elements (not yet placed on the PDF) and placed text elements
 * (already added to the document).
 */

import { BaseTextLikeInteractionStrategy, type TextLikeElementDimensions } from './BaseTextLikeInteractionStrategy';
import type { ElementInteractionContext } from './interfaces';
import { PdfElementType } from '../enums';
import { computeResizedTextFontSize } from '../use-cases/computeResizedTextFontSize';

/**
 * @description Default dimensions for pending text elements in PDF space.
 */
const DEFAULT_TEXT_DIMENSIONS: TextLikeElementDimensions = {
  defaultWidthPDF: 100,
  defaultHeightPDF: 14,
};

/**
 * @description Strategy for handling text element interactions.
 */
export class TextInteractionStrategy extends BaseTextLikeInteractionStrategy {
  /**
   * @description Gets the element type this strategy handles.
   * @returns PdfElementType.Text
   */
  protected getElementType(): PdfElementType {
    return PdfElementType.Text;
  }

  /**
   * @description Gets the default dimensions for pending text elements.
   * @returns Default width (100) and height (14) in PDF space
   */
  protected getDefaultDimensions(): TextLikeElementDimensions {
    return DEFAULT_TEXT_DIMENSIONS;
  }

  /**
   * @description Computes new font size for a resized text element.
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
    return computeResizedTextFontSize({
      startFontSizePDF,
      deltaYDisplay,
      renderMetrics,
    });
  }

  /**
   * @description Gets the text element array from context.
   * @param context Interaction context
   * @returns Array of text placements
   */
  protected getElementArray(context: ElementInteractionContext): Array<{ fontSize?: number; coordinates: { pageNumber: number } }> {
    return context.texts;
  }
}

