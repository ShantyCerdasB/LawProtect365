/**
 * @fileoverview Use Modal State - Hook for managing modal and popover state
 * @summary React hook for managing UI modal and popover state
 * @description
 * Manages state for modals and popovers including open/close state, modal type,
 * popover position, and coordination between modals and popovers to prevent
 * state conflicts. This is a web-specific hook for UI state management.
 */

import { useState, useRef, useCallback } from 'react';
import { PdfElementType } from '@lawprotect/frontend-core';
import type { UseModalStateResult } from '../interfaces';

/**
 * @description Hook for managing modal and popover state.
 * @returns Modal and popover state and handlers
 */
export function useModalState(): UseModalStateResult {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PdfElementType | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isOpeningModalRef = useRef(false);

  /**
   * @description Opens a modal of the specified type.
   * @param type Type of modal to open
   */
  const openModal = useCallback((type: PdfElementType) => {
    setModalType(type);
    setIsModalOpen(true);
  }, []);

  /**
   * @description Closes the modal.
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalType(null);
  }, []);

  /**
   * @description Opens popover at specified position.
   * @param x X coordinate for popover position
   * @param y Y coordinate for popover position
   */
  const openPopover = useCallback((x: number, y: number) => {
    setPopoverPosition({ x, y });
    setIsPopoverOpen(true);
  }, []);

  /**
   * @description Closes the popover.
   */
  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
    setPopoverPosition(null);
  }, []);

  /**
   * @description Opens modal from popover, preserving coordinates.
   * @param type Type of modal to open
   * @description
   * Sets a flag to prevent popover from clearing coordinates when closing,
   * then closes popover and opens modal. This ensures coordinates are preserved
   * when transitioning from popover to modal.
   */
  const openModalFromPopover = useCallback((type: PdfElementType) => {
    isOpeningModalRef.current = true;
    setIsPopoverOpen(false);
    setModalType(type);
    setIsModalOpen(true);
    
    setTimeout(() => {
      isOpeningModalRef.current = false;
    }, 100);
  }, []);

  /**
   * @description Handles popover close, checking if modal is opening.
   * @param onClear Optional callback to clear state if modal is not opening
   * @description
   * Closes popover and clears position. If modal is not opening and not already open,
   * calls onClear callback to allow parent to clear related state (e.g., coordinates).
   */
  const handlePopoverClose = useCallback((onClear?: () => void) => {
    setIsPopoverOpen(false);
    setPopoverPosition(null);
    
    if (!isOpeningModalRef.current && !isModalOpen && !modalType && onClear) {
      onClear();
    }
  }, [isModalOpen, modalType]);

  return {
    isModalOpen,
    modalType,
    popoverPosition,
    isPopoverOpen,
    openModal,
    closeModal,
    openPopover,
    closePopover,
    openModalFromPopover,
    handlePopoverClose,
  };
}

