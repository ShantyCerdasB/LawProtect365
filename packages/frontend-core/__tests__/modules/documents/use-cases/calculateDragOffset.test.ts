/**
 * @fileoverview Tests for calculateDragOffset use case
 * @summary Unit tests for drag offset calculations
 * @description Comprehensive tests for calculating drag offsets for placed and pending elements
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateElementCenter,
  calculatePlacedElementDragOffset,
  calculatePendingElementDragOffset,
} from '../../../../src/modules/documents/use-cases/calculateDragOffset';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { ElementDisplayBounds } from '../../../../src/modules/documents/types';

describe('calculateDragOffset', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

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
        y: 214,
        width: 100,
        height: 14,
      };

      const result = calculateElementCenter(bounds, PdfElementType.Text);

      expect(result.x).toBe(150);
      expect(result.y).toBe(207);
    });

    it('should calculate center for date element', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 214,
        width: 80,
        height: 14,
      };

      const result = calculateElementCenter(bounds, PdfElementType.Date);

      expect(result.x).toBe(140);
      expect(result.y).toBe(207);
    });

    it('should handle bounds at origin', () => {
      const bounds: ElementDisplayBounds = {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      };

      const result = calculateElementCenter(bounds, PdfElementType.Signature);

      expect(result.x).toBe(50);
      expect(result.y).toBe(25);
    });

    it('should handle fractional dimensions', () => {
      const bounds: ElementDisplayBounds = {
        x: 100.5,
        y: 200.25,
        width: 150.75,
        height: 60.5,
      };

      const result = calculateElementCenter(bounds, PdfElementType.Signature);

      expect(result.x).toBeCloseTo(100.5 + 150.75 / 2, 2);
      expect(result.y).toBeCloseTo(200.25 + 60.5 / 2, 2);
    });
  });

  describe('calculatePlacedElementDragOffset', () => {
    it('should calculate drag offset for placed signature', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = calculatePlacedElementDragOffset({
        displayPoint: { x: 200, y: 250 },
        elementType: PdfElementType.Signature,
        elementIndex: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toHaveProperty('offsetX');
      expect(result).toHaveProperty('offsetY');
      expect(typeof result.offsetX).toBe('number');
      expect(typeof result.offsetY).toBe('number');
    });

    it('should return zero offset when bounds are not found', () => {
      const result = calculatePlacedElementDragOffset({
        displayPoint: { x: 200, y: 250 },
        elementType: PdfElementType.Signature,
        elementIndex: 999,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should calculate drag offset for placed text', () => {
      const texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = calculatePlacedElementDragOffset({
        displayPoint: { x: 150, y: 207 },
        elementType: PdfElementType.Text,
        elementIndex: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toHaveProperty('offsetX');
      expect(result).toHaveProperty('offsetY');
    });

    it('should calculate drag offset for placed date', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = calculatePlacedElementDragOffset({
        displayPoint: { x: 140, y: 207 },
        elementType: PdfElementType.Date,
        elementIndex: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).toHaveProperty('offsetX');
      expect(result).toHaveProperty('offsetY');
    });

    it('should handle different page numbers', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = calculatePlacedElementDragOffset({
        displayPoint: { x: 200, y: 250 },
        elementType: PdfElementType.Signature,
        elementIndex: 0,
        pageNumber: 2,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toHaveProperty('offsetX');
      expect(result).toHaveProperty('offsetY');
    });
  });

  describe('calculatePendingElementDragOffset', () => {
    it('should calculate drag offset for pending signature', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 200,
        width: 150,
        height: 60,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 175, y: 230 },
        elementBounds: bounds,
        elementType: PdfElementType.Signature,
      });

      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should calculate drag offset when pointer is offset from center', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 200,
        width: 150,
        height: 60,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 200, y: 250 },
        elementBounds: bounds,
        elementType: PdfElementType.Signature,
      });

      expect(result.offsetX).toBe(25);
      expect(result.offsetY).toBe(20);
    });

    it('should calculate drag offset for pending text', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 214,
        width: 100,
        height: 14,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 150, y: 207 },
        elementBounds: bounds,
        elementType: PdfElementType.Text,
      });

      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should calculate drag offset for pending date', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 214,
        width: 80,
        height: 14,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 140, y: 207 },
        elementBounds: bounds,
        elementType: PdfElementType.Date,
      });

      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should handle negative offsets', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 200,
        width: 150,
        height: 60,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 150, y: 210 },
        elementBounds: bounds,
        elementType: PdfElementType.Signature,
      });

      expect(result.offsetX).toBe(-25);
      expect(result.offsetY).toBe(-20);
    });

    it('should handle fractional coordinates', () => {
      const bounds: ElementDisplayBounds = {
        x: 100.5,
        y: 200.25,
        width: 150.75,
        height: 60.5,
      };

      const result = calculatePendingElementDragOffset({
        displayPoint: { x: 175.875, y: 230.5 },
        elementBounds: bounds,
        elementType: PdfElementType.Signature,
      });

      expect(typeof result.offsetX).toBe('number');
      expect(typeof result.offsetY).toBe('number');
    });
  });
});




