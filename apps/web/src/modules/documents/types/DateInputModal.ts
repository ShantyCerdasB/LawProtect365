/**
 * @fileoverview Date Input Modal Types - Types for date input modal component
 * @summary Type definitions for date input modal props
 */

/**
 * @description Props for the DateInputModal component.
 */
export interface DateInputModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when date is confirmed (date, format, fontSize) */
  onConfirm: (date: Date, format: string, fontSize: number) => void;
  /** Callback when date changes (for preview) */
  onPreview?: (date: Date, format: string, fontSize: number) => void;
  /** Optional default date value */
  defaultDate?: Date;
}

