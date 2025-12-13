/**
 * @fileoverview Tests for useElementHandlers hook
 * @summary Unit tests for element handlers hook
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useElementHandlers } from '../../../../src/modules/documents/query/useElementHandlers';
import { PdfElementType } from '../../../../src/modules/documents/enums';

describe('useElementHandlers', () => {
  let mockUpdateSignatureCoordinates: jest.Mock;
  let mockUpdateTextCoordinates: jest.Mock;
  let mockUpdateDateCoordinates: jest.Mock;
  let mockUpdateTextFontSize: jest.Mock;
  let mockUpdateDateFontSize: jest.Mock;
  let mockUpdateSignatureSize: jest.Mock;
  let mockRemoveSignature: jest.Mock;
  let mockRemoveText: jest.Mock;
  let mockRemoveDate: jest.Mock;

  beforeEach(() => {
    mockUpdateSignatureCoordinates = jest.fn();
    mockUpdateTextCoordinates = jest.fn();
    mockUpdateDateCoordinates = jest.fn();
    mockUpdateTextFontSize = jest.fn();
    mockUpdateDateFontSize = jest.fn();
    mockUpdateSignatureSize = jest.fn();
    mockRemoveSignature = jest.fn();
    mockRemoveText = jest.fn();
    mockRemoveDate = jest.fn();
  });

  const createConfig = () => ({
    updateSignatureCoordinates: mockUpdateSignatureCoordinates,
    updateTextCoordinates: mockUpdateTextCoordinates,
    updateDateCoordinates: mockUpdateDateCoordinates,
    updateTextFontSize: mockUpdateTextFontSize,
    updateDateFontSize: mockUpdateDateFontSize,
    updateSignatureSize: mockUpdateSignatureSize,
    removeSignature: mockRemoveSignature,
    removeText: mockRemoveText,
    removeDate: mockRemoveDate,
  });

  describe('handleElementMove', () => {
    it('should call updateSignatureCoordinates for Signature element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.handleElementMove(PdfElementType.Signature, 0, coordinates);
      });

      expect(mockUpdateSignatureCoordinates).toHaveBeenCalledWith(0, coordinates);
      expect(mockUpdateTextCoordinates).not.toHaveBeenCalled();
      expect(mockUpdateDateCoordinates).not.toHaveBeenCalled();
    });

    it('should call updateTextCoordinates for Text element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.handleElementMove(PdfElementType.Text, 1, coordinates);
      });

      expect(mockUpdateTextCoordinates).toHaveBeenCalledWith(1, coordinates);
      expect(mockUpdateSignatureCoordinates).not.toHaveBeenCalled();
      expect(mockUpdateDateCoordinates).not.toHaveBeenCalled();
    });

    it('should call updateDateCoordinates for Date element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));
      const coordinates = { pageNumber: 2, x: 300, y: 400, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.handleElementMove(PdfElementType.Date, 2, coordinates);
      });

      expect(mockUpdateDateCoordinates).toHaveBeenCalledWith(2, coordinates);
      expect(mockUpdateSignatureCoordinates).not.toHaveBeenCalled();
      expect(mockUpdateTextCoordinates).not.toHaveBeenCalled();
    });
  });

  describe('handleElementDelete', () => {
    it('should call removeSignature for Signature element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Signature, 0);
      });

      expect(mockRemoveSignature).toHaveBeenCalledWith(0);
      expect(mockRemoveText).not.toHaveBeenCalled();
      expect(mockRemoveDate).not.toHaveBeenCalled();
    });

    it('should call removeText for Text element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Text, 1);
      });

      expect(mockRemoveText).toHaveBeenCalledWith(1);
      expect(mockRemoveSignature).not.toHaveBeenCalled();
      expect(mockRemoveDate).not.toHaveBeenCalled();
    });

    it('should call removeDate for Date element type', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleElementDelete(PdfElementType.Date, 2);
      });

      expect(mockRemoveDate).toHaveBeenCalledWith(2);
      expect(mockRemoveSignature).not.toHaveBeenCalled();
      expect(mockRemoveText).not.toHaveBeenCalled();
    });
  });

  describe('handleTextResize', () => {
    it('should call updateTextFontSize with index and fontSize', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleTextResize(0, 16);
      });

      expect(mockUpdateTextFontSize).toHaveBeenCalledWith(0, 16);
      expect(mockUpdateDateFontSize).not.toHaveBeenCalled();
      expect(mockUpdateSignatureSize).not.toHaveBeenCalled();
    });

    it('should handle different font sizes', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleTextResize(1, 20);
      });

      expect(mockUpdateTextFontSize).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('handleDateResize', () => {
    it('should call updateDateFontSize with index and fontSize', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleDateResize(0, 14);
      });

      expect(mockUpdateDateFontSize).toHaveBeenCalledWith(0, 14);
      expect(mockUpdateTextFontSize).not.toHaveBeenCalled();
      expect(mockUpdateSignatureSize).not.toHaveBeenCalled();
    });

    it('should handle different font sizes', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleDateResize(2, 18);
      });

      expect(mockUpdateDateFontSize).toHaveBeenCalledWith(2, 18);
    });
  });

  describe('handleSignatureResize', () => {
    it('should call updateSignatureSize with index, width, and height', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleSignatureResize(0, 200, 100);
      });

      expect(mockUpdateSignatureSize).toHaveBeenCalledWith(0, 200, 100);
      expect(mockUpdateTextFontSize).not.toHaveBeenCalled();
      expect(mockUpdateDateFontSize).not.toHaveBeenCalled();
    });

    it('should handle different sizes', () => {
      const { result } = renderHook(() => useElementHandlers(createConfig()));

      act(() => {
        result.current.handleSignatureResize(1, 300, 150);
      });

      expect(mockUpdateSignatureSize).toHaveBeenCalledWith(1, 300, 150);
    });
  });

  describe('callback dependencies', () => {
    it('should use updated callbacks when config changes', () => {
      const { result, rerender } = renderHook(
        (config) => useElementHandlers(config),
        { initialProps: createConfig() }
      );

      const newUpdateSignatureCoordinates = jest.fn();
      const newConfig = {
        ...createConfig(),
        updateSignatureCoordinates: newUpdateSignatureCoordinates,
      };

      rerender(newConfig);

      act(() => {
        result.current.handleElementMove(PdfElementType.Signature, 0, { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 });
      });

      expect(newUpdateSignatureCoordinates).toHaveBeenCalled();
      expect(mockUpdateSignatureCoordinates).not.toHaveBeenCalled();
    });
  });
});
