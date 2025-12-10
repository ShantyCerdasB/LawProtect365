/**
 * @fileoverview Get Element Bounds - Helper for calculating element bounding boxes
 * @summary Calculates width and height for different element types
 * @description
 * Provides a unified way to calculate bounding box dimensions for signatures,
 * texts, and dates. This centralizes the logic for determining element bounds
 * used in hit-testing and rendering.
 */

import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../types';
import { PdfElementType } from '../../enums';
import type { ElementBounds } from '../../interfaces';
import {
  DEFAULT_SIGNATURE_WIDTH,
  DEFAULT_SIGNATURE_HEIGHT,
  DEFAULT_FONT_SIZE,
  TEXT_WIDTH_MULTIPLIER,
  DEFAULT_DATE_WIDTH,
} from '../constants/HitTestConstants';

/**
 * @description Calculates bounding box for a signature element.
 * @param signature Signature placement data
 * @returns Bounding box dimensions
 */
function getSignatureBounds(signature: SignaturePlacement): ElementBounds {
  const { coordinates } = signature;
  const width = signature.width ?? DEFAULT_SIGNATURE_WIDTH;
  const height = signature.height ?? DEFAULT_SIGNATURE_HEIGHT;

  return {
    width,
    height,
    x: coordinates.x,
    y: coordinates.y,
  };
}

/**
 * @description Calculates bounding box for a text element.
 * @param text Text placement data
 * @returns Bounding box dimensions
 * @description
 * Text elements are drawn from the baseline upward, so the Y coordinate
 * represents the baseline. The bounding box extends from (x, y - height) to (x + width, y).
 */
function getTextBounds(text: TextPlacement): ElementBounds {
  const { coordinates } = text;
  const fontSize = text.fontSize ?? DEFAULT_FONT_SIZE;
  const textWidth = text.text.length * fontSize * TEXT_WIDTH_MULTIPLIER;
  const textHeight = fontSize;

  return {
    width: textWidth,
    height: textHeight,
    x: coordinates.x,
    y: coordinates.y,
  };
}

/**
 * @description Calculates bounding box for a date element.
 * @param date Date placement data
 * @returns Bounding box dimensions
 * @description
 * Date elements are drawn from the baseline upward, similar to text elements.
 * The bounding box extends from (x, y - height) to (x + width, y).
 */
function getDateBounds(date: DatePlacement): ElementBounds {
  const { coordinates } = date;
  const fontSize = date.fontSize ?? DEFAULT_FONT_SIZE;
  const dateWidth = DEFAULT_DATE_WIDTH;
  const dateHeight = fontSize;

  return {
    width: dateWidth,
    height: dateHeight,
    x: coordinates.x,
    y: coordinates.y,
  };
}

/**
 * @description Calculates bounding box for an element based on its type.
 * @param element Element placement data (signature, text, or date)
 * @param elementType Type of element
 * @returns Bounding box dimensions
 * @throws Error if element type is not supported
 */
export function getElementBounds(
  element: SignaturePlacement | TextPlacement | DatePlacement,
  elementType: PdfElementType
): ElementBounds {
  switch (elementType) {
    case PdfElementType.Signature:
      return getSignatureBounds(element as SignaturePlacement);
    case PdfElementType.Text:
      return getTextBounds(element as TextPlacement);
    case PdfElementType.Date:
      return getDateBounds(element as DatePlacement);
    default:
      throw new Error(`Unsupported element type: ${elementType}`);
  }
}

