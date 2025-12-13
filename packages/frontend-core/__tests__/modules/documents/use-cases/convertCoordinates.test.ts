/**
 * @fileoverview Tests for convertCoordinates use case
 * @summary Unit tests for coordinate conversion functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertPDFToDisplay,
  convertDisplayToPDF,
  calculateScaleFactors,
} from '../../../../src/modules/documents/use-cases/convertCoordinates';
import type { PdfRenderMetrics } from '../../../../src/modules/documents/types';

describe('convertPDFToDisplay', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  it('should convert PDF coordinates to display coordinates', () => {
    const coordinates = {
      pageNumber: 1,
      x: 306,
      y: 396,
      pageWidth: 612,
      pageHeight: 792,
    };
    const renderMetrics = createRenderMetrics();

    const result = convertPDFToDisplay({ coordinates, renderMetrics });

    expect(result.x).toBeCloseTo(512, 2);
    expect(result.y).toBeCloseTo(660, 2);
  });

  it('should handle coordinates at origin', () => {
    const coordinates = {
      pageNumber: 1,
      x: 0,
      y: 0,
      pageWidth: 612,
      pageHeight: 792,
    };
    const renderMetrics = createRenderMetrics();

    const result = convertPDFToDisplay({ coordinates, renderMetrics });

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should handle coordinates at page boundaries', () => {
    const coordinates = {
      pageNumber: 1,
      x: 612,
      y: 792,
      pageWidth: 612,
      pageHeight: 792,
    };
    const renderMetrics = createRenderMetrics();

    const result = convertPDFToDisplay({ coordinates, renderMetrics });

    expect(result.x).toBeCloseTo(1024, 2);
    expect(result.y).toBeCloseTo(1320, 2);
  });

  it('should handle different aspect ratios', () => {
    const coordinates = {
      pageNumber: 1,
      x: 100,
      y: 200,
      pageWidth: 612,
      pageHeight: 792,
    };
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 500,
      viewportHeight: 800,
    };

    const result = convertPDFToDisplay({ coordinates, renderMetrics });

    expect(result.x).toBeCloseTo(81.7, 1);
    expect(result.y).toBeCloseTo(202.0, 1);
  });
});

describe('convertDisplayToPDF', () => {
  const createRenderMetrics = (): PdfRenderMetrics => ({
    pdfPageWidth: 612,
    pdfPageHeight: 792,
    viewportWidth: 1024,
    viewportHeight: 1320,
  });

  it('should convert display coordinates to PDF coordinates', () => {
    const displayPoint = { x: 512, y: 660 };
    const renderMetrics = createRenderMetrics();
    const pageNumber = 1;

    const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

    expect(result.x).toBeCloseTo(306, 2);
    expect(result.y).toBeCloseTo(396, 2);
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
  });

  it('should handle different page numbers', () => {
    const displayPoint = { x: 512, y: 660 };
    const renderMetrics = createRenderMetrics();
    const pageNumber = 3;

    const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

    expect(result.pageNumber).toBe(3);
  });

  it('should handle different aspect ratios', () => {
    const displayPoint = { x: 250, y: 400 };
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 500,
      viewportHeight: 800,
    };
    const pageNumber = 1;

    const result = convertDisplayToPDF({ displayPoint, renderMetrics, pageNumber });

    expect(result.x).toBeCloseTo(306, 2);
    expect(result.y).toBeCloseTo(396, 2);
  });
});

describe('calculateScaleFactors', () => {
  it('should calculate scale factors correctly', () => {
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 1024,
      viewportHeight: 1320,
    };

    const result = calculateScaleFactors(renderMetrics);

    expect(result.scaleX).toBeCloseTo(1.673, 2);
    expect(result.scaleY).toBeCloseTo(1.667, 2);
  });

  it('should handle 1:1 scale', () => {
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 612,
      viewportHeight: 792,
    };

    const result = calculateScaleFactors(renderMetrics);

    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should handle downscaling', () => {
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 306,
      viewportHeight: 396,
    };

    const result = calculateScaleFactors(renderMetrics);

    expect(result.scaleX).toBe(0.5);
    expect(result.scaleY).toBe(0.5);
  });

  it('should handle upscaling', () => {
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 1224,
      viewportHeight: 1584,
    };

    const result = calculateScaleFactors(renderMetrics);

    expect(result.scaleX).toBe(2);
    expect(result.scaleY).toBe(2);
  });

  it('should handle different X and Y scales', () => {
    const renderMetrics: PdfRenderMetrics = {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 1024,
      viewportHeight: 500,
    };

    const result = calculateScaleFactors(renderMetrics);

    expect(result.scaleX).toBeCloseTo(1.673, 2);
    expect(result.scaleY).toBeCloseTo(0.631, 2);
  });
});
