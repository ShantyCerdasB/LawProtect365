/**
 * @fileoverview Tests for getControlAtDisplayPosition use case
 * @summary Unit tests for control hit-testing at display position
 */

import { describe, it, expect } from '@jest/globals';
import { getControlAtDisplayPosition } from '../../../../src/modules/documents/use-cases/getControlAtDisplayPosition';
import { PdfElementType, ControlType, ResizeHandle } from '../../../../src/modules/documents/enums';
import type { ElementDisplayBounds } from '../../../../src/modules/documents/types';

describe('getControlAtDisplayPosition', () => {
  describe('Signature elements', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };

    it('should detect delete button at top-right corner', () => {
      const deleteSize = 16;
      const deleteX = 100 + 150 - deleteSize;
      const deleteY = 200;
      const result = getControlAtDisplayPosition(deleteX, deleteY, bounds, PdfElementType.Signature);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should detect northwest resize handle', () => {
      const handleSize = 12;
      const result = getControlAtDisplayPosition(105, 205, bounds, PdfElementType.Signature);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });

    it('should detect southwest resize handle', () => {
      const handleSize = 12;
      const result = getControlAtDisplayPosition(100, 200 + 60 - handleSize, bounds, PdfElementType.Signature);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southwest);
    });

    it('should return null when point is not on any control', () => {
      const result = getControlAtDisplayPosition(150, 230, bounds, PdfElementType.Signature);

      expect(result).toBeNull();
    });
  });

  describe('Text elements', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 50,
      height: 12,
    };

    it('should detect delete button at top-right corner', () => {
      const deleteSize = 16;
      const topY = 200 - 12;
      const result = getControlAtDisplayPosition(100 + 50 - deleteSize, topY, bounds, PdfElementType.Text);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should detect northwest resize handle', () => {
      const topY = 200 - 12;
      const handleSize = 12;
      const result = getControlAtDisplayPosition(105, topY + handleSize / 2, bounds, PdfElementType.Text);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });

    it('should detect southwest resize handle', () => {
      const handleSize = 12;
      const result = getControlAtDisplayPosition(100, 200 - handleSize, bounds, PdfElementType.Text);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southwest);
    });

    it('should return null when point is not on any control', () => {
      const result = getControlAtDisplayPosition(125, 194, bounds, PdfElementType.Text);

      expect(result).toBeNull();
    });
  });

  describe('Date elements', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 80,
      height: 12,
    };

    it('should detect delete button at top-right corner', () => {
      const deleteSize = 16;
      const topY = 200 - 12;
      const result = getControlAtDisplayPosition(100 + 80 - deleteSize, topY, bounds, PdfElementType.Date);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });

    it('should detect northwest resize handle', () => {
      const topY = 200 - 12;
      const handleSize = 12;
      const result = getControlAtDisplayPosition(105, topY + handleSize / 2, bounds, PdfElementType.Date);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });

    it('should detect southwest resize handle', () => {
      const handleSize = 12;
      const result = getControlAtDisplayPosition(100, 200 - handleSize, bounds, PdfElementType.Date);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Southwest);
    });
  });

  describe('custom control sizes', () => {
    const bounds: ElementDisplayBounds = {
      x: 100,
      y: 200,
      width: 150,
      height: 60,
    };

    it('should use custom handle size', () => {
      const handleSize = 20;
      const result = getControlAtDisplayPosition(105, 205, bounds, PdfElementType.Signature, {
        handleSize: 20,
        deleteSize: 16,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Resize);
      expect(result?.handle).toBe(ResizeHandle.Northwest);
    });

    it('should use custom delete size', () => {
      const deleteSize = 20;
      const result = getControlAtDisplayPosition(100 + 150 - deleteSize, 200, bounds, PdfElementType.Signature, {
        handleSize: 12,
        deleteSize: 20,
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ControlType.Delete);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-sized element', () => {
      const bounds: ElementDisplayBounds = {
        x: 100,
        y: 200,
        width: 0,
        height: 0,
      };

      const result = getControlAtDisplayPosition(100, 200, bounds, PdfElementType.Signature);

      expect(result).toBeNull();
    });
  });
});
