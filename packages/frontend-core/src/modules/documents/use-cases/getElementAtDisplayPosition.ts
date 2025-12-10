/**
 * @fileoverview Get Element At Display Position - Hit-testing for interactive PDF elements
 * @summary Determines which interactive PDF element is under a display-space point
 * @description
 * Provides a shared, platform-agnostic helper to determine which interactive element
 * (signature, text, or date) is located under a given point in display space. This logic
 * is used by both web and mobile viewers to support drag, resize, and selection behavior.
 */

import type {
  PdfElementHit,
  PdfHitTestInput,
} from '../types';
import { PdfElementType } from '../enums';
import type { ElementHitTestConfig } from '../interfaces';
import { hitTestElement } from './helpers/hitTestElement';

/**
 * @description Tests elements of a specific type and returns the first hit.
 * @param config Element configuration with type and array
 * @param pdfX X coordinate in PDF space
 * @param pdfY Y coordinate in PDF space
 * @param pageNumber Page number to filter by
 * @returns Hit information if found, or null
 */
function testElementType(
  config: ElementHitTestConfig,
  pdfX: number,
  pdfY: number,
  pageNumber: number
): PdfElementHit | null {
  const { type, elements } = config;

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    if (element.coordinates.pageNumber !== pageNumber) {
      continue;
    }

    if (hitTestElement(element, type, pdfX, pdfY)) {
      return { type, index: i };
    }
  }

  return null;
}

/**
 * @description Calculates which element (if any) is under the given display-space point.
 * @param input Hit-test input with display coordinates, metrics, and element arrays
 * @returns Hit information when an element is found, or null when nothing is hit
 * @description
 * Converts display coordinates to PDF space, then tests each element type
 * (signatures, texts, dates) in order. Returns the first element that is hit.
 * Signatures are tested first, then texts, then dates.
 */
export function getElementAtDisplayPosition(input: PdfHitTestInput): PdfElementHit | null {
  const {
    displayX,
    displayY,
    pageNumber,
    renderMetrics,
    signatures,
    texts,
    dates,
  } = input;

  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;

  if (viewportWidth <= 0 || viewportHeight <= 0 || pdfPageWidth <= 0 || pdfPageHeight <= 0) {
    return null;
  }

  // Convert from display space to PDF space for comparison with stored coordinates
  const scaleX = pdfPageWidth / viewportWidth;
  const scaleY = pdfPageHeight / viewportHeight;
  const pdfX = displayX * scaleX;
  const pdfY = displayY * scaleY;

  // Test elements in order: signatures, texts, dates
  const elementConfigs: ElementHitTestConfig[] = [
    { type: PdfElementType.Signature, elements: signatures },
    { type: PdfElementType.Text, elements: texts },
    { type: PdfElementType.Date, elements: dates },
  ];

  for (const config of elementConfigs) {
    const hit = testElementType(config, pdfX, pdfY, pageNumber);
    if (hit) {
      return hit;
    }
  }

  return null;
}


