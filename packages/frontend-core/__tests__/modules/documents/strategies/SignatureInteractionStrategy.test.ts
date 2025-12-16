/**
 * @fileoverview Tests for SignatureInteractionStrategy
 * @summary Unit tests for signature interaction strategy
 * @description Comprehensive tests for all signature element interaction scenarios
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignatureInteractionStrategy } from '../../../../src/modules/documents/strategies/SignatureInteractionStrategy';
import { PdfElementType, ControlType, ResizeHandle } from '../../../../src/modules/documents/enums';
import { InteractionResultType } from '../../../../src/modules/documents/strategies/interfaces/ElementInteractionResult';
import type {
  ElementInteractionContext,
  StartDragResult,
  StartResizeResult,
  DeleteResult,
  UpdateDimensionsResult,
  UpdateCoordinatesResult,
} from '../../../../src/modules/documents/strategies/interfaces';

describe('SignatureInteractionStrategy', () => {
  let strategy: SignatureInteractionStrategy;
  let context: ElementInteractionContext;

  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  beforeEach(() => {
    strategy = new SignatureInteractionStrategy();
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
    it('should return true for Signature element type (enum)', () => {
      expect(strategy.canHandle(PdfElementType.Signature)).toBe(true);
    });

    it('should return true for signature string literal', () => {
      expect(strategy.canHandle('signature')).toBe(true);
    });

    it('should return false for non-matching element types', () => {
      expect(strategy.canHandle(PdfElementType.Text)).toBe(false);
      expect(strategy.canHandle(PdfElementType.Date)).toBe(false);
      expect(strategy.canHandle('text')).toBe(false);
      expect(strategy.canHandle('date')).toBe(false);
    });

    it('should return false for null', () => {
      expect(strategy.canHandle(null)).toBe(false);
    });
  });

  describe('handlePointerDown - Delete Control', () => {
    it('should return delete result when delete control is hit', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        { type: PdfElementType.Signature, index: 0 },
        { type: ControlType.Delete },
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.Delete);
      const deleteResult = result as DeleteResult;
      expect(deleteResult.elementType).toBe(PdfElementType.Signature);
      expect(deleteResult.index).toBe(0);
      expect(deleteResult.preventDefault).toBe(true);
    });

    it('should return null when delete control is hit but no element', () => {
      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        { type: ControlType.Delete },
        null
      );

      expect(result).toBeNull();
    });

    it('should return start resize when control is resize (not delete)', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 250, y: 260 },
        { type: PdfElementType.Signature, index: 0 },
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 200, width: 150, height: 60 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      expect(result?.type).not.toBe(InteractionResultType.Delete);
    });
  });

  describe('handlePointerDown - Resize Control', () => {
    it('should return start resize result when resize control is hit on placed element', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 250, y: 260 },
        { type: PdfElementType.Signature, index: 0 },
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 200, width: 150, height: 60 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      const resizeResult = result as StartResizeResult;
      expect(resizeResult.elementType).toBe(PdfElementType.Signature);
      expect(resizeResult.index).toBe(0);
      expect(resizeResult.handle).toBe(ResizeHandle.Southeast);
      expect(resizeResult.startWidth).toBe(150);
      expect(resizeResult.startHeight).toBe(60);
      expect(resizeResult.preventDefault).toBe(true);
    });

    it('should return null when resize control is hit but no handle', () => {
      const result = strategy.handlePointerDown(
        context,
        { x: 1000, y: 1000 },
        null,
        { type: ControlType.Resize },
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize control is hit but no bounds', () => {
      const result = strategy.handlePointerDown(
        context,
        { x: 1000, y: 1000 },
        null,
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when resize control is hit but no element', () => {
      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        { type: ControlType.Resize, handle: ResizeHandle.Southeast },
        { x: 100, y: 100, width: 150, height: 60 }
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerDown - Pending Signature Interaction', () => {
    it('should return start resize result when pending signature resize handle is hit', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      context.pendingSignatureWidth = 150;
      context.pendingSignatureHeight = 60;

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 150 * scaleX;
      const h = 60 * scaleY;
      const seX = px + w;
      const seY = py + h;

      const result = strategy.handlePointerDown(
        context,
        { x: seX, y: seY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartResize);
      const resizeResult = result as StartResizeResult;
      expect(resizeResult.elementType).toBe(PdfElementType.Signature);
      expect(resizeResult.index).toBe(-1);
      expect(resizeResult.preventDefault).toBe(true);
    });

    it('should return start drag result when pending signature body is hit', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      context.pendingSignatureWidth = 150;
      context.pendingSignatureHeight = 60;

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const px = 100 * scaleX;
      const py = 200 * scaleY;
      const w = 150 * scaleX;
      const h = 60 * scaleY;
      const centerX = px + w / 2;
      const centerY = py + h / 2;

      const result = strategy.handlePointerDown(
        context,
        { x: centerX, y: centerY },
        null,
        null,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Signature);
      expect(dragResult.index).toBe(-1);
      expect(dragResult.preventDefault).toBe(true);
    });

    it('should return null when pointer is outside pending signature bounds', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      context.pendingSignatureWidth = 150;
      context.pendingSignatureHeight = 60;

      const result = strategy.handlePointerDown(
        context,
        { x: 0, y: 0 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when pending element type does not match', () => {
      context.pendingElementType = PdfElementType.Text;
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when pending signature is on different page', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };
      context.currentPage = 1;

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });

    it('should return null when no pending coordinates', () => {
      context.pendingElementType = PdfElementType.Signature;
      context.pendingCoordinates = null;

      const result = strategy.handlePointerDown(
        context,
        { x: 100, y: 100 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerDown - Placed Signature Drag', () => {
    it('should return start drag result when placed signature is hit', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 175, y: 230 },
        { type: PdfElementType.Signature, index: 0 },
        null,
        { x: 100, y: 200, width: 150, height: 60 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.elementType).toBe(PdfElementType.Signature);
      expect(dragResult.index).toBe(0);
      expect(dragResult.preventDefault).toBe(true);
    });

    it('should return null when element type does not match', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 175, y: 230 },
        { type: PdfElementType.Text, index: 0 },
        null,
        { x: 100, y: 200, width: 150, height: 60 }
      );

      expect(result).toBeNull();
    });

    it('should return null when no element is hit', () => {
      const result = strategy.handlePointerDown(
        context,
        { x: 175, y: 230 },
        null,
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('handlePointerMove - Resize Operation', () => {
    it('should return update dimensions result during resize for pending signature', () => {
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const resizeState = {
        type: PdfElementType.Signature,
        index: -1,
        handle: ResizeHandle.Southeast,
        startX: 250,
        startY: 260,
        startWidth: 150,
        startHeight: 60,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 300, y: 280 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
      const dimResult = result as UpdateDimensionsResult;
      expect(dimResult.index).toBe(-1);
      expect(dimResult.width).toBeDefined();
      expect(dimResult.height).toBeDefined();
      expect(dimResult.preventDefault).toBe(false);
    });

    it('should return update dimensions with coordinates when position changes for pending signature', () => {
      context.pendingCoordinates = { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 };

      const resizeState = {
        type: PdfElementType.Signature,
        index: -1,
        handle: ResizeHandle.Northwest,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 50, y: 150 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
      expect((result as any)?.coordinates).toBeDefined();
    });

    it('should return update dimensions result during resize for placed signature', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 250,
        startY: 260,
        startWidth: 150,
        startHeight: 60,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 300, y: 280 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
      const dimResult = result as UpdateDimensionsResult;
      expect(dimResult.index).toBe(0);
      expect(dimResult.width).toBeDefined();
      expect(dimResult.height).toBeDefined();
      expect(dimResult.preventDefault).toBe(false);
    });

    it('should return update dimensions with coordinates when position changes for placed signature', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Northwest,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 50, y: 150 },
        resizeState,
        null
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
      expect((result as any)?.coordinates).toBeDefined();
    });

    it('should return null when resize state type does not match', () => {
      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 250,
        startY: 260,
        startWidth: 150,
        startHeight: 60,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 300, y: 280 },
        resizeState,
        null
      );

      expect(result).toBeNull();
    });

    it('should handle resize state with invalid index gracefully', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const resizeState = {
        type: PdfElementType.Signature,
        index: 999,
        handle: ResizeHandle.Southeast,
        startX: 250,
        startY: 260,
        startWidth: 150,
        startHeight: 60,
      };

      expect(() => {
        strategy.handlePointerMove(
          context,
          { x: 300, y: 280 },
          resizeState,
          null
        );
      }).toThrow();
    });
  });

  describe('handlePointerMove - Drag Operation', () => {
    it('should return update coordinates result during drag for placed signature', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const dragState = {
        type: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 10,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 175, y: 230 },
        null,
        dragState
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateCoordinates);
      const coordResult = result as UpdateCoordinatesResult;
      expect(coordResult.elementType).toBe(PdfElementType.Signature);
      expect(coordResult.index).toBe(0);
      expect(coordResult.coordinates).toBeDefined();
      expect(coordResult.preventDefault).toBe(false);
    });

    it('should return null when drag state type does not match', () => {
      const dragState = {
        type: PdfElementType.Text,
        index: 0,
        offsetX: 10,
        offsetY: 10,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 175, y: 230 },
        null,
        dragState
      );

      expect(result).toBeNull();
    });

    it('should return null when drag state index is -1 (pending element)', () => {
      const dragState = {
        type: PdfElementType.Signature,
        index: -1,
        offsetX: 10,
        offsetY: 10,
      };

      const result = strategy.handlePointerMove(
        context,
        { x: 175, y: 230 },
        null,
        dragState
      );

      expect(result).toBeNull();
    });

    it('should return null when no drag or resize state', () => {
      const result = strategy.handlePointerMove(
        context,
        { x: 175, y: 230 },
        null,
        null
      );

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all resize handles correctly', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const handles = [
        ResizeHandle.Southeast,
        ResizeHandle.Southwest,
        ResizeHandle.Northeast,
        ResizeHandle.Northwest,
      ];

      handles.forEach((handle) => {
        const resizeState = {
          type: PdfElementType.Signature,
          index: 0,
          handle,
          startX: 100,
          startY: 200,
          startWidth: 150,
          startHeight: 60,
        };

        const result = strategy.handlePointerMove(
          context,
          { x: 200, y: 250 },
          resizeState,
          null
        );

        expect(result).not.toBeNull();
        expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
      });
    });

    it('should handle multiple signatures correctly', () => {
      context.signatures = [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
        {
          signatureImage: 'data:image/png;base64,test2',
          coordinates: { pageNumber: 1, x: 300, y: 400, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = strategy.handlePointerDown(
        context,
        { x: 375, y: 430 },
        { type: PdfElementType.Signature, index: 1 },
        null,
        { x: 300, y: 400, width: 150, height: 60 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.StartDrag);
      const dragResult = result as StartDragResult;
      expect(dragResult.index).toBe(1);
    });
  });
});

