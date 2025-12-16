/**
 * @fileoverview Tests for BaseTextLikeInteractionStrategy
 * @summary Unit tests for base text-like interaction strategy
 * @description
 * Tests the abstract BaseTextLikeInteractionStrategy class through concrete implementations.
 * Since the class is abstract, we test it via TextInteractionStrategy and DateInteractionStrategy.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BaseTextLikeInteractionStrategy } from '../../../../src/modules/documents/strategies/BaseTextLikeInteractionStrategy';
import { TextInteractionStrategy } from '../../../../src/modules/documents/strategies/TextInteractionStrategy';
import { DateInteractionStrategy } from '../../../../src/modules/documents/strategies/DateInteractionStrategy';
import { PdfElementType, ControlType, ResizeHandle } from '../../../../src/modules/documents/enums';
import { InteractionResultType } from '../../../../src/modules/documents/strategies/interfaces/ElementInteractionResult';
import type {
  ElementInteractionContext,
  DeleteResult,
  StartResizeResult,
  StartDragResult,
  UpdateFontSizeResult,
  UpdateCoordinatesResult,
} from '../../../../src/modules/documents/strategies/interfaces';

describe('BaseTextLikeInteractionStrategy', () => {
  let textStrategy: TextInteractionStrategy;
  let dateStrategy: DateInteractionStrategy;
  let context: ElementInteractionContext;

  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    textStrategy = new TextInteractionStrategy();
    dateStrategy = new DateInteractionStrategy();
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

  describe('canHandle', () => {
    it('should return true for matching element type (enum)', () => {
      expect(textStrategy.canHandle(PdfElementType.Text)).toBe(true);
      expect(dateStrategy.canHandle(PdfElementType.Date)).toBe(true);
    });

    it('should return true for matching element type (string literal)', () => {
      expect(textStrategy.canHandle('text')).toBe(true);
      expect(dateStrategy.canHandle('date')).toBe(true);
    });

    it('should return false for non-matching element type', () => {
      expect(textStrategy.canHandle(PdfElementType.Date)).toBe(false);
      expect(textStrategy.canHandle(PdfElementType.Signature)).toBe(false);
      expect(dateStrategy.canHandle(PdfElementType.Text)).toBe(false);
      expect(dateStrategy.canHandle(PdfElementType.Signature)).toBe(false);
    });

    it('should return false for null', () => {
      expect(textStrategy.canHandle(null)).toBe(false);
      expect(dateStrategy.canHandle(null)).toBe(false);
    });
  });

  describe('handlePointerDown - Delete Control', () => {
    it('should return delete result when delete control is hit', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        { type: PdfElementType.Text, index: 0 },
        { type: ControlType.Delete },
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.Delete);
      const deleteResult = result as DeleteResult;
      expect(deleteResult.elementType).toBe(PdfElementType.Text);
      expect(deleteResult.index).toBe(0);
      expect(deleteResult.preventDefault).toBe(true);
    });

    it('should return null when delete control is hit but no element', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        { type: ControlType.Delete },
        null
      );

      expect(result).toBeNull();
    });

    it('should return start resize when control is resize (not delete)', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 200, y: 214 },
        { type: PdfElementType.Text, index: 0 },
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      expect(result?.type).not.toBe(InteractionResultType.Delete);
    });
  });

  describe('handlePointerDown - Resize Control', () => {
    it('should return start resize result when resize control is hit on placed element', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 200, y: 214 },
        { type: PdfElementType.Text, index: 0 },
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      const resizeResult = result as StartResizeResult;
      expect(resizeResult.elementType).toBe(PdfElementType.Text);
      expect(resizeResult.index).toBe(0);
      expect(resizeResult.handle).toBe(ResizeHandle.Southeast);
      expect(resizeResult.startFontSize).toBe(12);
      expect(resizeResult.preventDefault).toBe(true);
    });

    it('should use default font size when element has no fontSize', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 200, y: 214 },
        { type: PdfElementType.Text, index: 0 },
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      const resizeResult = result as StartResizeResult;
      expect(resizeResult.startFontSize).toBe(12);
    });

    it('should return null when resize control is hit but no handle', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 1000, y: 1000 },
        null,
        { type: ControlType.Resize },
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize control is hit but no bounds', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 1000, y: 1000 },
        null,
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize control is hit but no element', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 100, width: 100, height: 14 }
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerDown - Pending Element Interaction', () => {
    it('should return start drag result when pending element is hit', () => {
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

      const result = textStrategy.handlePointerDown(
        context,
        { x: centerX, y: centerY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Text);
      expect(dragResult.index).toBe(-1);
      expect(dragResult.preventDefault).toBe(true);
    });

    it('should return null when pointer is outside pending element bounds', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 100 * scaleX;
      const h = 14 * scaleY;
      const outsideX = px + w + 10;
      const outsideY = py + h + 10;

      const result = textStrategy.handlePointerDown(
        context,
        { x: outsideX, y: outsideY },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when pending element type does not match', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when pending element is on different page', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      context.currentPage = 1;

      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when no pending coordinates', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = null;

      const result = textStrategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerDown - Placed Element Drag', () => {
    it('should return start drag result when placed element is hit', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Text, index: 0 },
        null,
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Text);
      expect(dragResult.index).toBe(0);
      expect(dragResult.preventDefault).toBe(true);
    });

    it('should return null when element type does not match', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Signature, index: 0 },
        null,
        { x: 100, y: 200, width: 100, height: 14 }
      );

      expect(result).toBeNull();
    });

    it('should return null when no element is hit', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerMove - Resize Operation', () => {
    it('should return update font size result during resize', () => {
      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateFontSize);
      const fontSizeResult = result as UpdateFontSizeResult;
      expect(fontSizeResult.elementType).toBe(PdfElementType.Text);
      expect(fontSizeResult.index).toBe(0);
      expect(fontSizeResult.fontSize).toBeDefined();
      expect(fontSizeResult.preventDefault).toBe(false);
    });

    it('should return null when resize state type does not match', () => {
      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize state has no startFontSize', () => {
      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerMove - Drag Operation', () => {
    it('should return update coordinates result during drag for placed element', () => {
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

      const result = textStrategy.handlePointerMove(
        context,
        { x: 150, y: 207 },
        null,
        dragState
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateCoordinates);
      const coordResult = result as UpdateCoordinatesResult;
      expect(coordResult.elementType).toBe(PdfElementType.Text);
      expect(coordResult.index).toBe(0);
      expect(coordResult.coordinates).toBeDefined();
      expect(coordResult.preventDefault).toBe(false);
    });

    it('should return null when drag state type does not match', () => {
      const dragState = {
        type: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 10,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 150, y: 207 },
        null,
        dragState
      );

      expect(result).toBeNull();
    });

    it('should return null when drag state index is -1 (pending element)', () => {
      const dragState = {
        type: PdfElementType.Text,
        index: -1,
        offsetX: 10,
        offsetY: 10,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 150, y: 207 },
        null,
        dragState
      );

      expect(result).toBeNull();
    });

    it('should return null when no drag or resize state', () => {
      const result = textStrategy.handlePointerMove(
        context,
        { x: 150, y: 207 },
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize state type does not match element type', () => {
      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 200,
        startY: 214,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 200, y: 224 },
        resizeState,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when drag state type does not match element type', () => {
      const dragState = {
        type: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 10,
      };

      const result = textStrategy.handlePointerMove(
        context,
        { x: 150, y: 207 },
        null,
        dragState
      );

      expect(result).toBeNull();
    });

    it('should return null when handlePointerDown has no matching interaction', () => {
      const result = textStrategy.handlePointerDown(
        context,
        { x: 500, y: 500 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when pending element drag pointer is outside bounds', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 100 * scaleX;
      const h = 14 * scaleY;
      const outsideX = px + w + 50;
      const outsideY = py + h + 50;

      const result = textStrategy.handlePointerDown(
        context,
        { x: outsideX, y: outsideY },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when placed element drag has no element hit', () => {
      context.texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = textStrategy.handlePointerDown(
        context,
        { x: 500, y: 500 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('DateInteractionStrategy specific', () => {
    it('should handle date element interactions correctly', () => {
      context.dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = dateStrategy.handlePointerDown(
        context,
        { x: 150, y: 207 },
        { type: PdfElementType.Date, index: 0 },
        null,
        { x: 100, y: 200, width: 80, height: 14 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Date);
    });

    it('should handle pending date element drag', () => {
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

      const result = dateStrategy.handlePointerDown(
        context,
        { x: centerX, y: centerY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Date);
      expect(dragResult.index).toBe(-1);
    });
  });
});

