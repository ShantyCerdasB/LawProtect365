/**
 * @fileoverview Handle Element Pointer Down - Use case for handling pointer down events
 * @summary Orchestrates element interaction strategies for pointer down events
 * @description
 * Handles pointer down events by detecting hits and delegating to appropriate strategies.
 * This is a pure function that can be reused in web and mobile.
 */

import type {
  HandleElementPointerDownInput,
  HandleElementPointerDownResult,
} from '../interfaces';
import { detectControlAtPoint } from './detectElementInteraction';
import { getElementInteractionStrategy } from './createElementInteractionStrategy';
import type { PdfElementType } from '../enums';

export type {
  HandleElementPointerDownInput,
  HandleElementPointerDownResult,
};

/**
 * @description Handles pointer down event for elements.
 * @param input Input containing context and display point
 * @returns Result with interaction result and hit information
 */
export function handleElementPointerDown(
  input: HandleElementPointerDownInput
): HandleElementPointerDownResult {
  const { context, displayPoint } = input;
  const { renderMetrics, currentPage, elements } = context;

  const controlResult = detectControlAtPoint({
    displayPoint,
    pageNumber: currentPage,
    renderMetrics,
    elements,
  });

  const elementHit = controlResult.elementHit;
  const controlHit = controlResult.controlHit;
  const elementBounds = controlResult.elementBounds;

  let strategy: ReturnType<typeof getElementInteractionStrategy> = null;
  let elementType: PdfElementType | string | null = null;

  if (elementHit) {
    elementType = elementHit.type;
    strategy = getElementInteractionStrategy(elementType);
  } else if (context.pendingElementType) {
    elementType = context.pendingElementType;
    strategy = getElementInteractionStrategy(elementType);
  }

  if (!strategy) {
    return {
      result: null,
      elementHit: null,
      controlHit: null,
      elementBounds: null,
    };
  }

  const result = strategy.handlePointerDown(
    context,
    displayPoint,
    elementHit,
    controlHit,
    elementBounds
  );

  return {
    result,
    elementHit,
    controlHit,
    elementBounds,
  };
}

