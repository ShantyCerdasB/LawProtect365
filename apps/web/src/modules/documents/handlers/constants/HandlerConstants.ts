/**
 * @fileoverview Handler Constants - Constants for web element interaction handler
 * @summary Defines constants used by WebElementInteractionHandler
 * @description
 * Centralizes magic numbers and special values used in the web element interaction handler.
 * This makes the code more maintainable and self-documenting.
 */

/**
 * @description Special index value indicating a pending element (not yet placed).
 */
export const PENDING_ELEMENT_INDEX = -1;

/**
 * @description Default coordinates when coordinates are not available.
 */
export const DEFAULT_COORDINATES = { x: 0, y: 0 } as const;

/**
 * @description Default event coordinates when event coordinates are not available.
 */
export const DEFAULT_EVENT_COORDINATES = { clientX: 0, clientY: 0 } as const;

