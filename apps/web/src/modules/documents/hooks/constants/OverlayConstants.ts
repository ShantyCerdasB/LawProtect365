/**
 * @fileoverview Overlay Constants - Constants for PDF element overlay rendering
 * @summary Defines colors, sizes, and default values for overlay rendering
 * @description
 * Centralizes all magic numbers and hardcoded values used in PDF element overlay rendering.
 * This makes the code more maintainable and allows for easy theme customization.
 */

/**
 * @description Default dimensions for elements in PDF space.
 */
export const DEFAULT_DIMENSIONS = {
  /** Default signature width in PDF space */
  SIGNATURE_WIDTH: 150,
  /** Default signature height in PDF space */
  SIGNATURE_HEIGHT: 60,
  /** Default text placeholder width in PDF space */
  TEXT_PLACEHOLDER_WIDTH: 100,
  /** Default text placeholder height in PDF space */
  TEXT_PLACEHOLDER_HEIGHT: 14,
  /** Default date placeholder width in PDF space */
  DATE_PLACEHOLDER_WIDTH: 80,
  /** Default date placeholder height in PDF space */
  DATE_PLACEHOLDER_HEIGHT: 14,
} as const;

/**
 * @description Default font size in PDF space.
 */
export const DEFAULT_FONT_SIZE = 12;

/**
 * @description Default font family.
 */
export const DEFAULT_FONT_FAMILY = 'Arial';

/**
 * @description Control sizes in display pixels.
 */
export const CONTROL_SIZES = {
  /** Size of resize handles in display pixels */
  HANDLE_SIZE: 12,
  /** Size of delete button in display pixels */
  DELETE_SIZE: 16,
  /** Offset for delete button X position */
  DELETE_OFFSET_X: 3,
  /** Offset for delete button Y position */
  DELETE_OFFSET_Y: 3,
  /** Radius of click indicator circle */
  CLICK_INDICATOR_RADIUS: 3,
} as const;

/**
 * @description Stroke and padding values.
 */
export const STROKE_CONFIG = {
  /** Stroke padding around elements */
  PADDING: 2,
  /** Line width for normal stroke */
  LINE_WIDTH_NORMAL: 1,
  /** Line width for active stroke */
  LINE_WIDTH_ACTIVE: 2,
  /** Line width for dragged/resized stroke */
  LINE_WIDTH_DRAGGED: 3,
  /** Dash pattern for pending/active elements */
  DASH_PATTERN: [5, 5] as const,
} as const;

/**
 * @description Colors for overlay rendering.
 */
export const OVERLAY_COLORS = {
  /** Orange color for active/dragged elements */
  ACTIVE: '#f59e0b',
  /** Blue color for normal elements */
  NORMAL: '#3b82f6',
  /** Red color for delete button */
  DELETE: '#ef4444',
  /** White color for strokes */
  WHITE: '#ffffff',
  /** Black color for text */
  BLACK: '#000000',
  /** Red color for click indicator */
  RED: 'red',
  /** Orange with transparency for pending elements */
  PENDING_FILL: 'rgba(245, 158, 11, 0.1)',
} as const;

/**
 * @description Timeout for redraw debouncing in milliseconds.
 */
export const REDRAW_TIMEOUT_MS = 50;

