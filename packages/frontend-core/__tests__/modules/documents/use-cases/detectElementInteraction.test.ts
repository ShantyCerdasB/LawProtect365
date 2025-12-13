/**
 * @fileoverview Tests for detectElementInteraction use case
 * @summary Unit tests for element interaction detection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  detectElementAtPoint,
  detectControlAtPoint,
} from '../../../../src/modules/documents/use-cases/detectElementInteraction';
import { PdfElementType, ControlType, ResizeHandle } from '../../../../src/modules/documents/enums';
import type { PdfRenderMetrics } from '../../../../src/modules/documents/types';

jest.mock('../../../../src/modules/documents/use-cases/getElementDisplayBounds');
jest.mock('../../../../src/modules/documents/use-cases/getControlAtDisplayPosition');

import { getElementDisplayBounds } from '../../../../src/modules/documents/use-cases/getElementDisplayBounds';
import { getControlAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getControlAtDisplayPosition';

const mockGetElementDisplayBounds = getElementDisplayBounds as jest.MockedFunction<typeof getElementDisplayBounds>;
const mockGetControlAtDisplayPosition = getControlAtDisplayPosition as jest.MockedFunction<typeof getControlAtDisplayPosition>;

describe('detectElementAtPoint', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no elements are found', () => {
    mockGetElementDisplayBounds.mockReturnValue(null);

    const input = {
      displayPoint: { x: 200, y: 300 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [],
        texts: [],
        dates: [],
      },
    };

    const result = detectElementAtPoint(input);

    expect(result).toBeNull();
  });

  it('should return signature hit when signature is found', () => {
    const bounds = { x: 100, y: 200, width: 150, height: 60 };
    mockGetElementDisplayBounds.mockReturnValueOnce(bounds).mockReturnValue(null);

    const input = {
      displayPoint: { x: 150, y: 230 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [{
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        }],
        texts: [],
        dates: [],
      },
    };

    const result = detectElementAtPoint(input);

    expect(result).toEqual({ type: PdfElementType.Signature, index: 0 });
  });

  it('should return text hit when text is found', () => {
    const scaleX = 1024 / 612;
    const scaleY = 1320 / 792;
    const bounds = {
      x: 100 * scaleX,
      y: 200 * scaleY,
      width: 4 * 12 * 0.6 * scaleY,
      height: 12 * scaleY,
    };
    mockGetElementDisplayBounds
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(bounds)
      .mockReturnValue(null);

    const input = {
      displayPoint: { x: bounds.x + bounds.width / 2, y: bounds.y - bounds.height / 2 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [],
        texts: [{
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        }],
        dates: [],
      },
    };

    const result = detectElementAtPoint(input);

    expect(result).toEqual({ type: PdfElementType.Text, index: 0 });
  });

  it('should return date hit when date is found', () => {
    const bounds = { x: 100, y: 188, width: 80, height: 12 };
    mockGetElementDisplayBounds
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(bounds);

    const input = {
      displayPoint: { x: 140, y: 194 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [],
        texts: [],
        dates: [{
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        }],
      },
    };

    const result = detectElementAtPoint(input);

    expect(result).toEqual({ type: PdfElementType.Date, index: 0 });
  });

  it('should skip elements not on current page', () => {
    mockGetElementDisplayBounds.mockReturnValue(null);

    const input = {
      displayPoint: { x: 200, y: 300 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [{
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        }],
        texts: [],
        dates: [],
      },
    };

    const result = detectElementAtPoint(input);

    expect(result).toBeNull();
  });
});

describe('detectControlAtPoint', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no elements are found', () => {
    mockGetElementDisplayBounds.mockReturnValue(null);

    const input = {
      displayPoint: { x: 200, y: 300 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [],
        texts: [],
        dates: [],
      },
    };

    const result = detectControlAtPoint(input);

    expect(result.elementHit).toBeNull();
    expect(result.controlHit).toBeNull();
    expect(result.elementBounds).toBeNull();
  });

  it('should return control hit when delete button is detected', () => {
    const scaleX = 1024 / 612;
    const scaleY = 1320 / 792;
    const bounds = {
      x: 100 * scaleX,
      y: 200 * scaleY,
      width: 150 * scaleX,
      height: 60 * scaleY,
    };
    mockGetElementDisplayBounds.mockReturnValueOnce(bounds).mockReturnValue(null);
    mockGetControlAtDisplayPosition.mockReturnValue({ type: ControlType.Delete });

    const input = {
      displayPoint: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [{
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        }],
        texts: [],
        dates: [],
      },
    };

    const result = detectControlAtPoint(input);

    expect(result.elementHit).toEqual({ type: PdfElementType.Signature, index: 0 });
    expect(result.controlHit).toEqual({ type: ControlType.Delete });
    expect(result.elementBounds).toEqual(bounds);
  });

  it('should return element hit even when no control is detected', () => {
    const scaleX = 1024 / 612;
    const scaleY = 1320 / 792;
    const bounds = {
      x: 100 * scaleX,
      y: 200 * scaleY,
      width: 150 * scaleX,
      height: 60 * scaleY,
    };
    mockGetElementDisplayBounds.mockReturnValueOnce(bounds).mockReturnValue(null);
    mockGetControlAtDisplayPosition.mockReturnValue(null);

    const input = {
      displayPoint: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [{
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        }],
        texts: [],
        dates: [],
      },
    };

    const result = detectControlAtPoint(input);

    expect(result.elementHit).toEqual({ type: PdfElementType.Signature, index: 0 });
    expect(result.controlHit).toBeNull();
    expect(result.elementBounds).toEqual(bounds);
  });

    it('should return immediately when control is hit', () => {
      const bounds = { x: 100, y: 200, width: 150, height: 60 };
      mockGetElementDisplayBounds.mockReturnValue(bounds);
      mockGetControlAtDisplayPosition.mockReturnValue({ type: ControlType.Resize, handle: ResizeHandle.Southeast });

    const input = {
      displayPoint: { x: 238, y: 248 },
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      elements: {
        signatures: [{
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        }],
        texts: [],
        dates: [],
      },
    };

    const result = detectControlAtPoint(input);

    expect(result.controlHit).toEqual({ type: ControlType.Resize, handle: 'se' });
    expect(mockGetControlAtDisplayPosition).toHaveBeenCalledTimes(1);
  });
});
