/**
 * @fileoverview Tests for getElementDisplayBounds use case
 * @summary Unit tests for element display bounds calculation
 */

import { describe, it, expect } from '@jest/globals';
import { getElementDisplayBounds } from '../../../../src/modules/documents/use-cases/getElementDisplayBounds';
import { PdfElementType } from '../../../../src/modules/documents/enums';

describe('getElementDisplayBounds', () => {
  const createRenderMetrics = () => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  describe('Signature elements', () => {
    it('should calculate display bounds for signature on current page', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          width: 150,
          height: 60,
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Signature,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toEqual({
        x: 100 * (1024 / 612),
        y: 200 * (1320 / 792),
        width: 150 * (1024 / 612),
        height: 60 * (1320 / 792),
      });
    });

    it('should return null when signature is not on current page', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Signature,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when signature index is out of bounds', () => {
      const result = getElementDisplayBounds({
        elementType: PdfElementType.Signature,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should use default dimensions when width/height not provided', () => {
      const signatures = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Signature,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures,
        texts: [],
        dates: [],
      });

      expect(result?.width).toBe(150 * (1024 / 612));
      expect(result?.height).toBe(60 * (1320 / 792));
    });
  });

  describe('Text elements', () => {
    it('should calculate display bounds for text on current page', () => {
      const texts = [
        {
          text: 'Hello',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Text,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      const fontSizeDisplay = 12 * (1320 / 792);
      expect(result).toEqual({
        x: 100 * (1024 / 612),
        y: 200 * (1320 / 792),
        width: 5 * fontSizeDisplay * 0.6,
        height: fontSizeDisplay,
      });
    });

    it('should return null when text is not on current page', () => {
      const texts = [
        {
          text: 'Hello',
          coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          fontSize: 12,
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Text,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      expect(result).toBeNull();
    });

    it('should use default font size when not provided', () => {
      const texts = [
        {
          text: 'Test',
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Text,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts,
        dates: [],
      });

      const fontSizeDisplay = 12 * (1320 / 792);
      expect(result?.height).toBe(fontSizeDisplay);
    });
  });

  describe('Date elements', () => {
    it('should calculate display bounds for date on current page', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Date,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      const fontSizeDisplay = 12 * (1320 / 792);
      expect(result).toEqual({
        x: 100 * (1024 / 612),
        y: 200 * (1320 / 792),
        width: 80 * (1024 / 612),
        height: fontSizeDisplay,
      });
    });

    it('should return null when date is not on current page', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 2, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Date,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      expect(result).toBeNull();
    });

    it('should use default font size when not provided', () => {
      const dates = [
        {
          date: new Date('2024-01-15'),
          coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
          format: 'MM/DD/YYYY',
        },
      ];

      const result = getElementDisplayBounds({
        elementType: PdfElementType.Date,
        index: 0,
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        signatures: [],
        texts: [],
        dates,
      });

      const fontSizeDisplay = 12 * (1320 / 792);
      expect(result?.height).toBe(fontSizeDisplay);
    });
  });
});
