/**
 * @fileoverview Tests for detectElementInteraction use case
 * @summary Unit tests for element and control interaction detection
 * @description Comprehensive tests for detecting elements and controls at display points
 */

import { describe, it, expect } from '@jest/globals';
import {
  detectElementAtPoint,
  detectControlAtPoint,
} from '../../../../src/modules/documents/use-cases/detectElementInteraction';
import { getElementDisplayBounds } from '../../../../src/modules/documents/use-cases/getElementDisplayBounds';
import { getControlAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getControlAtDisplayPosition';
import { PdfElementType, ControlType } from '../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../src/modules/documents/types';

describe('detectElementInteraction', () => {
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

  describe('detectElementAtPoint', () => {
    it('should detect signature element at point', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = 100 / scaleX + 75;
      const displayY = 200 / scaleY + 30;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Signature);
      expect(result?.index).toBe(0);
    });

    it('should detect text element at point', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Hello',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 5 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayX = 100 * scaleX + textWidth / 2;
      const displayY = boundsY + fontSize / 2;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts,
          dates: [],
        },
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Text);
      expect(result?.index).toBe(0);
    });

    it('should detect date element at point', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const dateWidth = 80 * scaleX;
      const boundsY = 200 * scaleY;
      const displayX = 100 * scaleX + dateWidth / 2;
      const displayY = boundsY + fontSize / 2;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts: [],
          dates,
        },
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(PdfElementType.Date);
      expect(result?.index).toBe(0);
    });

    it('should return null when no element is at point', () => {
      const result = detectElementAtPoint({
        displayPoint: { x: 10, y: 10 },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts: [],
          dates: [],
        },
      });

      expect(result).toBeNull();
    });

    it('should return null when element is on different page', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(2),
          width: 150,
          height: 60,
        },
      ];

      const result = detectElementAtPoint({
        displayPoint: { x: 200, y: 300 },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).toBeNull();
    });

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

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = 100 / scaleX + 75;
      const displayY = 200 / scaleY + 30;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts,
          dates: [],
        },
      });

      expect(result?.type).toBe(PdfElementType.Signature);
    });
  });

  describe('detectControlAtPoint', () => {
    it('should detect control hit (delete button) on signature', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = (100 / scaleX + 150 / scaleX) - 8;
      const displayY = 200 / scaleY;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.controlHit).not.toBeNull();
      expect(result.controlHit?.type).toBe(ControlType.Delete);
      expect(result.elementBounds).not.toBeNull();
    });

    it('should detect element hit without control hit', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = 100 / scaleX + 75;
      const displayY = 200 / scaleY + 30;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.controlHit).toBeNull();
      expect(result.elementBounds).not.toBeNull();
    });

    it('should return null element hit when no element is at point', () => {
      const result = detectControlAtPoint({
        displayPoint: { x: 10, y: 10 },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts: [],
          dates: [],
        },
      });

      expect(result.elementHit).toBeNull();
      expect(result.controlHit).toBeNull();
      expect(result.elementBounds).toBeNull();
    });

    it('should prioritize control hit over element hit', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = (100 / scaleX + 150 / scaleX) - 8;
      const displayY = 200 / scaleY;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result.controlHit).not.toBeNull();
      expect(result.elementHit).not.toBeNull();
    });

    it('should detect resize handle on text element', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 4 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayX = (100 * scaleX + textWidth) - 6;
      const displayY = boundsY + fontSize / 2;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts,
          dates: [],
        },
      });

      expect(result.elementHit).not.toBeNull();
      if (result.elementHit && result.elementBounds) {
        const topY = result.elementBounds.y - result.elementBounds.height;
        const controlHit = getControlAtDisplayPosition(displayX, topY + 6, result.elementBounds, PdfElementType.Text);
        expect(controlHit).not.toBeNull();
      }
    });
  });

  describe('Edge cases and multiple elements', () => {
    it('should handle multiple signatures and return first match', () => {
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

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = 100 / scaleX + 75;
      const displayY = 200 / scaleY + 30;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should handle multiple texts and return first match', () => {
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

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 5 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayX = 100 * scaleX + textWidth / 2;
      const displayY = boundsY + fontSize / 2;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts,
          dates: [],
        },
      });

      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should handle element at boundary edges', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = 100 / scaleX;
      const displayY = 200 / scaleY;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).not.toBeNull();
    });

    it('should handle element at right and bottom boundaries', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = (100 + 150) / scaleX;
      const displayY = (200 + 60) / scaleY;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).not.toBeNull();
    });

    it('should return null when point is just outside element bounds', () => {
      const signatures: SignaturePlacement[] = [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: createCoordinates(1),
          width: 150,
          height: 60,
        },
      ];

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = (100 + 150 + 1) / scaleX;
      const displayY = 200 / scaleY;

      const result = detectElementAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts: [],
          dates: [],
        },
      });

      expect(result).toBeNull();
    });

    it('should detect control on date element', () => {
      const dates: DatePlacement[] = [
        {
          date: new Date(2024, 0, 15),
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const dateWidth = 80 * scaleX;
      const boundsY = 200 * scaleY;
      const displayX = (100 * scaleX + dateWidth) - 8;
      const displayY = boundsY + fontSize / 2;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts: [],
          dates,
        },
      });

      expect(result.elementHit).not.toBeNull();
      if (result.elementHit && result.elementBounds) {
        const topY = result.elementBounds.y - result.elementBounds.height;
        const controlHit = getControlAtDisplayPosition(displayX, topY, result.elementBounds, PdfElementType.Date);
        expect(controlHit).not.toBeNull();
      }
    });

    it('should handle multiple overlapping elements and return first control hit', () => {
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

      const scaleX = 612 / 1024;
      const scaleY = 792 / 1320;
      const displayX = (100 / scaleX + 150 / scaleX) - 8;
      const displayY = 200 / scaleY;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures,
          texts,
          dates: [],
        },
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.controlHit).not.toBeNull();
      expect(result.elementHit?.type).toBe(PdfElementType.Signature);
    });

    it('should return element hit without control when point is in element but not on control', () => {
      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: createCoordinates(1),
          fontSize: 12,
        },
      ];

      const scaleX = 1024 / 612;
      const scaleY = 1320 / 792;
      const fontSize = 12 * scaleY;
      const textWidth = 4 * fontSize * 0.6;
      const boundsY = 200 * scaleY;
      const displayX = 100 * scaleX + textWidth / 2;
      const displayY = boundsY + fontSize / 2;

      const result = detectControlAtPoint({
        displayPoint: { x: displayX, y: displayY },
        pageNumber: 1,
        renderMetrics: createRenderMetrics(),
        elements: {
          signatures: [],
          texts,
          dates: [],
        },
      });

      expect(result.elementHit).not.toBeNull();
      expect(result.controlHit).toBeNull();
      expect(result.elementBounds).not.toBeNull();
    });
  });
});
