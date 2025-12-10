/**
 * @fileoverview Control Type Enum - Enumeration for interactive PDF element control types
 * @summary Defines the types of interactive controls on PDF elements
 * @description Enumeration for identifying different types of interactive controls (resize handles, delete buttons).
 */

/**
 * @description Type of interactive control on a PDF element.
 */
export enum ControlType {
  /** Resize handle control (for resizing elements) */
  Resize = 'resize',
  /** Delete button control (for removing elements) */
  Delete = 'delete',
}

