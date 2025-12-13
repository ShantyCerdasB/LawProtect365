/**
 * @fileoverview Tests for computeResizedSignatureDimensions use case
 * @summary Unit tests for signature resize dimension calculations
 */

import { describe, it, expect } from '@jest/globals';
import { computeResizedSignatureDimensions } from '../../../../src/modules/documents/use-cases/computeResizedSignatureDimensions';
import { ResizeHandle } from '../../../../src/modules/documents/enums';
import type { PdfRenderMetrics } from '../../../../src/modules/documents/types';

describe('computeResizedSignatureDimensions', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  describe('Southeast handle', () => {
    it('should increase width and height when dragging southeast', () => {
      const input = {
        handle: ResizeHandle.Southeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 50,
        deltaYDisplay: 30,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThan(150 * (612 / 1024));
      expect(result.heightPDF).toBeGreaterThan(60 * (792 / 1320));
      expect(result.xPDF).toBe(100);
      expect(result.yPDF).toBe(200);
    });

    it('should decrease width and height when dragging northwest', () => {
      const input = {
        handle: ResizeHandle.Southeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: -50,
        deltaYDisplay: -30,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeLessThan(150 * (612 / 1024));
      expect(result.heightPDF).toBeLessThan(60 * (792 / 1320));
      expect(result.xPDF).toBe(100);
      expect(result.yPDF).toBe(200);
    });

    it('should enforce minimum dimensions', () => {
      const input = {
        handle: ResizeHandle.Southeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: -200,
        deltaYDisplay: -100,
        renderMetrics: createRenderMetrics(),
        minWidthPDF: 50,
        minHeightPDF: 20,
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThanOrEqual(50);
      expect(result.heightPDF).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Southwest handle', () => {
    it('should decrease width and increase height when dragging southwest', () => {
      const input = {
        handle: ResizeHandle.Southwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 50,
        deltaYDisplay: 30,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeLessThan(150 * (612 / 1024));
      expect(result.heightPDF).toBeGreaterThan(60 * (792 / 1320));
      expect(result.xPDF).toBeGreaterThan(100);
      expect(result.yPDF).toBe(200);
    });

    it('should adjust X position when width changes', () => {
      const input = {
        handle: ResizeHandle.Southwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 30,
        deltaYDisplay: 0,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      const expectedWidthChange = (30 * (612 / 1024));
      expect(result.xPDF).toBeCloseTo(100 + expectedWidthChange, 1);
    });

    it('should enforce minimum dimensions', () => {
      const input = {
        handle: ResizeHandle.Southwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 200,
        deltaYDisplay: -100,
        renderMetrics: createRenderMetrics(),
        minWidthPDF: 50,
        minHeightPDF: 20,
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThanOrEqual(50);
      expect(result.heightPDF).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Northeast handle', () => {
    it('should increase width and decrease height when dragging northeast', () => {
      const input = {
        handle: ResizeHandle.Northeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 50,
        deltaYDisplay: 30,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThan(150 * (612 / 1024));
      expect(result.heightPDF).toBeLessThan(60 * (792 / 1320));
      expect(result.xPDF).toBe(100);
      expect(result.yPDF).toBeGreaterThan(200);
    });

    it('should adjust Y position when height changes', () => {
      const input = {
        handle: ResizeHandle.Northeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 0,
        deltaYDisplay: 20,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      const expectedHeightChange = (20 * (792 / 1320));
      expect(result.yPDF).toBeCloseTo(200 + expectedHeightChange, 1);
    });

    it('should enforce minimum dimensions', () => {
      const input = {
        handle: ResizeHandle.Northeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: -200,
        deltaYDisplay: 100,
        renderMetrics: createRenderMetrics(),
        minWidthPDF: 50,
        minHeightPDF: 20,
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThanOrEqual(50);
      expect(result.heightPDF).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Northwest handle', () => {
    it('should decrease width and height when dragging northwest', () => {
      const input = {
        handle: ResizeHandle.Northwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 50,
        deltaYDisplay: 30,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeLessThan(150 * (612 / 1024));
      expect(result.heightPDF).toBeLessThan(60 * (792 / 1320));
      expect(result.xPDF).toBeGreaterThan(100);
      expect(result.yPDF).toBeGreaterThan(200);
    });

    it('should adjust both X and Y positions when dimensions change', () => {
      const input = {
        handle: ResizeHandle.Northwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 30,
        deltaYDisplay: 20,
        renderMetrics: createRenderMetrics(),
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.xPDF).toBeGreaterThan(100);
      expect(result.yPDF).toBeGreaterThan(200);
    });

    it('should enforce minimum dimensions', () => {
      const input = {
        handle: ResizeHandle.Northwest,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: 200,
        deltaYDisplay: 100,
        renderMetrics: createRenderMetrics(),
        minWidthPDF: 50,
        minHeightPDF: 20,
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThanOrEqual(50);
      expect(result.heightPDF).toBeGreaterThanOrEqual(20);
    });
  });

  describe('coordinate conversion', () => {
    it('should convert display coordinates to PDF coordinates correctly', () => {
      const input = {
        handle: ResizeHandle.Southeast,
        startWidthDisplay: 200,
        startHeightDisplay: 100,
        startXPDF: 0,
        startYPDF: 0,
        deltaXDisplay: 100,
        deltaYDisplay: 50,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 792,
          viewportWidth: 1024,
          viewportHeight: 1320,
        },
      };

      const result = computeResizedSignatureDimensions(input);

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const expectedWidth = (200 + 100) * scaleX;
      const expectedHeight = (100 + 50) * scaleY;

      expect(result.widthPDF).toBeCloseTo(expectedWidth, 1);
      expect(result.heightPDF).toBeCloseTo(expectedHeight, 1);
    });
  });

  describe('custom minimum dimensions', () => {
    it('should use custom minimum dimensions when provided', () => {
      const input = {
        handle: ResizeHandle.Southeast,
        startWidthDisplay: 150,
        startHeightDisplay: 60,
        startXPDF: 100,
        startYPDF: 200,
        deltaXDisplay: -200,
        deltaYDisplay: -100,
        renderMetrics: createRenderMetrics(),
        minWidthPDF: 100,
        minHeightPDF: 50,
      };

      const result = computeResizedSignatureDimensions(input);

      expect(result.widthPDF).toBeGreaterThanOrEqual(100);
      expect(result.heightPDF).toBeGreaterThanOrEqual(50);
    });
  });
});
