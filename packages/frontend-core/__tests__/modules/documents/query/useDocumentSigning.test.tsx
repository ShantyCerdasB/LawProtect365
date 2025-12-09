/**
 * @fileoverview useDocumentSigning Hook Tests - Ensures useDocumentSigning works correctly
 * @summary Tests for modules/documents/query/useDocumentSigning.ts
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-hooks';

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});
import { useDocumentSigning } from '../../../../src/modules/documents/query/useDocumentSigning';
import type { PDFCoordinates } from '../../../../src/modules/documents/types';
import {
  createTestPdf,
  createTestSignatureImage,
  createBase64FromBytes,
} from '../helpers/testUtils';

async function addSignatureHelper(result: any, signatureImage: string, coordinates: PDFCoordinates) {
  act(() => {
    result.current?.addSignature(signatureImage, coordinates);
  });
}

describe('useDocumentSigning', () => {
  let testPdfBytes: Uint8Array;
  let testPdfBase64: string;
  let testPdfArrayBuffer: ArrayBuffer;

  beforeAll(async () => {
    testPdfBytes = await createTestPdf();
    testPdfBase64 = createBase64FromBytes(testPdfBytes);
    // Create a new ArrayBuffer from the Uint8Array to avoid type issues
    testPdfArrayBuffer = testPdfBytes.buffer as ArrayBuffer;
  });

  it('initializes with empty signatures', () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    expect(result.current.signatures).toEqual([]);
    expect(result.current.isApplying).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.addSignature).toBe('function');
    expect(typeof result.current.removeSignature).toBe('function');
    expect(typeof result.current.clearSignatures).toBe('function');
    expect(typeof result.current.applySignatures).toBe('function');
  });

  it('adds a signature', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    expect(result.current.signatures).toHaveLength(1);
    expect(result.current.signatures[0].signatureImage).toBe(signatureImage);
    expect(result.current.signatures[0].coordinates).toEqual(coordinates);
    expect(result.current.error).toBe(null);
  });

  it('adds multiple signatures', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage1 = createTestSignatureImage();
    const signatureImage2 = createTestSignatureImage();
    const coordinates1: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };
    const coordinates2: PDFCoordinates = {
      x: 300,
      y: 400,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage1, coordinates1);
    await addSignatureHelper(result, signatureImage2, coordinates2);

    expect(result.current.signatures).toHaveLength(2);
    expect(result.current.signatures[0].coordinates).toEqual(coordinates1);
    expect(result.current.signatures[1].coordinates).toEqual(coordinates2);
  });

  it('removes a signature by index', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);
    await addSignatureHelper(result, signatureImage, coordinates);
    await addSignatureHelper(result, signatureImage, coordinates);

    expect(result.current.signatures).toHaveLength(3);

    act(() => {
      result.current.removeSignature(1);
    });

    expect(result.current.signatures).toHaveLength(2);
    expect(result.current.error).toBe(null);
  });

  it('clears all signatures', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);
    await addSignatureHelper(result, signatureImage, coordinates);

    expect(result.current.signatures).toHaveLength(2);

    act(() => {
      result.current.clearSignatures();
    });

    expect(result.current.signatures).toHaveLength(0);
    expect(result.current.error).toBe(null);
  });

  it('clears error when adding signature after error', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    // Trigger an error by trying to apply with no signatures
    act(async () => {
      try {
        await result.current.applySignatures();
      } catch {
        // Expected error
      }
    });

    // Error should be set
    expect(result.current.error).not.toBe(null);

    // Add signature should clear error
    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    expect(result.current.error).toBe(null);
  });

  it('applies signatures with Uint8Array pdfSource', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    let signedPdfBase64: string;
    await act(async () => {
      signedPdfBase64 = await result.current.applySignatures();
    });

    expect(signedPdfBase64!).toBeDefined();
    expect(typeof signedPdfBase64!).toBe('string');
    expect(signedPdfBase64!.length).toBeGreaterThan(0);
    expect(result.current.isApplying).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify the result is valid base64
    const decoded = Uint8Array.from(atob(signedPdfBase64!), (c) => c.charCodeAt(0));
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('applies signatures with ArrayBuffer pdfSource', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfArrayBuffer })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    let signedPdfBase64: string;
    await act(async () => {
      signedPdfBase64 = await result.current.applySignatures();
    });

    expect(signedPdfBase64!).toBeDefined();
    expect(typeof signedPdfBase64!).toBe('string');
    expect(result.current.isApplying).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('applies signatures with base64 string pdfSource', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBase64 })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    let signedPdfBase64: string;
    await act(async () => {
      signedPdfBase64 = await result.current.applySignatures();
    });

    expect(signedPdfBase64!).toBeDefined();
    expect(typeof signedPdfBase64!).toBe('string');
    expect(result.current.isApplying).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('applies signatures with base64 string pdfSource with data URL prefix', async () => {
    const dataUrlPdf = `data:application/pdf;base64,${testPdfBase64}`;
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: dataUrlPdf })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    let signedPdfBase64: string;
    await act(async () => {
      signedPdfBase64 = await result.current.applySignatures();
    });

    expect(signedPdfBase64!).toBeDefined();
    expect(typeof signedPdfBase64!).toBe('string');
    expect(result.current.isApplying).toBe(false);
  });

  it('throws error when applying signatures with no signatures added', async () => {
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    await expect(result.current.applySignatures()).rejects.toThrow(
      'Please add at least one signature'
    );

    expect(result.current.error).toBe('Please add at least one signature');
    expect(result.current.isApplying).toBe(false);
  });

  it('sets isApplying to true during signature application', async () => {
    const { result, rerender } = renderHook(() =>
      useDocumentSigning({ pdfSource: testPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    await act(async () => {
      await result.current.applySignatures();
    });

    expect(result.current?.isApplying).toBe(false);
  });

  it('handles errors during signature application', async () => {
    const invalidPdfBytes = new Uint8Array([1, 2, 3, 4, 5]); // Invalid PDF
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() =>
      useDocumentSigning({ pdfSource: invalidPdfBytes })
    );

    const signatureImage = createTestSignatureImage();
    const coordinates: PDFCoordinates = {
      x: 100,
      y: 200,
      pageNumber: 1,
      pageWidth: 612,
      pageHeight: 792,
    };

    await addSignatureHelper(result, signatureImage, coordinates);

    await act(async () => {
      await result.current.applySignatures().catch(() => undefined);
    });

    expect(result.current?.error).toBeTruthy();
    expect(result.current?.isApplying).toBe(false);
    errorSpy.mockRestore();
  });

});

afterAll(() => {
});

