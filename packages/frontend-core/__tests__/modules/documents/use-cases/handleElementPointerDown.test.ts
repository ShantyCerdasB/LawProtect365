/**
 * @fileoverview Tests for handleElementPointerDown use case
 * @summary Unit tests for pointer down event handling
 * @description Comprehensive tests for handling pointer down events on elements
 */

import { describe, it, expect } from '@jest/globals';
import { handleElementPointerDown } from '../../../../src/modules/documents/use-cases/handleElementPointerDown';
import { getControlAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getControlAtDisplayPosition';
import { PdfElementType, ControlType } from '../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement, PDFCoordinates } from '../../../../src/modules/documents/types';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

describe('handleElementPointerDown', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  const createCoordinates = (pageNumber: number = 1) => ({
    x: 100,
    y: 200,
    pageNumber,
    pageWidth: 612,
    pageHeight: 792,
  });

  const createContext = (
    signatures: SignaturePlacement[] = [],
    texts: TextPlacement[] = [],
    dates: DatePlacement[] = [],
    pendingElementType: string | null = null,
    pendingCoordinates: PDFCoordinates | null = null
  ): ElementInteractionContext => ({
    currentPage: 1,
    renderMetrics: createRenderMetrics(),
    signatures,
    texts,
    dates,
    elements: { signatures, texts, dates },
    pendingCoordinates: pendingCoordinates || (pendingElementType ? createCoordinates(1) : null),
    pendingElementType,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
  });

  describe('Element hit detection', () => {
    it('should handle pointer down on signature element', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayPoint = {
        x: 100 / scaleX + 75,
        y: 200 / scaleY + 30,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.elementHit?.type).toBe(PdfElementType.Signature);
      expect(result.elementHit?.index).toBe(0);
    });

    it('should handle pointer down on text element', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Hello',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const context = createContext([], texts);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 5 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayPoint = {
        x: 100 * scaleX + textWidth / 2,
        y: boundsY + fontSize / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.elementHit?.type).toBe(PdfElementType.Text);
    });

    it('should handle pointer down on date element', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const context = createContext([], [], dates);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const dateWidth = 80 * scaleX;
      const boundsY = 200 * scaleY;
      const displayPoint = {
        x: 100 * scaleX + dateWidth / 2,
        y: boundsY + fontSize / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.elementHit?.type).toBe(PdfElementType.Date);
    });
  });

  describe('Control hit detection', () => {
    it('should detect delete button hit', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayPoint = {
        x: (100 / scaleX + 150 / scaleX) - 8,
        y: 200 / scaleY,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.controlHit).not.toBeNull();
      expect(result.controlHit?.type).toBe(ControlType.Delete);
      expect(result.result).not.toBeNull();
    });

    it('should detect resize handle hit', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayPoint = {
        x: (100 / scaleX + 150 / scaleX) - 6,
        y: (200 / scaleY + 60 / scaleY) - 6,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.controlHit).not.toBeNull();
      expect(result.controlHit?.type).toBe(ControlType.Resize);
    });
  });

  describe('Pending element handling', () => {
    it('should handle pending element type when no element is hit', () => {
      const pendingCoords = createCoordinates(1);
      const context = createContext([], [], [], 'text', pendingCoords);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const defaultHeight = 14 * scaleY;
      const displayPoint = {
        x: pendingCoords.x * scaleX + 50,
        y: pendingCoords.y * scaleY - defaultHeight / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).toBeNull();
      expect(result.result).not.toBeNull();
    });

    it('should return null result when no element and no pending element', () => {
      const context = createContext();

      const result = handleElementPointerDown({
        context,
        displayPoint: { x: 10, y: 10 },
      });

      expect(result.result).toBeNull();
      expect(result.elementHit).toBeNull();
      expect(result.controlHit).toBeNull();
      expect(result.elementBounds).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty element arrays', () => {
      const context = createContext();

      const result = handleElementPointerDown({
        context,
        displayPoint: { x: 100, y: 200 },
      });

      expect(result.result).toBeNull();
    });

    it('should handle elements on different page', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(2),
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);

      const result = handleElementPointerDown({
        context,
        displayPoint: { x: 100, y: 200 },
      });

      expect(result.elementHit).toBeNull();
    });

    it('should handle control hit on text element', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const context = createContext([], texts);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 4 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayPoint = {
        x: (100 * scaleX + textWidth) - 8,
        y: boundsY + fontSize / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).not.toBeNull();
      if (result.elementHit && result.elementBounds) {
        const topY = result.elementBounds.y - result.elementBounds.height;
        const controlHit = getControlAtDisplayPosition(displayPoint.x, topY, result.elementBounds, PdfElementType.Text);
        expect(controlHit).not.toBeNull();
      }
    });

    it('should handle control hit on date element', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const context = createContext([], [], dates);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const dateWidth = 80 * scaleX;
      const boundsY = 200 * scaleY;
      const displayPoint = {
        x: (100 * scaleX + dateWidth) - 8,
        y: boundsY + fontSize / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).not.toBeNull();
      if (result.elementHit && result.elementBounds) {
        const topY = result.elementBounds.y - result.elementBounds.height;
        const controlHit = getControlAtDisplayPosition(displayPoint.x, topY, result.elementBounds, PdfElementType.Date);
        expect(controlHit).not.toBeNull();
      }
    });

    it('should handle pending element type text', () => {
      const pendingCoords = createCoordinates(1);
      const context = createContext([], [], [], 'text', pendingCoords);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const defaultHeight = 14 * scaleY;
      const displayPoint = {
        x: pendingCoords.x * scaleX + 50,
        y: pendingCoords.y * scaleY - defaultHeight / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).toBeNull();
      expect(result.result).not.toBeNull();
    });

    it('should handle pending element type date', () => {
      const pendingCoords = createCoordinates(1);
      const context = createContext([], [], [], 'date', pendingCoords);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const defaultHeight = 14 * scaleY;
      const displayPoint = {
        x: pendingCoords.x * scaleX + 40,
        y: pendingCoords.y * scaleY - defaultHeight / 2,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).toBeNull();
      expect(result.result).not.toBeNull();
    });

    it('should handle pending element type signature', () => {
      const pendingCoords = createCoordinates(1);
      const context = createContext([], [], [], 'signature', pendingCoords);
      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const displayPoint = {
        x: pendingCoords.x * scaleX + 75,
        y: pendingCoords.y * scaleY + 30,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementHit).toBeNull();
      expect(result.result).not.toBeNull();
    });

    it('should return element bounds when element is hit', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const context = createContext(signatures);
      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayPoint = {
        x: 100 / scaleX + 75,
        y: 200 / scaleY + 30,
      };

      const result = handleElementPointerDown({
        context,
        displayPoint,
      });

      expect(result.elementBounds).not.toBeNull();
    });
  });
});
