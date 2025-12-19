/**
 * @fileoverview Use Modal State Hook Tests
 * @summary Tests for the useModalState hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useModalState } from '@/modules/documents/hooks/useModalState';
import { PdfElementType } from '@lawprotect/frontend-core';

describe('useModalState', () => {
  it('should initialize with closed modal and popover', () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isPopoverOpen).toBe(false);
    expect(result.current.modalType).toBeNull();
    expect(result.current.popoverPosition).toBeNull();
  });

  it('should open modal with specified type', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModal(PdfElementType.Signature);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.modalType).toBe(PdfElementType.Signature);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModal(PdfElementType.Signature);
    });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.modalType).toBeNull();
  });

  it('should open popover at specified position', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openPopover(100, 200);
    });

    expect(result.current.isPopoverOpen).toBe(true);
    expect(result.current.popoverPosition).toEqual({ x: 100, y: 200 });
  });

  it('should close popover', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.closePopover();
    });

    expect(result.current.isPopoverOpen).toBe(false);
    expect(result.current.popoverPosition).toBeNull();
  });

  it('should open modal from popover and preserve state', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.openModalFromPopover(PdfElementType.Text);
    });

    expect(result.current.isPopoverOpen).toBe(false);
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.modalType).toBe(PdfElementType.Text);
  });

  it('should handle popover close without clearing when modal is opening', () => {
    const { result } = renderHook(() => useModalState());
    const mockOnClear = jest.fn();

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.openModalFromPopover(PdfElementType.Date);
    });

    act(() => {
      result.current.handlePopoverClose(mockOnClear);
    });

    expect(mockOnClear).not.toHaveBeenCalled();
  });

  it('should call onClear when popover closes and modal is not opening', () => {
    const { result } = renderHook(() => useModalState());
    const mockOnClear = jest.fn();

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.handlePopoverClose(mockOnClear);
    });

    expect(mockOnClear).toHaveBeenCalledTimes(1);
    expect(result.current.isPopoverOpen).toBe(false);
  });

  it('should not call onClear when modal is open', () => {
    const { result } = renderHook(() => useModalState());
    const mockOnClear = jest.fn();

    act(() => {
      result.current.openModal(PdfElementType.Signature);
    });

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.handlePopoverClose(mockOnClear);
    });

    expect(mockOnClear).not.toHaveBeenCalled();
  });

  it('should handle multiple modal type changes', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModal(PdfElementType.Signature);
    });

    expect(result.current.modalType).toBe(PdfElementType.Signature);

    act(() => {
      result.current.closeModal();
    });

    act(() => {
      result.current.openModal(PdfElementType.Text);
    });

    expect(result.current.modalType).toBe(PdfElementType.Text);
  });

  it('should handle popover position updates', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openPopover(50, 75);
    });

    expect(result.current.popoverPosition).toEqual({ x: 50, y: 75 });

    act(() => {
      result.current.closePopover();
    });

    act(() => {
      result.current.openPopover(200, 300);
    });

    expect(result.current.popoverPosition).toEqual({ x: 200, y: 300 });
  });

  it('should work without onClear callback', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.handlePopoverClose();
    });

    expect(result.current.isPopoverOpen).toBe(false);
    expect(result.current.popoverPosition).toBeNull();
  });

  it('should reset opening modal flag after timeout', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useModalState());
    const mockOnClear = jest.fn();

    act(() => {
      result.current.openPopover(100, 200);
    });

    act(() => {
      result.current.openModalFromPopover(PdfElementType.Signature);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handlePopoverClose(mockOnClear);
    });

    expect(mockOnClear).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});




