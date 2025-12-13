/**
 * @fileoverview Tests for computeDraggedElementCoordinates use case
 * @summary Unit tests for dragged element coordinate computation
 */

import { describe, it, expect } from '@jest/globals';
import { computeDraggedElementCoordinates } from '../../../../src/modules/documents/use-cases/computeDraggedElementCoordinates';
import { PdfElementType } from '../../../../src/modules/documents/enums';

describe('computeDraggedElementCoordinates', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  describe('Signature elements', () => {
    it('should compute coordinates for dragged signature', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Signature, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result.pageNumber).toBe(1);
      expect(result.pageWidth).toBe(612);
      expect(result.pageHeight).toBe(792);
    });

    it('should use default dimensions when width/height not provided', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Signature, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });
  });

  describe('Text elements', () => {
    it('should compute coordinates for dragged text', () => {
      const texts = [
        {
          text: 'Hello',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Text, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result.pageNumber).toBe(1);
    });

    it('should use default font size when not provided', () => {
      const texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Text, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });

    it('should handle empty text string', () => {
      const texts = [
        {
          text: '',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Text, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });
  });

  describe('Date elements', () => {
    it('should compute coordinates for dragged date', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Date, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result.pageNumber).toBe(1);
    });

    it('should use default font size when not provided', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Date, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });
  });

  describe('coordinate calculations', () => {
    it('should adjust coordinates for signature center alignment', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Signature, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const elementWidthDisplay = 150 * (1024 / 612);
      const elementHeightDisplay = 60 * (1320 / 792);
      const adjustedXDisplay = 512 - elementWidthDisplay / 2;
      const adjustedYDisplay = 660 - elementHeightDisplay / 2;

      expect(result.x).toBeCloseTo(adjustedXDisplay * scaleX, 2);
      expect(result.y).toBeCloseTo(adjustedYDisplay * scaleY, 2);
    });

    it('should adjust coordinates for text baseline alignment', () => {
      const texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = computeDraggedElementCoordinates({
        draggedElement: { type: PdfElementType.Text, index: 0 },
        nextDisplayX: 512,
        nextDisplayY: 660,
        currentPage: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result.y).toBeGreaterThan(0);
    });
  });
});
