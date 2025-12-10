/**
 * @fileoverview Resize Handle Enum - Enumeration for resize handle positions
 * @summary Defines the positions of resize handles on interactive PDF elements
 * @description Enumeration for identifying which corner of an element is being resized.
 */

/**
 * @description Resize handle position on an element.
 */
export enum ResizeHandle {
  /** Southeast corner (bottom-right) */
  Southeast = 'se',
  /** Southwest corner (bottom-left) */
  Southwest = 'sw',
  /** Northeast corner (top-right) */
  Northeast = 'ne',
  /** Northwest corner (top-left) */
  Northwest = 'nw',
}

