/**
 * @fileoverview Detect Element Interaction - Element hit-testing utilities
 * @summary Provides pure functions for detecting element interactions at a point
 * @description
 * These functions detect which element (if any) is at a given display point, and what
 * type of interaction (drag, resize, delete) should be initiated. All functions are pure
 * and platform-agnostic.
 */

import type {
  PdfElementHit,
  PdfControlHit,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../types';
import { PdfElementType } from '../enums';
import { getElementDisplayBounds } from './getElementDisplayBounds';
import { getControlAtDisplayPosition } from './getControlAtDisplayPosition';
import type {
  DisplayPoint,
  AllElements,
  DetectElementAtPointInput,
  DetectControlAtPointInput,
  ElementInteractionResult,
} from '../interfaces';

export type {
  AllElements,
  DetectElementAtPointInput,
  DetectControlAtPointInput,
  ElementInteractionResult,
};

/**
 * @description Detects which element (if any) is at the given display point.
 * @param input Display point, page number, render metrics, and elements.
 * @returns Element hit information, or null if no element found.
 */
export function detectElementAtPoint(
  input: DetectElementAtPointInput
): PdfElementHit | null {
  const { displayPoint, pageNumber, renderMetrics, elements } = input;

  const elementTypes: Array<{
    type: PdfElementType;
    array: (SignaturePlacement | TextPlacement | DatePlacement)[];
  }> = [
    { type: PdfElementType.Signature, array: elements.signatures },
    { type: PdfElementType.Text, array: elements.texts },
    { type: PdfElementType.Date, array: elements.dates },
  ];

  for (const { type, array } of elementTypes) {
    for (let i = 0; i < array.length; i++) {
      const bounds = getElementDisplayBounds({
        elementType: type,
        index: i,
        pageNumber,
        renderMetrics,
        signatures: elements.signatures,
        texts: elements.texts,
        dates: elements.dates,
      });

      if (!bounds) continue;

      const { x, y, width, height } = bounds;
      if (
        displayPoint.x >= x &&
        displayPoint.x <= x + width &&
        displayPoint.y >= y &&
        displayPoint.y <= y + height
      ) {
        return { type, index: i };
      }
    }
  }

  return null;
}

/**
 * @description Detects which control (resize handle or delete button) is at the given display point.
 * @param input Display point, page number, render metrics, and elements.
 * @returns Element interaction result with control hit information.
 */
export function detectControlAtPoint(
  input: DetectControlAtPointInput
): ElementInteractionResult {
  const { displayPoint, pageNumber, renderMetrics, elements } = input;

  const elementTypes: Array<{
    type: PdfElementType;
    array: (SignaturePlacement | TextPlacement | DatePlacement)[];
  }> = [
    { type: PdfElementType.Signature, array: elements.signatures },
    { type: PdfElementType.Text, array: elements.texts },
    { type: PdfElementType.Date, array: elements.dates },
  ];

  let foundElementHit: { type: PdfElementType; index: number } | null = null;
  let foundControlHit: PdfControlHit | null = null;
  let foundElementBounds: { x: number; y: number; width: number; height: number } | null = null;

  for (const { type, array } of elementTypes) {
    for (let i = 0; i < array.length; i++) {
      const bounds = getElementDisplayBounds({
        elementType: type,
        index: i,
        pageNumber,
        renderMetrics,
        signatures: elements.signatures,
        texts: elements.texts,
        dates: elements.dates,
      });

      if (!bounds) continue;

      // Check if point is within element bounds
      const isWithinBounds =
        displayPoint.x >= bounds.x &&
        displayPoint.x <= bounds.x + bounds.width &&
        displayPoint.y >= bounds.y &&
        displayPoint.y <= bounds.y + bounds.height;

      if (isWithinBounds) {
        foundElementHit = { type, index: i };
        foundElementBounds = bounds;

        // Check for control hit (resize handle or delete button)
        const controlHit = getControlAtDisplayPosition(
          displayPoint.x,
          displayPoint.y,
          bounds,
          type
        );

        if (controlHit) {
          foundControlHit = controlHit;
          // Return immediately if control is hit (higher priority)
          return {
            elementHit: foundElementHit,
            controlHit: foundControlHit,
            elementBounds: foundElementBounds,
          };
        }
      }
    }
  }

  // Return element hit even if no control was hit
  return {
    elementHit: foundElementHit,
    controlHit: foundControlHit,
    elementBounds: foundElementBounds,
  };
}

