/**
 * @fileoverview Tests for calculateDragOffset use case
 * @summary Unit tests for drag offset calculation functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  calculateElementCenter,
  calculatePlacedElementDragOffset,
  calculatePendingElementDragOffset,
} from '../../../../src/modules/documents/use-cases/calculateDragOffset';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { ElementDisplayBounds } from '../../../../src/modules/documents/types';

jest.mock('../../../../src/modules/documents/use-cases/getElementDisplayBounds');

import { getElementDisplayBounds } from '../../../../src/modules/documents/use-cases/getElementDisplayBounds';

const mockGetElementDisplayBounds = getElementDisplayBounds as jest.MockedFunction<typeof getElementDisplayBounds>;

describe('calculateElementCenter', () => {
  it('should calculate center for signature element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };

    const result = calculateElementCenter(bounds, PdfElementType.Signature);

    expect(result.x).toBe(175);
    expect(result.y).toBe(230);
  });

  it('should calculate center for text element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 50,
      height: 12,
    };

    const result = calculateElementCenter(bounds, PdfElementType.Text);

    expect(result.x).toBe(125);
    expect(result.y).toBe(206);
  });

  it('should calculate center for date element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 80,
      height: 12,
    };

    const result = calculateElementCenter(bounds, PdfElementType.Date);

    expect(result.x).toBe(140);
    expect(result.y).toBe(206);
  });

  it('should handle zero-sized element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 0,
      height: 0,
    };

    const result = calculateElementCenter(bounds, PdfElementType.Signature);

    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });
});

describe('calculatePlacedElementDragOffset', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate drag offset for placed signature element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };
    mockGetElementDisplayBounds.mockReturnValue(bounds);

    const input = {
      displayPoint: { x: 200, y: 250 },
      elementType: PdfElementType.Signature,
      elementIndex: 0,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = calculatePlacedElementDragOffset(input);

    const center = calculateElementCenter(bounds, PdfElementType.Signature);
    expect(result.offsetX).toBe(200 - center.x);
    expect(result.offsetY).toBe(250 - center.y);
  });

  it('should return zero offset when element bounds not found', () => {
    mockGetElementDisplayBounds.mockReturnValue(null);

    const input = {
      displayPoint: { x: 200, y: 250 },
      elementType: PdfElementType.Signature,
      elementIndex: 0,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = calculatePlacedElementDragOffset(input);

    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  it('should calculate drag offset for placed text element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 50,
      height: 12,
    };
    mockGetElementDisplayBounds.mockReturnValue(bounds);

    const input = {
      displayPoint: { x: 150, y: 220 },
      elementType: PdfElementType.Text,
      elementIndex: 0,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = calculatePlacedElementDragOffset(input);

    const center = calculateElementCenter(bounds, PdfElementType.Text);
    expect(result.offsetX).toBe(150 - center.x);
    expect(result.offsetY).toBe(220 - center.y);
  });

  it('should calculate drag offset for placed date element', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 80,
      height: 12,
    };
    mockGetElementDisplayBounds.mockReturnValue(bounds);

    const input = {
      displayPoint: { x: 180, y: 220 },
      elementType: PdfElementType.Date,
      elementIndex: 0,
      pageNumber: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    const result = calculatePlacedElementDragOffset(input);

    const center = calculateElementCenter(bounds, PdfElementType.Date);
    expect(result.offsetX).toBe(180 - center.x);
    expect(result.offsetY).toBe(220 - center.y);
  });

  it('should call getElementDisplayBounds with correct parameters', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };
    mockGetElementDisplayBounds.mockReturnValue(bounds);

    const input = {
      displayPoint: { x: 200, y: 250 },
      elementType: PdfElementType.Signature,
      elementIndex: 1,
      pageNumber: 2,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    };

    calculatePlacedElementDragOffset(input);

    expect(mockGetElementDisplayBounds).toHaveBeenCalledWith({
      elementType: PdfElementType.Signature,
      index: 1,
      pageNumber: 2,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
    });
  });
});

describe('calculatePendingElementDragOffset', () => {
  it('should calculate drag offset for pending signature element', () => {
    const elementBounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };

    const input = {
      displayPoint: { x: 200, y: 250 },
      elementBounds,
      elementType: PdfElementType.Signature,
    };

    const result = calculatePendingElementDragOffset(input);

    const center = calculateElementCenter(elementBounds, PdfElementType.Signature);
    expect(result.offsetX).toBe(200 - center.x);
    expect(result.offsetY).toBe(250 - center.y);
  });

  it('should calculate drag offset for pending text element', () => {
    const elementBounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 50,
      height: 12,
    };

    const input = {
      displayPoint: { x: 150, y: 220 },
      elementBounds,
      elementType: PdfElementType.Text,
    };

    const result = calculatePendingElementDragOffset(input);

    const center = calculateElementCenter(elementBounds, PdfElementType.Text);
    expect(result.offsetX).toBe(150 - center.x);
    expect(result.offsetY).toBe(220 - center.y);
  });

  it('should calculate drag offset for pending date element', () => {
    const elementBounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 80,
      height: 12,
    };

    const input = {
      displayPoint: { x: 180, y: 220 },
      elementBounds,
      elementType: PdfElementType.Date,
    };

    const result = calculatePendingElementDragOffset(input);

    const center = calculateElementCenter(elementBounds, PdfElementType.Date);
    expect(result.offsetX).toBe(180 - center.x);
    expect(result.offsetY).toBe(220 - center.y);
  });

  it('should handle zero offset when pointer is at center', () => {
    const elementBounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };

    const center = calculateElementCenter(elementBounds, PdfElementType.Signature);
    const input = {
      displayPoint: center,
      elementBounds,
      elementType: PdfElementType.Signature,
    };

    const result = calculatePendingElementDragOffset(input);

    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });
});
