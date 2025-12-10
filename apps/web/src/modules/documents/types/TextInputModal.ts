/**
 * @fileoverview Text Input Modal Types - Types for text input modal component
 * @summary Type definitions for text input modal props
 */

/**
 * @description Props for the TextInputModal component.
 */
export interface TextInputModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when text is confirmed (text, fontSize) */
  onConfirm: (text: string, fontSize: number) => void;
  /** Callback when text changes (for preview) */
  onPreview?: (text: string, fontSize: number) => void;
  /** Optional default text value */
  defaultText?: string;
}

