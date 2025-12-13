/**
 * @fileoverview Tests for getElementAtDisplayPosition use case
 * @summary Unit tests for element hit-testing at display position
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getElementAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getElementAtDisplayPosition';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { PdfRenderMetrics } from '../../../../src/modules/documents/types';

jest.mock('../../../../src/modules/documents/use-cases/helpers/hitTestElement');

import { hitTestElement } from '../../../../src/modules/documents/use-cases/helpers/hitTestElement';

const mockHitTestElement = hitTestElement as jest.MockedFunction<typeof hitTestElement>;

describe('getElementAtDisplayPosition', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHitTestElement.mockReturnValue(false);
  });

  it('should return null when viewport dimensions are invalid', () => {
    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 0,
        viewportHeight: 1320,
      },
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toBeNull();
  });

  it('should return null when PDF dimensions are invalid', () => {
    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: {
        pdfPageWidth: 0,
        pdfPageHeight: 792,
        viewportWidth: 1024,
        viewportHeight: 1320,
      },
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toBeNull();
  });

  it('should convert display coordinates to PDF coordinates', () => {
    const input = {
      displayX: 512,
      displayY: 660,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    getElementAtDisplayPosition(input);

    const expectedPdfX = 512 * (612 / 1024);
    const expectedPdfY = 660 * (792 / 1320);

    expect(mockHitTestElement).toHaveBeenCalled();
    const calls = mockHitTestElement.mock.calls;
    if (calls.length > 0) {
      expect(calls[0][2]).toBeCloseTo(expectedPdfX, 2);
      expect(calls[0][3]).toBeCloseTo(expectedPdfY, 2);
    }
  });

  it('should test signatures first when multiple elements could match', () => {
    const signatures = [
      {
        signatureImage: 'test1',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
      },
    ];
    const texts = [
      {
        text: 'Test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      },
    ];

    mockHitTestElement
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures,
      texts,
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toEqual({ type: PdfElementType.Signature, index: 0 });
    expect(mockHitTestElement).toHaveBeenCalledTimes(1);
  });

  it('should test texts if signatures do not match', () => {
    const texts = [
      {
        text: 'Test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      },
    ];

    mockHitTestElement.mockReturnValueOnce(true);

    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts,
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toEqual({ type: PdfElementType.Text, index: 0 });
  });

  it('should test dates if signatures and texts do not match', () => {
    const dates = [
      {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      },
    ];

    mockHitTestElement.mockReturnValueOnce(true);

    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates,
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toEqual({ type: PdfElementType.Date, index: 0 });
  });

  it('should skip elements not on the current page', () => {
    const signatures = [
      {
        signatureImage: 'test1',
        coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
      },
    ];

    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures,
      texts: [],
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toBeNull();
    expect(mockHitTestElement).not.toHaveBeenCalled();
  });

  it('should return null when no elements are hit', () => {
    const input = {
      displayX: 1000,
      displayY: 2000,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toBeNull();
  });

  it('should return first matching element when multiple elements of same type match', () => {
    const signatures = [
      {
        signatureImage: 'test1',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
      },
      {
        signatureImage: 'test2',
        coordinates: { pageNumber: 1, x: 150, y: 250, pageWidth: 612, pageHeight: 792 },
      },
    ];

    mockHitTestElement.mockReturnValueOnce(true);

    const input = {
      displayX: 100,
      displayY: 200,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures,
      texts: [],
      dates: [],
    };

    const result = getElementAtDisplayPosition(input);

    expect(result).toEqual({ type: PdfElementType.Signature, index: 0 });
    expect(mockHitTestElement).toHaveBeenCalledTimes(1);
  });
});
