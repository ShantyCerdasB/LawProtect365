/**
 * @fileoverview Signature Canvas Types - Types for web signature canvas component
 * @summary Type definitions for signature canvas component props
 * @description Defines interfaces for the web-specific signature canvas component
 * used for drawing signatures in the browser.
 */

/**
 * @description Props for the SignatureCanvas component.
 */
export interface SignatureCanvasProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when signature is confirmed, receives signature as base64 image, width, and height */
  onConfirm: (signatureImage: string, width: number, height: number) => void;
  /** Optional callback for real-time preview updates */
  onPreview?: (signatureImage: string) => void;
}

