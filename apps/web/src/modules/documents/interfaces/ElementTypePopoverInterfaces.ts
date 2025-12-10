/**
 * @fileoverview Element Type Popover Interfaces - Types for element type popover component
 * @summary Type definitions for element type selection popover
 * @description
 * Defines interfaces used by the `ElementTypePopover` component, which displays
 * a floating popover for selecting the type of element to add to a PDF document.
 * These interfaces are web-specific.
 */

/**
 * @description Props for the ElementTypePopover component.
 */
export interface ElementTypePopoverProps {
  /** Whether the popover is visible */
  isOpen: boolean;
  /** X position relative to viewport */
  x: number;
  /** Y position relative to viewport */
  y: number;
  /** Callback when signature is selected */
  onSelectSignature: () => void;
  /** Callback when text is selected */
  onSelectText: () => void;
  /** Callback when date is selected */
  onSelectDate: () => void;
  /** Callback when popover should be closed */
  onClose: () => void;
}

