/**
 * @fileoverview Tests for TextInteractionStrategy
 * @summary Unit tests for text interaction strategy
 * @description Comprehensive tests for text element interaction scenarios
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TextInteractionStrategy } from '../../../../src/modules/documents/strategies/TextInteractionStrategy';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import { InteractionResultType } from '../../../../src/modules/documents/strategies/interfaces/ElementInteractionResult';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

describe('TextInteractionStrategy', () => {
  let strategy: TextInteractionStrategy;
  let context: ElementInteractionContext;

  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    strategy = new TextInteractionStrategy();
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
    it('should return Text element type', () => {
      expect(strategy.canHandle(PdfElementType.Text)).toBe(true);
    });
  });

  describe('getDefaultDimensions', () => {
    it('should return default dimensions for pending text elements', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 100 * scaleX;
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
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: 'se' as any,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect((result as any)?.fontSize).toBeDefined();
      expect((result as any)?.fontSize).not.toBe(12);
    });
  });

  describe('getElementArray', () => {
    it('should return texts array from context', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Text, index: 0 },
        null,
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
    });
  });

  describe('Integration with BaseTextLikeInteractionStrategy', () => {
    it('should handle delete operation', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        { type: PdfElementType.Text, index: 0 },
        { type: 'delete' as any },
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('delete');
    });

    it('should handle resize operation', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 200, y: 214 },
        { type: PdfElementType.Text, index: 0 },
        { type: 'resize' as any, handle: 'se' },
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('startResize');
    });

    it('should handle drag operation for placed element', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Text, index: 0 },
        null,
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('startDrag');
    });

    it('should handle drag operation for pending element', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 100 * scaleX;
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
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: 'se' as any,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('updateFontSize');
      expect((result as any)?.fontSize).toBeGreaterThan(0);
    });

    it('should handle coordinate update during drag', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const dragState = {
        type: PdfElementType.Text,
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

