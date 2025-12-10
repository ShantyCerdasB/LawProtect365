/**
 * @fileoverview Modal State Interfaces - Types for modal and popover state hook
 * @summary Type definitions for modal and popover state management
 * @description
 * Defines interfaces used by the web-specific modal state hook that manages
 * modals and popovers including open/close state and coordination between them.
 * These interfaces are web-specific.
 */

import { PdfElementType } from '@lawprotect/frontend-core';

/**
 * @description Result of the useModalState hook.
 */
export interface UseModalStateResult {
  /** Whether modal is open */
  isModalOpen: boolean;
  /** Type of modal currently open, or null */
  modalType: PdfElementType | null;
  /** Popover position, or null if popover is not shown */
  popoverPosition: { x: number; y: number } | null;
  /** Whether popover is open */
  isPopoverOpen: boolean;
  /** Opens a modal of the specified type */
  openModal: (type: PdfElementType) => void;
  /** Closes the modal */
  closeModal: () => void;
  /** Opens popover at specified position */
  openPopover: (x: number, y: number) => void;
  /** Closes the popover */
  closePopover: () => void;
  /** Opens modal and closes popover, preserving coordinates */
  openModalFromPopover: (type: PdfElementType) => void;
  /** Handler for popover close that checks if modal is opening */
  handlePopoverClose: (onClear?: () => void) => void;
}

