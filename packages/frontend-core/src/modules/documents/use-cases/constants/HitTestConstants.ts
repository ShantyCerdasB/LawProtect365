/**
 * @fileoverview Hit Test Constants - Default values for element hit-testing
 * @summary Defines magic numbers and default values for hit-testing calculations
 * @description
 * Centralizes all magic numbers and hardcoded values used in element hit-testing
 * to improve maintainability and readability.
 */

/**
 * @description Default width for signature elements in PDF points.
 */
export const DEFAULT_SIGNATURE_WIDTH = 150;

/**
 * @description Default height for signature elements in PDF points.
 */
export const DEFAULT_SIGNATURE_HEIGHT = 60;

/**
 * @description Default font size for text and date elements in PDF points.
 */
export const DEFAULT_FONT_SIZE = 12;

/**
 * @description Character width multiplier for calculating text width.
 * Approximates average character width as 60% of font size.
 */
export const TEXT_WIDTH_MULTIPLIER = 0.6;

/**
 * @description Default width for date elements in PDF points.
 * Date width is approximated since actual width depends on format and font.
 */
export const DEFAULT_DATE_WIDTH = 80;

