/**
 * @fileoverview Tests for useDocumentEditing hook
 * @summary Unit tests for document editing hook
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentEditing } from '../../../../src/modules/documents/query/useDocumentEditing';
import { applyElementsToPdf } from '../../../../src/modules/documents/use-cases/applyElementsToPdf';

jest.mock('../../../../src/modules/documents/use-cases/applyElementsToPdf');

const mockApplyElementsToPdf = applyElementsToPdf as jest.MockedFunction<typeof applyElementsToPdf>;

describe('useDocumentEditing', () => {
  const mockPdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
  const mockPdfSource = mockPdfBytes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyElementsToPdf.mockResolvedValue(mockPdfBytes);
  });

  describe('initialization', () => {
    it('should initialize with empty arrays and default state', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );

      expect(result.current.signatures).toEqual([]);
      expect(result.current.texts).toEqual([]);
      expect(result.current.dates).toEqual([]);
      expect(result.current.isApplying).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('addSignature', () => {
    it('should add signature to signatures array', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('data:image/png;base64,test', coordinates);
      });

      expect(result.current.signatures).toHaveLength(1);
      expect(result.current.signatures[0]).toMatchObject({
        signatureImage: 'data:image/png;base64,test',
        coordinates,
      });
    });

    it('should add signature with width and height', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('data:image/png;base64,test', coordinates, 200, 100);
      });

      expect(result.current.signatures[0]).toMatchObject({
        width: 200,
        height: 100,
      });
    });

    it('should clear error when adding signature', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('data:image/png;base64,test', coordinates);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('addText', () => {
    it('should add text to texts array with default fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('Test Text', coordinates);
      });

      expect(result.current.texts).toHaveLength(1);
      expect(result.current.texts[0]).toMatchObject({
        text: 'Test Text',
        coordinates,
        fontSize: 12,
      });
    });

    it('should add text with custom fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('Test Text', coordinates, 16);
      });

      expect(result.current.texts[0].fontSize).toBe(16);
    });
  });

  describe('addDate', () => {
    it('should add date to dates array with default format and fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      const date = new Date('2024-01-15');

      act(() => {
        result.current.addDate(date, coordinates);
      });

      expect(result.current.dates).toHaveLength(1);
      expect(result.current.dates[0]).toMatchObject({
        date,
        coordinates,
        format: 'MM/DD/YYYY',
        fontSize: 12,
      });
    });

    it('should add date with custom format and fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      const date = new Date('2024-01-15');

      act(() => {
        result.current.addDate(date, coordinates, 'YYYY-MM-DD', 14);
      });

      expect(result.current.dates[0]).toMatchObject({
        format: 'YYYY-MM-DD',
        fontSize: 14,
      });
    });
  });

  describe('removeSignature', () => {
    it('should remove signature by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('sig1', coordinates);
        result.current.addSignature('sig2', coordinates);
        result.current.addSignature('sig3', coordinates);
      });

      expect(result.current.signatures).toHaveLength(3);

      act(() => {
        result.current.removeSignature(1);
      });

      expect(result.current.signatures).toHaveLength(2);
      expect(result.current.signatures[0].signatureImage).toBe('sig1');
      expect(result.current.signatures[1].signatureImage).toBe('sig3');
    });
  });

  describe('removeText', () => {
    it('should remove text by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('text1', coordinates);
        result.current.addText('text2', coordinates);
      });

      act(() => {
        result.current.removeText(0);
      });

      expect(result.current.texts).toHaveLength(1);
      expect(result.current.texts[0].text).toBe('text2');
    });
  });

  describe('removeDate', () => {
    it('should remove date by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addDate(new Date('2024-01-01'), coordinates);
        result.current.addDate(new Date('2024-01-02'), coordinates);
      });

      act(() => {
        result.current.removeDate(0);
      });

      expect(result.current.dates).toHaveLength(1);
    });
  });

  describe('updateSignatureCoordinates', () => {
    it('should update signature coordinates by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates1 = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      const coordinates2 = { pageNumber: 2, x: 300, y: 400, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('sig1', coordinates1);
      });

      act(() => {
        result.current.updateSignatureCoordinates(0, coordinates2);
      });

      expect(result.current.signatures[0].coordinates).toEqual(coordinates2);
    });
  });

  describe('updateTextCoordinates', () => {
    it('should update text coordinates by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates1 = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      const coordinates2 = { pageNumber: 2, x: 300, y: 400, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('text', coordinates1);
      });

      act(() => {
        result.current.updateTextCoordinates(0, coordinates2);
      });

      expect(result.current.texts[0].coordinates).toEqual(coordinates2);
    });
  });

  describe('updateDateCoordinates', () => {
    it('should update date coordinates by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates1 = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      const coordinates2 = { pageNumber: 2, x: 300, y: 400, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addDate(new Date(), coordinates1);
      });

      act(() => {
        result.current.updateDateCoordinates(0, coordinates2);
      });

      expect(result.current.dates[0].coordinates).toEqual(coordinates2);
    });
  });

  describe('updateTextFontSize', () => {
    it('should update text font size by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('text', coordinates, 12);
      });

      act(() => {
        result.current.updateTextFontSize(0, 18);
      });

      expect(result.current.texts[0].fontSize).toBe(18);
    });
  });

  describe('updateDateFontSize', () => {
    it('should update date font size by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addDate(new Date(), coordinates, 'MM/DD/YYYY', 12);
      });

      act(() => {
        result.current.updateDateFontSize(0, 16);
      });

      expect(result.current.dates[0].fontSize).toBe(16);
    });
  });

  describe('updateSignatureSize', () => {
    it('should update signature size by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('sig', coordinates, 100, 50);
      });

      act(() => {
        result.current.updateSignatureSize(0, 200, 100);
      });

      expect(result.current.signatures[0].width).toBe(200);
      expect(result.current.signatures[0].height).toBe(100);
    });
  });

  describe('clearAll', () => {
    it('should clear all elements', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfSource })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('sig', coordinates);
        result.current.addText('text', coordinates);
        result.current.addDate(new Date(), coordinates);
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.signatures).toHaveLength(0);
      expect(result.current.texts).toHaveLength(0);
      expect(result.current.dates).toHaveLength(0);
    });
  });

  describe('applyElementsAsBytes', () => {
    it('should apply elements and return Uint8Array when pdfSource is Uint8Array', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addSignature('sig', coordinates);
      });

      let appliedBytes: Uint8Array;
      await act(async () => {
        appliedBytes = await result.current.applyElementsAsBytes();
      });

      expect(mockApplyElementsToPdf).toHaveBeenCalledWith(
        mockPdfBytes,
        expect.arrayContaining([expect.objectContaining({ signatureImage: 'sig' })]),
        [],
        []
      );
      expect(appliedBytes!).toEqual(mockPdfBytes);
      expect(result.current.isApplying).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should convert base64 string to Uint8Array before applying', async () => {
      const base64Pdf = btoa(String.fromCharCode(...mockPdfBytes));
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: base64Pdf })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('text', coordinates);
      });

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(mockApplyElementsToPdf).toHaveBeenCalled();
      const callArgs = mockApplyElementsToPdf.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Uint8Array);
    });

    it('should handle base64 string with data URL prefix', async () => {
      const base64Pdf = `data:application/pdf;base64,${btoa(String.fromCharCode(...mockPdfBytes))}`;
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: base64Pdf })
      );

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(mockApplyElementsToPdf).toHaveBeenCalled();
    });

    it('should convert ArrayBuffer to Uint8Array before applying', async () => {
      const arrayBuffer = mockPdfBytes.buffer;
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: arrayBuffer })
      );

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(mockApplyElementsToPdf).toHaveBeenCalled();
      const callArgs = mockApplyElementsToPdf.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Uint8Array);
    });

    it('should set isApplying to true during application', async () => {
      let resolveApply: (value: Uint8Array) => void;
      const applyPromise = new Promise<Uint8Array>((resolve) => {
        resolveApply = resolve;
      });
      mockApplyElementsToPdf.mockReturnValue(applyPromise);

      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );

      act(() => {
        result.current.addSignature('sig', { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 });
      });

      let applyPromise2: Promise<Uint8Array>;
      await act(async () => {
        applyPromise2 = result.current.applyElementsAsBytes();
      });

      await waitFor(() => {
        expect(result.current.isApplying).toBe(true);
      });

      resolveApply!(mockPdfBytes);
      await act(async () => {
        await applyPromise2!;
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should set error when application fails', async () => {
      const error = new Error('PDF processing failed');
      mockApplyElementsToPdf.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );

      act(() => {
        result.current.addSignature('sig', { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 });
      });

      await act(async () => {
        await expect(result.current.applyElementsAsBytes()).rejects.toThrow('PDF processing failed');
      });

      expect(result.current.error).toBe('PDF processing failed');
      expect(result.current.isApplying).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      mockApplyElementsToPdf.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );

      await act(async () => {
        await expect(result.current.applyElementsAsBytes()).rejects.toBe('String error');
      });

      expect(result.current.error).toBe('Failed to apply elements to PDF');
    });
  });

  describe('applyElements', () => {
    it('should apply elements and return base64 string', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );
      const coordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.addText('text', coordinates);
      });

      let base64Result: string;
      await act(async () => {
        base64Result = await result.current.applyElements();
      });

      expect(mockApplyElementsToPdf).toHaveBeenCalled();
      expect(base64Result!).toBe(btoa(String.fromCharCode(...mockPdfBytes)));
    });

    it('should handle errors from applyElementsAsBytes', async () => {
      const error = new Error('Processing failed');
      mockApplyElementsToPdf.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: mockPdfBytes })
      );

      await act(async () => {
        await expect(result.current.applyElements()).rejects.toThrow('Processing failed');
      });

      expect(result.current.error).toBe('Processing failed');
    });
  });
});
