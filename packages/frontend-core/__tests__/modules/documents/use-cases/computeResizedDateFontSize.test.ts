/**
 * @fileoverview Tests for computeResizedDateFontSize use case
 * @summary Unit tests for date font size computation
 */

import { describe, it, expect } from '@jest/globals';
import { computeResizedDateFontSize } from '../../../../src/modules/documents/use-cases/computeResizedDateFontSize';
import type { ComputeResizedDateFontSizeInput } from '../../../../src/modules/documents/types';

describe('computeResizedDateFontSize', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  it('should compute new font size based on delta', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 12,
      deltaYDisplay: 20,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedDateFontSize(input);

    const scaleY = 792 / 1320;
    const fontSizeDelta = 20 * scaleY;
    const expected = 12 + fontSizeDelta;

    expect(result).toBeCloseTo(expected, 2);
  });

  it('should handle negative delta (shrinking)', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 20,
      deltaYDisplay: -10,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedDateFontSize(input);

    const scaleY = 792 / 1320;
    const fontSizeDelta = -10 * scaleY;
    const expected = 20 + fontSizeDelta;

    expect(result).toBeCloseTo(expected, 2);
  });

  it('should clamp to minimum font size', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 10,
      deltaYDisplay: -100,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedDateFontSize(input);

    expect(result).toBe(8);
  });

  it('should clamp to maximum font size', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 70,
      deltaYDisplay: 100,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedDateFontSize(input);

    expect(result).toBe(72);
  });

  it('should use custom min font size', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 10,
      deltaYDisplay: -100,
      renderMetrics: createRenderMetrics(),
      minFontSize: 5,
    };

    const result = computeResizedDateFontSize(input);

    expect(result).toBeGreaterThanOrEqual(5);
  });

  it('should use custom max font size', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 70,
      deltaYDisplay: 100,
      renderMetrics: createRenderMetrics(),
      maxFontSize: 100,
    };

    const result = computeResizedDateFontSize(input);

    expect(result).toBeLessThanOrEqual(100);
  });

  it('should handle zero delta', () => {
    const input: ComputeResizedDateFontSizeInput = {
      startFontSizePDF: 12,
      deltaYDisplay: 0,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedDateFontSize(input);

    expect(result).toBe(12);
  });
});
