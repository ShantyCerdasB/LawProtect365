/**
 * @fileoverview Use Pending Element State Hook Tests
 * @summary Tests for the usePendingElementState hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePendingElementState } from '@/modules/documents/hooks/usePendingElementState';
import { PdfElementType } from '@lawprotect/frontend-core';

describe('usePendingElementState', () => {
  it('should initialize with null pending values', () => {
    const { result } = renderHook(() => usePendingElementState());

    expect(result.current.pendingCoordinates).toBeNull();
    expect(result.current.pendingSignatureImage).toBeNull();
    expect(result.current.pendingText).toBeNull();
    expect(result.current.pendingDate).toBeNull();
  });

  it('should initialize with default dimensions', () => {
    const { result } = renderHook(() => usePendingElementState());

    expect(result.current.pendingSignatureWidth).toBe(150);
    expect(result.current.pendingSignatureHeight).toBe(60);
    expect(result.current.pendingTextFontSize).toBe(12);
    expect(result.current.pendingDateFontSize).toBe(12);
    expect(result.current.pendingDateFormat).toBe('MM/DD/YYYY');
  });

  it('should set pending coordinates', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.setPendingCoordinates({ x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 });
    });

    expect(result.current.pendingCoordinates).toMatchObject({ x: 100, y: 200, pageNumber: 1 });
  });

  it('should update signature preview with normalized data URL', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignaturePreview('data:image/png;base64,test123');
    });

    expect(result.current.pendingSignatureImage).toBe('data:image/png;base64,test123');
  });

  it('should not update signature preview with empty string', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignaturePreview('');
    });

    expect(result.current.pendingSignatureImage).toBeNull();
  });

  it('should not update signature preview with whitespace only', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignaturePreview('   ');
    });

    expect(result.current.pendingSignatureImage).toBeNull();
  });

  it('should update text preview', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateTextPreview('Test text', 16);
    });

    expect(result.current.pendingText).toBe('Test text');
    expect(result.current.pendingTextFontSize).toBe(16);
  });

  it('should update date preview', () => {
    const { result } = renderHook(() => usePendingElementState());
    const testDate = new Date('2024-01-15');

    act(() => {
      result.current.updateDatePreview(testDate, 'DD/MM/YYYY', 14);
    });

    expect(result.current.pendingDate).toEqual(testDate);
    expect(result.current.pendingDateFormat).toBe('DD/MM/YYYY');
    expect(result.current.pendingDateFontSize).toBe(14);
  });

  it('should update signature size', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignatureSize(200, 80);
    });

    expect(result.current.pendingSignatureWidth).toBe(200);
    expect(result.current.pendingSignatureHeight).toBe(80);
  });

  it('should clear all pending state', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.setPendingCoordinates({ x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 });
      result.current.updateSignaturePreview('data:image/png;base64,test');
      result.current.updateTextPreview('Test', 14);
      result.current.updateDatePreview(new Date(), 'DD/MM/YYYY', 14);
      result.current.updateSignatureSize(200, 80);
    });

    act(() => {
      result.current.clearPendingState();
    });

    expect(result.current.pendingCoordinates).toBeNull();
    expect(result.current.pendingSignatureImage).toBeNull();
    expect(result.current.pendingText).toBeNull();
    expect(result.current.pendingDate).toBeNull();
    expect(result.current.pendingSignatureWidth).toBe(150);
    expect(result.current.pendingSignatureHeight).toBe(60);
    expect(result.current.pendingTextFontSize).toBe(12);
    expect(result.current.pendingDateFontSize).toBe(12);
    expect(result.current.pendingDateFormat).toBe('MM/DD/YYYY');
  });

  it('should clear pending signature element', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignaturePreview('data:image/png;base64,test');
      result.current.updateSignatureSize(200, 80);
    });

    act(() => {
      result.current.clearPendingElement(PdfElementType.Signature);
    });

    expect(result.current.pendingSignatureImage).toBeNull();
    expect(result.current.pendingSignatureWidth).toBe(150);
    expect(result.current.pendingSignatureHeight).toBe(60);
  });

  it('should clear pending text element', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateTextPreview('Test text', 16);
    });

    act(() => {
      result.current.clearPendingElement(PdfElementType.Text);
    });

    expect(result.current.pendingText).toBeNull();
    expect(result.current.pendingTextFontSize).toBe(12);
  });

  it('should clear pending date element', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateDatePreview(new Date('2024-01-15'), 'DD/MM/YYYY', 14);
    });

    act(() => {
      result.current.clearPendingElement(PdfElementType.Date);
    });

    expect(result.current.pendingDate).toBeNull();
    expect(result.current.pendingDateFormat).toBe('MM/DD/YYYY');
    expect(result.current.pendingDateFontSize).toBe(12);
  });

  it('should not affect other element types when clearing one', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateSignaturePreview('data:image/png;base64,test');
      result.current.updateTextPreview('Test text', 16);
      result.current.updateDatePreview(new Date(), 'DD/MM/YYYY', 14);
    });

    act(() => {
      result.current.clearPendingElement(PdfElementType.Text);
    });

    expect(result.current.pendingSignatureImage).toBe('data:image/png;base64,test');
    expect(result.current.pendingText).toBeNull();
    expect(result.current.pendingDate).not.toBeNull();
  });

  it('should handle multiple updates to same element type', () => {
    const { result } = renderHook(() => usePendingElementState());

    act(() => {
      result.current.updateTextPreview('First text', 12);
    });

    expect(result.current.pendingText).toBe('First text');

    act(() => {
      result.current.updateTextPreview('Second text', 16);
    });

    expect(result.current.pendingText).toBe('Second text');
    expect(result.current.pendingTextFontSize).toBe(16);
  });
});


