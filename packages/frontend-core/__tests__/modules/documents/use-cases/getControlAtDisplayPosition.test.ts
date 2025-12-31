/**
 * @fileoverview Tests for getControlAtDisplayPosition use case
 * @summary Unit tests for control hit-testing
 * @description Comprehensive tests for detecting resize handles and delete buttons
 */

import { describe, it, expect } from '@jest/globals';
import { getControlAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getControlAtDisplayPosition';
import { PdfElementType, ControlType, ResizeHandle } from '../../../../src/modules/documents/enums';
import type { ElementDisplayBounds } from '../../../../src/modules/documents/types';

describe('getControlAtDisplayPosition', () => {
  const createBounds = (): ElementDisplayBounds => ({
    x: 100,
    y: 200,
    width: 150,
    height: 60,
  });

  describe('Delete button detection', () => {
    it('should detect delete button for signature element', () => {
      const bounds = createBounds();
      const deleteX = bounds.x + bounds.width - 12;
      const deleteY = bounds.y;

      const result = getControlAtDisplayPosition(
        deleteX + 5,
        deleteY + 5,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should detect delete button for text element', () => {
      const bounds = createBounds();
      const deleteX = bounds.x + bounds.width - 12;
      const deleteY = bounds.y - bounds.height;

      const result = getControlAtDisplayPosition(
        deleteX + 5,
        deleteY + 5,
        bounds,
        PdfElementType.Text
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should detect delete button for date element', () => {
      const bounds = createBounds();
      const deleteX = bounds.x + bounds.width - 12;
      const deleteY = bounds.y - bounds.height;

      const result = getControlAtDisplayPosition(
        deleteX + 5,
        deleteY + 5,
        bounds,
        PdfElementType.Date
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should return null when pointer is not on delete button', () => {
      const bounds = createBounds();

      const result = getControlAtDisplayPosition(
        bounds.x + 50,
        bounds.y + 30,
        bounds,
        PdfElementType.Signature
      );

      expect(result).toBeNull();
    });
  });

  describe('Resize handle detection for signature', () => {
    it('should detect southeast resize handle', () => {
      const bounds = createBounds();
      const handleX = bounds.x + bounds.width - 8;
      const handleY = bounds.y + bounds.height - 8;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southeast);
    });

    it('should detect southwest resize handle', () => {
      const bounds = createBounds();
      const handleX = bounds.x;
      const handleY = bounds.y + bounds.height - 8;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southwest);
    });

    it('should detect northeast resize handle when delete button is smaller', () => {
      const bounds = createBounds();
      const handleX = bounds.x + bounds.width - 12;
      const handleY = bounds.y;

      const result = getControlAtDisplayPosition(
        handleX + 2,
        handleY + 2,
        bounds,
        PdfElementType.Signature,
        { deleteSize: 8 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northeast);
    });

    it('should detect northwest resize handle', () => {
      const bounds = createBounds();
      const handleX = bounds.x;
      const handleY = bounds.y;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });
  });

  describe('Resize handle detection for text/date', () => {
    it('should detect southeast resize handle for text', () => {
      const bounds = createBounds();
      const handleX = bounds.x + bounds.width - 8;
      const handleY = bounds.y - 8;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Text
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southeast);
    });

    it('should detect southwest resize handle for date', () => {
      const bounds = createBounds();
      const handleX = bounds.x;
      const handleY = bounds.y - 8;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Date
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southwest);
    });

    it('should detect northeast resize handle for text when delete button is smaller', () => {
      const bounds = createBounds();
      const topY = bounds.y - bounds.height;
      const handleX = bounds.x + bounds.width - 12;
      const handleY = topY;

      const result = getControlAtDisplayPosition(
        handleX + 2,
        handleY + 2,
        bounds,
        PdfElementType.Text,
        { deleteSize: 8 }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northeast);
    });

    it('should detect northwest resize handle for date', () => {
      const bounds = createBounds();
      const topY = bounds.y - bounds.height;
      const handleX = bounds.x;
      const handleY = topY;

      const result = getControlAtDisplayPosition(
        handleX + 3,
        handleY + 3,
        bounds,
        PdfElementType.Date
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });
  });

  describe('Edge cases', () => {
    it('should return null when pointer is outside all controls', () => {
      const bounds = createBounds();

      const result = getControlAtDisplayPosition(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds,
        PdfElementType.Signature
      );

      expect(result).toBeNull();
    });

    it('should handle custom handle size configuration', () => {
      const bounds = createBounds();
      const customHandleSize = 16;
      const handleX = bounds.x + bounds.width - customHandleSize;
      const handleY = bounds.y + bounds.height - customHandleSize;

      const result = getControlAtDisplayPosition(
        handleX + 5,
        handleY + 5,
        bounds,
        PdfElementType.Signature,
        { handleSize: customHandleSize }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
    });

    it('should handle custom delete size configuration', () => {
      const bounds = createBounds();
      const customDeleteSize = 20;
      const deleteX = bounds.x + bounds.width - customDeleteSize;
      const deleteY = bounds.y;

      const result = getControlAtDisplayPosition(
        deleteX + 5,
        deleteY + 5,
        bounds,
        PdfElementType.Signature,
        { deleteSize: customDeleteSize }
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should handle bounds at origin', () => {
      const bounds: ElementDisplayBounds = {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      };

      const result = getControlAtDisplayPosition(
        5,
        5,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });

    it('should handle very small bounds', () => {
      const bounds: ElementDisplayBounds = {
        x: 10,
        y: 10,
        width: 20,
        height: 20,
      };

      const result = getControlAtDisplayPosition(
        12,
        12,
        bounds,
        PdfElementType.Signature
      );

      expect(result).not.toBeNull();
    });

    it('should prioritize delete button over resize handles', () => {
      const bounds = createBounds();
      const deleteX = bounds.x + bounds.width - 12;
      const deleteY = bounds.y;

      const result = getControlAtDisplayPosition(
        deleteX + 5,
        deleteY + 5,
        bounds,
        PdfElementType.Signature
      );

      expect(result?.type).toBe(ControlType.Delete);
    });
  });
});















