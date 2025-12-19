/**
 * @fileoverview Tests for convertCoordinates use case
 * @summary Unit tests for coordinate conversion utilities
 * @description Comprehensive tests for PDF to Display and Display to PDF coordinate conversions
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertPDFToDisplay,
  convertDisplayToPDF,
  calculateScaleFactors,
} from '../../../../src/modules/documents/use-cases/convertCoordinates';
import type { PdfRenderMetrics } from '../../../../src/modules/documents/types';

describe('convertCoordinates', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  describe('convertPDFToDisplay', () => {
    it('should convert PDF coordinates to display coordinates', () => {
      const coordinates = { x: 100, y: 200, pageNumber: 1, pageWidth: 612, pageHeight: 792 };
      const renderMetrics = createRenderMetrics();

      const result = convertPDFToDisplay({ coordinates, renderMetrics });

      const expectedX = 100 * (1024 / 612);
      const expectedY = 200 * (1320 / 792);

      expect(result.x).toBeCloseTo(expectedX, 2);
      expect(result.y).toBeCloseTo(expectedY, 2);
    });

    it('should handle coordinates at origin', () => {
      const coordinates = { x: 0, y: 0, pageNumber: 1, pageWidth: 612, pageHeight: 792 };
      const renderMetrics = createRenderMetrics();

      const result = convertPDFToDisplay({ coordinates, renderMetrics });

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle coordinates at page boundaries', () => {
      const coordinates = { x: 612, y: 792, pageNumber: 1, pageWidth: 612, pageHeight: 792 };
      const renderMetrics = createRenderMetrics();

      const result = convertPDFToDisplay({ coordinates, renderMetrics });

      expect(result.x).toBeCloseTo(1024, 2);
      expect(result.y).toBeCloseTo(1320, 2);
    });

    it('should handle different viewport sizes', () => {
      const coordinates = { x: 306, y: 396, pageNumber: 1, pageWidth: 612, pageHeight: 792 };
      const renderMetrics = {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 2048,
        viewportHeight: 2640,
      };

      const result = convertPDFToDisplay({ coordinates, renderMetrics });

      expect(result.x).toBeCloseTo(1024, 2);
      expect(result.y).toBeCloseTo(1320, 2);
    });

    it('should handle fractional coordinates', () => {
      const coordinates = { x: 50.5, y: 75.25, pageNumber: 1, pageWidth: 612, pageHeight: 792 };
      const renderMetrics = createRenderMetrics();

      const result = convertPDFToDisplay({ coordinates, renderMetrics });

      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeGreaterThan(0);
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });
  });

  describe('convertDisplayToPDF', () => {
    it('should convert display coordinates to PDF coordinates', () => {
      const displayPoint = { x: 512, y: 660 };
      const renderMetrics = createRenderMetrics();
      const pageNumber = 1;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      const expectedX = 512 * (612 / 1024);
      const expectedY = 660 * (792 / 1320);

      expect(result.x).toBeCloseTo(expectedX, 2);
      expect(result.y).toBeCloseTo(expectedY, 2);
      expect(result.pageNumber).toBe(1);
      expect(result.pageWidth).toBe(612);
      expect(result.pageHeight).toBe(792);
    });

    it('should handle coordinates at origin', () => {
      const displayPoint = { x: 0, y: 0 };
      const renderMetrics = createRenderMetrics();
      const pageNumber = 1;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.pageNumber).toBe(1);
    });

    it('should handle coordinates at viewport boundaries', () => {
      const displayPoint = { x: 1024, y: 1320 };
      const renderMetrics = createRenderMetrics();
      const pageNumber = 1;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      expect(result.x).toBeCloseTo(612, 2);
      expect(result.y).toBeCloseTo(792, 2);
      expect(result.pageNumber).toBe(1);
    });

    it('should handle different page numbers', () => {
      const displayPoint = { x: 512, y: 660 };
      const renderMetrics = createRenderMetrics();
      const pageNumber = 3;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      expect(result.pageNumber).toBe(3);
      expect(result.pageWidth).toBe(612);
      expect(result.pageHeight).toBe(792);
    });

    it('should handle fractional display coordinates', () => {
      const displayPoint = { x: 256.5, y: 330.25 };
      const renderMetrics = createRenderMetrics();
      const pageNumber = 1;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeGreaterThan(0);
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('should handle different viewport sizes', () => {
      const displayPoint = { x: 1024, y: 1320 };
      const renderMetrics = {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 2048,
        viewportHeight: 2640,
      };
      const pageNumber = 1;

      const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

      expect(result.x).toBeCloseTo(306, 2);
      expect(result.y).toBeCloseTo(396, 2);
    });
  });

  describe('calculateScaleFactors', () => {
    it('should calculate scale factors correctly', () => {
      const renderMetrics = createRenderMetrics();

      const result = calculateScaleFactors(renderMetrics);

      expect(result.scaleX).toBeCloseTo(1024 / 612, 2);
      expect(result.scaleY).toBeCloseTo(1320 / 792, 2);
    });

    it('should handle square viewport and page', () => {
      const renderMetrics = {
        pdfPageWidth: 100,
        pdfPageHeight: 100,
        viewportWidth: 200,
        viewportHeight: 200,
      };

      const result = calculateScaleFactors(renderMetrics);

      expect(result.scaleX).toBe(2);
      expect(result.scaleY).toBe(2);
    });

    it('should handle different aspect ratios', () => {
      const renderMetrics = {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 1224,
        viewportHeight: 1584,
      };

      const result = calculateScaleFactors(renderMetrics);

      expect(result.scaleX).toBe(2);
      expect(result.scaleY).toBe(2);
    });

    it('should handle viewport smaller than PDF page', () => {
      const renderMetrics = {
        pdfPageWidth: 612,
        pdfPageHeight: 792,
        viewportWidth: 306,
        viewportHeight: 396,
      };

      const result = calculateScaleFactors(renderMetrics);

      expect(result.scaleX).toBe(0.5);
      expect(result.scaleY).toBe(0.5);
    });

    it('should handle fractional dimensions', () => {
      const renderMetrics = {
        pdfPageWidth: 612.5,
        pdfPageHeight: 792.25,
        viewportWidth: 1024.75,
        viewportHeight: 1320.5,
      };

      const result = calculateScaleFactors(renderMetrics);

      expect(result.scaleX).toBeGreaterThan(0);
      expect(result.scaleY).toBeGreaterThan(0);
      expect(typeof result.scaleX).toBe('number');
      expect(typeof result.scaleY).toBe('number');
    });
  });
});







