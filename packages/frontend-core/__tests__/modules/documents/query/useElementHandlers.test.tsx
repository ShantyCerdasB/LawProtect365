/**
 * @fileoverview useElementHandlers Hook Tests - Ensures useElementHandlers works correctly
 * @summary Tests for modules/documents/query/useElementHandlers.ts
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useElementHandlers } from '../../../../src/modules/documents/query/useElementHandlers';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { PDFCoordinates } from '../../../../src/modules/documents/types';

describe('useElementHandlers', () => {
  const createCoordinates = (): PDFCoordinates => ({
    x: 100,
    y: 200,
    pageNumber: 1,
    pageWidth: 612,
    pageHeight: 792,
  });

  const createMockConfig = () => {
    const updateSignatureCoordinates = jest.fn();
    const updateTextCoordinates = jest.fn();
    const updateDateCoordinates = jest.fn();
    const updateTextFontSize = jest.fn();
    const updateDateFontSize = jest.fn();
    const updateSignatureSize = jest.fn();
    const removeSignature = jest.fn();
    const removeText = jest.fn();
    const removeDate = jest.fn();

    return {
      updateSignatureCoordinates,
      updateTextCoordinates,
      updateDateCoordinates,
      updateTextFontSize,
      updateDateFontSize,
      updateSignatureSize,
      removeSignature,
      removeText,
      removeDate,
    };
  };

  describe('handleElementMove', () => {
    it('should call updateSignatureCoordinates for signature element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));
      const coordinates = createCoordinates();

      act(() => {
        result.current.handleElementMove(PdfElementType.Signature, 0, coordinates);
      });

      expect(config.updateSignatureCoordinates).toHaveBeenCalledWith(0, coordinates);
      expect(config.updateTextCoordinates).not.toHaveBeenCalled();
      expect(config.updateDateCoordinates).not.toHaveBeenCalled();
    });

    it('should call updateTextCoordinates for text element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));
      const coordinates = createCoordinates();

      act(() => {
        result.current.handleElementMove(PdfElementType.Text, 1, coordinates);
      });

      expect(config.updateTextCoordinates).toHaveBeenCalledWith(1, coordinates);
      expect(config.updateSignatureCoordinates).not.toHaveBeenCalled();
      expect(config.updateDateCoordinates).not.toHaveBeenCalled();
    });

    it('should call updateDateCoordinates for date element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));
      const coordinates = createCoordinates();

      act(() => {
        result.current.handleElementMove(PdfElementType.Date, 2, coordinates);
      });

      expect(config.updateDateCoordinates).toHaveBeenCalledWith(2, coordinates);
      expect(config.updateSignatureCoordinates).not.toHaveBeenCalled();
      expect(config.updateTextCoordinates).not.toHaveBeenCalled();
    });
  });

  describe('handleElementDelete', () => {
    it('should call removeSignature for signature element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Signature, 0);
      });

      expect(config.removeSignature).toHaveBeenCalledWith(0);
      expect(config.removeText).not.toHaveBeenCalled();
      expect(config.removeDate).not.toHaveBeenCalled();
    });

    it('should call removeText for text element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Text, 1);
      });

      expect(config.removeText).toHaveBeenCalledWith(1);
      expect(config.removeSignature).not.toHaveBeenCalled();
      expect(config.removeDate).not.toHaveBeenCalled();
    });

    it('should call removeDate for date element', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Date, 2);
      });

      expect(config.removeDate).toHaveBeenCalledWith(2);
      expect(config.removeSignature).not.toHaveBeenCalled();
      expect(config.removeText).not.toHaveBeenCalled();
    });
  });

  describe('handleTextResize', () => {
    it('should call updateTextFontSize', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleTextResize(0, 18);
      });

      expect(config.updateTextFontSize).toHaveBeenCalledWith(0, 18);
      expect(config.updateDateFontSize).not.toHaveBeenCalled();
      expect(config.updateSignatureSize).not.toHaveBeenCalled();
    });

    it('should handle different font sizes', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleTextResize(1, 24);
      });

      expect(config.updateTextFontSize).toHaveBeenCalledWith(1, 24);
    });
  });

  describe('handleDateResize', () => {
    it('should call updateDateFontSize', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleDateResize(0, 16);
      });

      expect(config.updateDateFontSize).toHaveBeenCalledWith(0, 16);
      expect(config.updateTextFontSize).not.toHaveBeenCalled();
      expect(config.updateSignatureSize).not.toHaveBeenCalled();
    });

    it('should handle different font sizes', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleDateResize(2, 20);
      });

      expect(config.updateDateFontSize).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('handleSignatureResize', () => {
    it('should call updateSignatureSize', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleSignatureResize(0, 100, 50);
      });

      expect(config.updateSignatureSize).toHaveBeenCalledWith(0, 100, 50);
      expect(config.updateTextFontSize).not.toHaveBeenCalled();
      expect(config.updateDateFontSize).not.toHaveBeenCalled();
    });

    it('should handle different sizes', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useElementHandlers(config));

      act(() => {
        result.current.handleSignatureResize(1, 120, 60);
      });

      expect(config.updateSignatureSize).toHaveBeenCalledWith(1, 120, 60);
    });
  });

  describe('callback memoization', () => {
    it('should maintain stable references', () => {
      const config = createMockConfig();
      const { result, rerender } = renderHook(() => useElementHandlers(config));

      const firstMove = result.current.handleElementMove;
      const firstDelete = result.current.handleElementDelete;
      const firstTextResize = result.current.handleTextResize;

      rerender();

      expect(result.current.handleElementMove).toBe(firstMove);
      expect(result.current.handleElementDelete).toBe(firstDelete);
      expect(result.current.handleTextResize).toBe(firstTextResize);
    });

    it('should update when config changes', () => {
      const config1 = createMockConfig();
      const { result, rerender } = renderHook(
        ({ config }) => useElementHandlers(config),
        { initialProps: { config: config1 } }
      );

      const firstMove = result.current.handleElementMove;

      const config2 = createMockConfig();
      rerender({ config: config2 });

      expect(result.current.handleElementMove).not.toBe(firstMove);
    });
  });
});


