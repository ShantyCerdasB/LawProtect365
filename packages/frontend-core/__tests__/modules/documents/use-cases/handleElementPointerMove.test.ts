/**
 * @fileoverview Tests for handleElementPointerMove use case
 * @summary Unit tests for pointer move event handling
 * @description Comprehensive tests for handling pointer move events during drag and resize operations
 */

import { describe, it, expect } from '@jest/globals';
import { handleElementPointerMove } from '../../../../src/modules/documents/use-cases/handleElementPointerMove';
import { PdfElementType, ResizeHandle } from '../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../src/modules/documents/types';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';
import { InteractionResultType } from '../../../../src/modules/documents/strategies/interfaces/ElementInteractionResult';

describe('handleElementPointerMove', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  const createContext = (
    signatures: SignaturePlacement[] = [],
    texts: TextPlacement[] = [],
    dates: DatePlacement[] = []
  ): ElementInteractionContext => ({
    currentPage: 1,
    renderMetrics: createRenderMetrics(),
    signatures,
    texts,
    dates,
    elements: { signatures, texts, dates },
    pendingCoordinates: null,
    pendingElementType: null,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
  });

  describe('Resize state handling', () => {
    it('should handle resize state for signature element', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 200, y: 300 },
        resizeState,
        dragState: null,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
    });

    it('should handle resize state for text element', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Hello',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 12,
        },
      ];

      const context = createContext([], texts);
      const resizeState = {
        type: PdfElementType.Text,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 50,
        startHeight: 12,
        startFontSize: 12,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 180 },
        resizeState,
        dragState: null,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateFontSize);
    });

    it('should handle resize state for date element', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 12,
        },
      ];

      const context = createContext([], [], dates);
      const resizeState = {
        type: PdfElementType.Date,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 80,
        startHeight: 12,
        startFontSize: 12,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 180 },
        resizeState,
        dragState: null,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateFontSize);
    });
  });

  describe('Drag state handling', () => {
    it('should handle drag state for signature element', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const dragState = {
        type: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 20,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 250 },
        resizeState: null,
        dragState,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateCoordinates);
    });

    it('should handle drag state for text element', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Hello',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 12,
        },
      ];

      const context = createContext([], texts);
      const dragState = {
        type: PdfElementType.Text,
        index: 0,
        offsetX: 5,
        offsetY: 10,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 220 },
        resizeState: null,
        dragState,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateCoordinates);
    });

    it('should handle drag state for date element', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 12,
        },
      ];

      const context = createContext([], [], dates);
      const dragState = {
        type: PdfElementType.Date,
        index: 0,
        offsetX: 5,
        offsetY: 10,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 220 },
        resizeState: null,
        dragState,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateCoordinates);
    });
  });

  describe('Priority handling', () => {
    it('should prioritize resize state over drag state', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };
      const dragState = {
        type: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 20,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 200, y: 300 },
        resizeState,
        dragState,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(InteractionResultType.UpdateDimensions);
    });
  });

  describe('Edge cases', () => {
    it('should return null when no resize or drag state', () => {
      const context = createContext();

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 100, y: 200 },
        resizeState: null,
        dragState: null,
      });

      expect(result).toBeNull();
    });

    it('should return null for unknown element type in resize state', () => {
      const context = createContext();
      const resizeState = {
        type: 'unknown' as PdfElementType,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 200, y: 300 },
        resizeState,
        dragState: null,
      });

      expect(result).toBeNull();
    });

    it('should return null for unknown element type in drag state', () => {
      const context = createContext();
      const dragState = {
        type: 'unknown' as PdfElementType,
        index: 0,
        offsetX: 10,
        offsetY: 20,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 250 },
        resizeState: null,
        dragState,
      });

      expect(result).toBeNull();
    });

    it('should return null when resizeState has invalid type', () => {
      const context = createContext();
      const resizeState = {
        type: 'invalid' as PdfElementType,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 200, y: 300 },
        resizeState,
        dragState: null,
      });

      expect(result).toBeNull();
    });

    it('should return null when dragState has invalid type', () => {
      const context = createContext();
      const dragState = {
        type: 'invalid' as PdfElementType,
        index: 0,
        offsetX: 10,
        offsetY: 20,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 150, y: 250 },
        resizeState: null,
        dragState,
      });

      expect(result).toBeNull();
    });

    it('should handle resize state with all handles', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const resizeState = {
        type: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Northeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
      };

      const result = handleElementPointerMove({
        context,
        displayPoint: { x: 200, y: 300 },
        resizeState,
        dragState: null,
      });

      expect(result).not.toBeNull();
    });
  });
});
