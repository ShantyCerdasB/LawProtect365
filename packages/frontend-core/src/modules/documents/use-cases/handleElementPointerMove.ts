/**
 * @fileoverview Handle Element Pointer Move - Use case for handling pointer move events
 * @summary Orchestrates element interaction strategies for pointer move events
 * @description
 * Handles pointer move events by delegating to appropriate strategies based on current state.
 * This is a pure function that can be reused in web and mobile.
 */

import type {
  ElementInteractionContext,
  AnyInteractionResult,
} from '../strategies/interfaces';
import type { HandleElementPointerMoveInput } from '../interfaces';
import { getElementInteractionStrategy } from './createElementInteractionStrategy';
import type { PdfElementType } from '../enums';

export type { HandleElementPointerMoveInput };

/**
 * @description Handles pointer move event for elements.
 * @param input Input containing context, display point, and current state
 * @returns Interaction result indicating what action to take
 */
export function handleElementPointerMove(
  input: HandleElementPointerMoveInput
): AnyInteractionResult | null {
  const { context, displayPoint, resizeState, dragState } = input;

  let strategy: ReturnType<typeof getElementInteractionStrategy> = null;
  let elementType: PdfElementType | string | null = null;

  if (resizeState) {
    elementType = resizeState.type;
    strategy = getElementInteractionStrategy(elementType);
  } else if (dragState) {
    elementType = dragState.type;
    strategy = getElementInteractionStrategy(elementType);
  }

  if (!strategy) {
    return null;
  }

  return strategy.handlePointerMove(context, displayPoint, resizeState, dragState);
}

