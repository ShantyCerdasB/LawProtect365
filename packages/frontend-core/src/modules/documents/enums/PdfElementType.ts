/**
 * @fileoverview PDF Element Type Enum - Enumeration for interactive PDF element types
 * @summary Defines the types of interactive elements that can be placed on PDF documents
 * @description Enumeration for identifying different types of interactive PDF elements.
 */

/**
 * @description Supported interactive PDF element types.
 */
export enum PdfElementType {
  /** Signature element (hand-drawn or typed signature) */
  Signature = 'signature',
  /** Text element (custom text input) */
  Text = 'text',
  /** Date element (formatted date display) */
  Date = 'date',
}

