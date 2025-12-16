/**
 * @fileoverview Tests for DateInteractionStrategy
 * @summary Unit tests for date interaction strategy
 * @description Comprehensive tests for date element interaction scenarios
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DateInteractionStrategy } from '../../../../src/modules/documents/strategies/DateInteractionStrategy';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import { InteractionResultType } from '../../../../src/modules/documents/strategies/interfaces/ElementInteractionResult';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

describe('DateInteractionStrategy', () => {
  let strategy: DateInteractionStrategy;
  let context: ElementInteractionContext;

  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    strategy = new DateInteractionStrategy();
    context = {
      currentPage: 1,
      renderMetrics: createRenderMetrics(),
      signatures: [],
      texts: [],
      dates: [],
      elements: { signatures: [], texts: [], dates: [] },
      pendingCoordinates: null,
      pendingElementType: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
    };
  });

  describe('getElementType', () => {
    it('should return Date element type', () => {
      expect(strategy.canHandle(PdfElementType.Date)).toBe(true);
    });
  });

  describe('getDefaultDimensions', () => {
    it('should return default dimensions for pending date elements', () => {
      context.pendingElementType = PdfElementType.Date;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 80 * scaleX;
      const h = 14 * scaleY;
      const centerX = px + w / 2;
      const centerY = py - h / 2;

      const result = strategy.handlePointerDown(
        context,
        { x: centerX, y: centerY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
    });
  });

  describe('computeResizedFontSize', () => {
    it('should compute resized font size correctly', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const resizeState = {
        type: PdfElementType.Date,
        index: 0,
        handle: 'se' as any,
        startX: 180,
        startY: 214,
        startWidth: 80,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 180, y: 224 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect((result as any)?.fontSize).toBeDefined();
      expect((result as any)?.fontSize).not.toBe(12);
    });
  });

  describe('getElementArray', () => {
    it('should return dates array from context', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Date, index: 0 },
        null,
        { x: 100, y: 200, width: 80, height: 14 }
      );

      expect(result).not.toBeNull();
    });
  });

  describe('Integration with BaseTextLikeInteractionStrategy', () => {
    it('should handle delete operation', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        { type: PdfElementType.Date, index: 0 },
        { type: 'delete' as any },
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('delete');
    });

    it('should handle resize operation', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 180, y: 214 },
        { type: PdfElementType.Date, index: 0 },
        { type: 'resize' as any, handle: 'se' },
        { x: 100, y: 200, width: 80, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('startResize');
    });

    it('should handle drag operation for placed element', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 140, y: 207 },
        { type: PdfElementType.Date, index: 0 },
        null,
        { x: 100, y: 200, width: 80, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('startDrag');
    });

    it('should handle drag operation for pending element', () => {
      context.pendingElementType = PdfElementType.Date;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 80 * scaleX;
      const h = 14 * scaleY;
      const centerX = px + w / 2;
      const centerY = py - h / 2;

      const result = strategy.handlePointerDown(
        context,
        { x: centerX, y: centerY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('startDrag');
      const dragResult = result as any;
      expect(dragResult.index).toBe(-1);
    });

    it('should handle font size update during resize', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const resizeState = {
        type: PdfElementType.Date,
        index: 0,
        handle: 'se' as any,
        startX: 180,
        startY: 214,
        startWidth: 80,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 180, y: 224 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('updateFontSize');
      expect((result as any)?.fontSize).toBeGreaterThan(0);
    });

    it('should handle coordinate update during drag', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const dragState = {
        type: PdfElementType.Date,
        index: 0,
        offsetX: 10,
        offsetY: 10,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 150, y: 217 },
        null,
        dragState
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('updateCoordinates');
      expect((result as any)?.coordinates).toBeDefined();
    });
  });
});

