/**
 * @fileoverview Tests for computeResizedTextFontSize use case
 * @summary Unit tests for text font size computation
 */

import { describe, it, expect } from '@jest/globals';
import { computeResizedTextFontSize } from '../../../../src/modules/documents/use-cases/computeResizedTextFontSize';
import type { ComputeResizedTextFontSizeInput } from '../../../../src/modules/documents/types';

describe('computeResizedTextFontSize', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  it('should compute new font size based on delta', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 12,
      deltaYDisplay: 20,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedTextFontSize(input);

    const scaleY = 792 / 1320;
    const fontSizeDelta = 20 * scaleY;
    const expected = 12 + fontSizeDelta;

    expect(result).toBeCloseTo(expected, 2);
  });

  it('should handle negative delta (shrinking)', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 20,
      deltaYDisplay: -10,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedTextFontSize(input);

    const scaleY = 792 / 1320;
    const fontSizeDelta = -10 * scaleY;
    const expected = 20 + fontSizeDelta;

    expect(result).toBeCloseTo(expected, 2);
  });

  it('should clamp to minimum font size', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 10,
      deltaYDisplay: -100,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedTextFontSize(input);

    expect(result).toBe(8);
  });

  it('should clamp to maximum font size', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 70,
      deltaYDisplay: 100,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedTextFontSize(input);

    expect(result).toBe(72);
  });

  it('should use custom min font size', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 10,
      deltaYDisplay: -100,
      renderMetrics: createRenderMetrics(),
      minFontSize: 5,
    };

    const result = computeResizedTextFontSize(input);

    expect(result).toBeGreaterThanOrEqual(5);
  });

  it('should use custom max font size', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 70,
      deltaYDisplay: 100,
      renderMetrics: createRenderMetrics(),
      maxFontSize: 100,
    };

    const result = computeResizedTextFontSize(input);

    expect(result).toBeLessThanOrEqual(100);
  });

  it('should handle zero delta', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 12,
      deltaYDisplay: 0,
      renderMetrics: createRenderMetrics(),
    };

    const result = computeResizedTextFontSize(input);

    expect(result).toBe(12);
  });

  it('should handle different viewport scales', () => {
    const input: ComputeResizedTextFontSizeInput = {
      startFontSizePDF: 12,
      deltaYDisplay: 20,
      renderMetrics: {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 500,
        viewportHeight: 800,
      },
    };

    const result = computeResizedTextFontSize(input);

    const scaleY = 792 / 800;
    const fontSizeDelta = 20 * scaleY;
    const expected = 12 + fontSizeDelta;

    expect(result).toBeCloseTo(expected, 2);
  });
});
