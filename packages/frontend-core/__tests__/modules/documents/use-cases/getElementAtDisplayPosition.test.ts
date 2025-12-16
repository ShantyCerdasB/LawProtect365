/**
 * @fileoverview Tests for getElementAtDisplayPosition use case
 * @summary Unit tests for element hit-testing at display positions
 * @description Comprehensive tests for detecting elements at display coordinates
 */

import { describe, it, expect } from '@jest/globals';
import { getElementAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getElementAtDisplayPosition';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../src/modules/documents/types';

describe('getElementAtDisplayPosition', () => {
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

  describe('Signature detection', () => {
    it('should detect signature at display position', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const displayX = 100 * (1024 / 612) + 75;
      const displayY = 200 * (1320 / 792) + 30;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Signature);
      expect(result?.index).toBe(0);
    });

    it('should return null when signature is on different page', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(2),
          width: 150,
          height: 60,
        },
      ];

      const result = getElementAtDisplayPosition({
        displayX: 200,
        displayY: 300,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when point is outside signature bounds', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const result = getElementAtDisplayPosition({
        displayX: 10,
        displayY: 10,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('Text detection', () => {
    it('should detect text at display position', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Hello',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 20;
      const displayY = 200 * (1320 / 792) - 6;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Text);
      expect(result?.index).toBe(0);
    });

    it('should return null when text is on different page', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(2),
          fontSize: 12,
        },
      ];

      const result = getElementAtDisplayPosition({
        displayX: 200,
        displayY: 300,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('Date detection', () => {
    it('should detect date at display position', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 40;
      const displayY = 200 * (1320 / 792) - 6;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Date);
      expect(result?.index).toBe(0);
    });
  });

  describe('Priority order', () => {
    it('should prioritize signatures over texts and dates', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 75;
      const displayY = 200 * (1320 / 792) + 30;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts,
        dates,
      });

      expect(result?.type).toBe(PdfElementType.Signature);
    });
  });

  describe('Edge cases', () => {
    it('should return null when viewport dimensions are invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 792,
          viewportWidth: 0,
          viewportHeight: 1320,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when PDF dimensions are invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 0,
          pdfPageHeight: 792,
          viewportWidth: 1024,
          viewportHeight: 1320,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when no elements are provided', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('Multiple elements and edge cases', () => {
    it('should test multiple signatures and return first match', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
        {
          signatureImage: 'data:image/png;base64,test2',
          coordinates: { x: 300, y: 400, pageNumber: 1, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const displayX = 100 * (1024 / 612) + 75;
      const displayY = 200 * (1320 / 792) + 30;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should test multiple texts and return first match', () => {
      const texts: TextPlacement[] = [
        {
          text: 'First',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
        {
          text: 'Second',
          coordinates: { x: 300, y: 400, pageNumber: 1, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 20;
      const displayY = 200 * (1320 / 792) - 6;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should test multiple dates and return first match', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
        {
          date: new Date(2024, 1, 20),
          coordinates: { x: 300, y: 400, pageNumber: 1, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 40;
      const displayY = 200 * (1320 / 792) - 6;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should skip elements on different pages', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(2),
          width: 150,
          height: 60,
        },
      ];
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 20;
      const displayY = 200 * (1320 / 792) - 6;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Text);
    });

    it('should return null when all elements are on different page', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(2),
          width: 150,
          height: 60,
        },
      ];

      const result = getElementAtDisplayPosition({
        displayX: 200,
        displayY: 300,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should handle point at element boundary', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const displayX = 100 * (1024 / 612);
      const displayY = 200 * (1320 / 792);

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).not.toBeNull();
    });

    it('should handle point at element right and bottom boundary', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const displayX = (100 + 150) * (1024 / 612);
      const displayY = (200 + 60) * (1320 / 792);

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).not.toBeNull();
    });

    it('should return null when viewport height is invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 792,
          viewportWidth: 1024,
          viewportHeight: 0,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when PDF page height is invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 0,
          viewportWidth: 1024,
          viewportHeight: 1320,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when viewport height is invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 792,
          viewportWidth: 1024,
          viewportHeight: 0,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when PDF page height is invalid', () => {
      const result = getElementAtDisplayPosition({
        displayX: 100,
        displayY: 200,
        pageNumber: 1,
        renderMetrics: {
          pdfPageWidth: 612,
          pdfPageHeight: 0,
          viewportWidth: 1024,
          viewportHeight: 1320,
        },
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should test elements in order and return first match', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];
      const texts: TextPlacement[] = [
        {
          text: 'Overlap',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 75;
      const displayY = 200 * (1320 / 792) + 30;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Signature);
    });

    it('should skip elements on different page in testElementType', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Page 2',
          coordinates: createCoordinates(2),
          fontSize: 12,
        },
        {
          text: 'Page 1',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 6 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayX = 100 * scaleX + textWidth / 2;
      const displayY = boundsY - fontSize / 2;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Text);
      expect(result?.index).toBe(1);
    });

    it('should test multiple element types and return first match', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];
      const texts: TextPlacement[] = [
        {
          text: 'Overlap',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const displayX = 100 * (1024 / 612) + 75;
      const displayY = 200 * (1320 / 792) + 30;

      const result = getElementAtDisplayPosition({
        displayX,
        displayY,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts,
        dates: [],
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Signature);
    });
  });
});
