/**
 * @fileoverview useDocumentEditing Hook Tests - Ensures useDocumentEditing works correctly
 * @summary Tests for modules/documents/query/useDocumentEditing.ts
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useDocumentEditing } from '../../../../src/modules/documents/query/useDocumentEditing';
import type { PDFCoordinates } from '../../../../src/modules/documents/types';
import {
  createTestPdf,
  createTestSignatureImage,
  createBase64FromBytes,
} from '../helpers/testUtils';

describe('useDocumentEditing', () => {
  let testPdfBytes: Uint8Array;
  let testPdfBase64: string;
  let testPdfArrayBuffer: ArrayBuffer;

  beforeAll(async () => {
    testPdfBytes = await createTestPdf();
    testPdfBase64 = createBase64FromBytes(testPdfBytes);
    testPdfArrayBuffer = testPdfBytes.buffer as ArrayBuffer;
  });

  const createCoordinates = (): PDFCoordinates => ({
    x: 100,
    y: 200,
    pageNumber: 1,
    pageWidth: 612,
    pageHeight: 792,
  });

  it('initializes with empty arrays', () => {
    const { result } = renderHook(() =>
      useDocumentEditing({ pdfSource: testPdfBytes })
    );

    expect(result.current.signatures).toEqual([]);
    expect(result.current.texts).toEqual([]);
    expect(result.current.dates).toEqual([]);
    expect(result.current.isApplying).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('addSignature', () => {
    it('should add a signature', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      const signatureImage = createTestSignatureImage();
      const coordinates = createCoordinates();

      act(() => {
        result.current.addSignature(signatureImage, coordinates);
      });

      expect(result.current.signatures).toHaveLength(1);
      expect(result.current.signatures[0].signatureImage).toBe(signatureImage);
      expect(result.current.signatures[0].coordinates).toEqual(coordinates);
    });

    it('should add signature with width and height', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      const signatureImage = createTestSignatureImage();
      const coordinates = createCoordinates();

      act(() => {
        result.current.addSignature(signatureImage, coordinates, 100, 50);
      });

      expect(result.current.signatures[0].width).toBe(100);
      expect(result.current.signatures[0].height).toBe(50);
    });

    it('should clear error when adding signature', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('addText', () => {
    it('should add text', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      const coordinates = createCoordinates();

      act(() => {
        result.current.addText('Test Text', coordinates);
      });

      expect(result.current.texts).toHaveLength(1);
      expect(result.current.texts[0].text).toBe('Test Text');
      expect(result.current.texts[0].coordinates).toEqual(coordinates);
      expect(result.current.texts[0].fontSize).toBe(12);
    });

    it('should add text with custom fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates(), 18);
      });

      expect(result.current.texts[0].fontSize).toBe(18);
    });
  });

  describe('addDate', () => {
    it('should add date', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      const date = new Date(2024, 0, 15);
      const coordinates = createCoordinates();

      act(() => {
        result.current.addDate(date, coordinates);
      });

      expect(result.current.dates).toHaveLength(1);
      expect(result.current.dates[0].date).toEqual(date);
      expect(result.current.dates[0].coordinates).toEqual(coordinates);
      expect(result.current.dates[0].format).toBe('MM/DD/YYYY');
      expect(result.current.dates[0].fontSize).toBe(12);
    });

    it('should add date with custom format and fontSize', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      const date = new Date(2024, 0, 15);

      act(() => {
        result.current.addDate(date, createCoordinates(), 'DD-MM-YYYY', 16);
      });

      expect(result.current.dates[0].format).toBe('DD-MM-YYYY');
      expect(result.current.dates[0].fontSize).toBe(16);
    });
  });

  describe('removeSignature', () => {
    it('should remove signature by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
      });

      expect(result.current.signatures).toHaveLength(3);

      act(() => {
        result.current.removeSignature(1);
      });

      expect(result.current.signatures).toHaveLength(2);
    });
  });

  describe('removeText', () => {
    it('should remove text by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Text 1', createCoordinates());
        result.current.addText('Text 2', createCoordinates());
      });

      act(() => {
        result.current.removeText(0);
      });

      expect(result.current.texts).toHaveLength(1);
      expect(result.current.texts[0].text).toBe('Text 2');
    });
  });

  describe('removeDate', () => {
    it('should remove date by index', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addDate(new Date(), createCoordinates());
        result.current.addDate(new Date(), createCoordinates());
      });

      act(() => {
        result.current.removeDate(0);
      });

      expect(result.current.dates).toHaveLength(1);
    });
  });

  describe('updateSignatureCoordinates', () => {
    it('should update signature coordinates', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
      });

      const newCoordinates: PDFCoordinates = { x: 200, y: 300, pageNumber: 1, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.updateSignatureCoordinates(0, newCoordinates);
      });

      expect(result.current.signatures[0].coordinates).toEqual(newCoordinates);
    });
  });

  describe('updateTextCoordinates', () => {
    it('should update text coordinates', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      const newCoordinates: PDFCoordinates = { x: 150, y: 250, pageNumber: 1, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.updateTextCoordinates(0, newCoordinates);
      });

      expect(result.current.texts[0].coordinates).toEqual(newCoordinates);
    });
  });

  describe('updateDateCoordinates', () => {
    it('should update date coordinates', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addDate(new Date(), createCoordinates());
      });

      const newCoordinates: PDFCoordinates = { x: 300, y: 400, pageNumber: 1, pageWidth: 612, pageHeight: 792 };

      act(() => {
        result.current.updateDateCoordinates(0, newCoordinates);
      });

      expect(result.current.dates[0].coordinates).toEqual(newCoordinates);
    });
  });

  describe('updateTextFontSize', () => {
    it('should update text font size', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      act(() => {
        result.current.updateTextFontSize(0, 20);
      });

      expect(result.current.texts[0].fontSize).toBe(20);
    });
  });

  describe('updateDateFontSize', () => {
    it('should update date font size', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addDate(new Date(), createCoordinates());
      });

      act(() => {
        result.current.updateDateFontSize(0, 18);
      });

      expect(result.current.dates[0].fontSize).toBe(18);
    });
  });

  describe('updateSignatureSize', () => {
    it('should update signature size', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
      });

      act(() => {
        result.current.updateSignatureSize(0, 120, 60);
      });

      expect(result.current.signatures[0].width).toBe(120);
      expect(result.current.signatures[0].height).toBe(60);
    });
  });

  describe('clearAll', () => {
    it('should clear all elements', () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
        result.current.addText('Test', createCoordinates());
        result.current.addDate(new Date(), createCoordinates());
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
    it('should apply elements and return Uint8Array', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addSignature(createTestSignatureImage(), createCoordinates());
        result.current.addText('Test Text', createCoordinates());
        result.current.addDate(new Date(), createCoordinates());
      });

      let modifiedPdf: Uint8Array;
      await act(async () => {
        modifiedPdf = await result.current.applyElementsAsBytes();
      });

      expect(modifiedPdf!).toBeInstanceOf(Uint8Array);
      expect(modifiedPdf!.length).toBeGreaterThan(0);
      expect(result.current.isApplying).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle Uint8Array pdfSource', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should handle ArrayBuffer pdfSource', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfArrayBuffer })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should handle base64 string pdfSource', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBase64 })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should handle base64 string with data URL prefix', async () => {
      const dataUrlPdf = `data:application/pdf;base64,${testPdfBase64}`;
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: dataUrlPdf })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        await result.current.applyElementsAsBytes();
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should set error on failure', async () => {
      const invalidPdf = new Uint8Array([1, 2, 3]);
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: invalidPdf })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        try {
          await result.current.applyElementsAsBytes();
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isApplying).toBe(false);
    });
  });

  describe('applyElements', () => {
    it('should apply elements and return base64 string', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      let base64Result: string;
      await act(async () => {
        base64Result = await result.current.applyElements();
      });

      expect(typeof base64Result!).toBe('string');
      expect(base64Result!.length).toBeGreaterThan(0);
      expect(result.current.isApplying).toBe(false);
    });

    it('should set isApplying during operation', async () => {
      const { result } = renderHook(() =>
        useDocumentEditing({ pdfSource: testPdfBytes })
      );

      act(() => {
        result.current.addText('Test', createCoordinates());
      });

      await act(async () => {
        await result.current.applyElements();
      });

      expect(result.current.isApplying).toBe(false);
    });
  });
});


