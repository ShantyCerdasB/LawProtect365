/**
 * @fileoverview Create Element Interaction Strategy - Factory for creating interaction strategies
 * @summary Factory function to get the appropriate strategy for an element type
 * @description
 * Creates and returns the appropriate interaction strategy based on element type.
 * Uses a registry pattern to map element types to strategies.
 */

import type { ElementInteractionStrategy } from '../strategies';
import { SignatureInteractionStrategy } from '../strategies/SignatureInteractionStrategy';
import { TextInteractionStrategy } from '../strategies/TextInteractionStrategy';
import { DateInteractionStrategy } from '../strategies/DateInteractionStrategy';
import type { PdfElementType } from '../enums';

/**
 * @description Registry of strategies by element type.
 */
const strategyRegistry: ElementInteractionStrategy[] = [
  new SignatureInteractionStrategy(),
  new TextInteractionStrategy(),
  new DateInteractionStrategy(),
];

/**
 * @description Gets the appropriate strategy for an element type.
 * @param elementType Element type to get strategy for
 * @returns Strategy that can handle the element type, or null if none found
 */
export function getElementInteractionStrategy(
  elementType: PdfElementType | string | null
): ElementInteractionStrategy | null {
  return strategyRegistry.find((strategy) => strategy.canHandle(elementType)) || null;
}

/**
 * @description Gets all available strategies.
 * @returns Array of all registered strategies
 */
export function getAllElementInteractionStrategies(): ElementInteractionStrategy[] {
  return strategyRegistry;
}

