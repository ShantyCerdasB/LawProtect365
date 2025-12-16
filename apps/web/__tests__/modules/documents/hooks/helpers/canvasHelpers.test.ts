/**
 * @fileoverview Canvas Helpers Tests
 * @summary Tests for canvas helper functions
 */

import {
  drawResizeHandle,
  drawTextLikeResizeHandles,
  drawDeleteButton,
  drawElementStroke,
  drawPendingFill,
  drawClickIndicator,
} from '@/modules/documents/hooks/helpers/canvasHelpers';
import type { PdfPageRenderMetrics } from '@/modules/documents/interfaces';
import { CONTROL_SIZES, STROKE_CONFIG, OVERLAY_COLORS } from '@/modules/documents/hooks/constants/OverlayConstants';

describe('canvasHelpers', () => {
  let mockCtx: CanvasRenderingContext2D;
  let mockRenderMetrics: PdfPageRenderMetrics;

  beforeEach(() => {
    mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      setLineDash: jest.fn(),
      rect: jest.fn(),
    } as any;

    mockRenderMetrics = {
      outputScale: 1,
      viewportWidth: 800,
      viewportHeight: 1200,
      pdfPageWidth: 800,
      pdfPageHeight: 1200,
    };
  });

  describe('drawResizeHandle', () => {
    it('should draw a resize handle at specified position', () => {
      drawResizeHandle(mockCtx, 100, 200, mockRenderMetrics);

      expect(mockCtx.fillStyle).toBe(OVERLAY_COLORS.ACTIVE);
      expect(mockCtx.strokeStyle).toBe(OVERLAY_COLORS.WHITE);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(100, 200, CONTROL_SIZES.HANDLE_SIZE, CONTROL_SIZES.HANDLE_SIZE);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 200, CONTROL_SIZES.HANDLE_SIZE, CONTROL_SIZES.HANDLE_SIZE);
    });

    it('should adjust line width based on output scale', () => {
      mockRenderMetrics.outputScale = 2;
      drawResizeHandle(mockCtx, 0, 0, mockRenderMetrics);

      expect(mockCtx.lineWidth).toBe(STROKE_CONFIG.LINE_WIDTH_ACTIVE / 2);
    });

    it('should handle zero output scale', () => {
      mockRenderMetrics.outputScale = 0;
      drawResizeHandle(mockCtx, 0, 0, mockRenderMetrics);

      expect(mockCtx.lineWidth).toBeGreaterThan(0);
    });
  });

  describe('drawTextLikeResizeHandles', () => {
    it('should draw four resize handles for text element', () => {
      drawTextLikeResizeHandles(mockCtx, 50, 100, 200, 14, mockRenderMetrics);

      expect(mockCtx.fillRect).toHaveBeenCalledTimes(4);
      expect(mockCtx.strokeRect).toHaveBeenCalledTimes(4);
    });

    it('should position handles correctly for text element', () => {
      const x = 50;
      const y = 100;
      const width = 200;
      const fontSize = 14;

      drawTextLikeResizeHandles(mockCtx, x, y, width, fontSize, mockRenderMetrics);

      const calls = (mockCtx.fillRect as jest.Mock).mock.calls;
      expect(calls.length).toBe(4);
    });

    it('should handle different font sizes', () => {
      drawTextLikeResizeHandles(mockCtx, 0, 0, 100, 20, mockRenderMetrics);

      expect(mockCtx.fillRect).toHaveBeenCalledTimes(4);
    });
  });

  describe('drawDeleteButton', () => {
    it('should draw delete button at specified position', () => {
      drawDeleteButton(mockCtx, 100, 50, mockRenderMetrics);

      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should use correct delete button color', () => {
      drawDeleteButton(mockCtx, 0, 0, mockRenderMetrics);

      expect(mockCtx.fillStyle).toBe(OVERLAY_COLORS.DELETE);
    });

    it('should draw delete button with X lines', () => {
      drawDeleteButton(mockCtx, 100, 50, mockRenderMetrics);

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw rectangle for delete button background', () => {
      drawDeleteButton(mockCtx, 100, 50, mockRenderMetrics);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        100,
        50,
        CONTROL_SIZES.DELETE_SIZE,
        CONTROL_SIZES.DELETE_SIZE
      );
    });
  });

  describe('drawElementStroke', () => {
    it('should draw stroke with specified parameters', () => {
      drawElementStroke(mockCtx, 10, 20, 100, 50, false, mockRenderMetrics);

      expect(mockCtx.strokeRect).toHaveBeenCalled();
    });

    it('should use active color for active state', () => {
      drawElementStroke(mockCtx, 0, 0, 100, 100, true, mockRenderMetrics);

      expect(mockCtx.strokeStyle).toBe(OVERLAY_COLORS.ACTIVE);
    });

    it('should use normal color for normal state', () => {
      drawElementStroke(mockCtx, 0, 0, 100, 100, false, mockRenderMetrics);

      expect(mockCtx.strokeStyle).toBe(OVERLAY_COLORS.NORMAL);
    });

    it('should apply dash pattern for active state', () => {
      drawElementStroke(mockCtx, 0, 0, 100, 100, true, mockRenderMetrics);

      expect(mockCtx.setLineDash).toHaveBeenCalledWith(STROKE_CONFIG.DASH_PATTERN);
    });

    it('should apply correct line width for active state', () => {
      drawElementStroke(mockCtx, 0, 0, 100, 100, true, mockRenderMetrics);

      expect(mockCtx.lineWidth).toBe(STROKE_CONFIG.LINE_WIDTH_DRAGGED / mockRenderMetrics.outputScale);
    });

    it('should apply padding to stroke rectangle', () => {
      drawElementStroke(mockCtx, 10, 20, 100, 50, false, mockRenderMetrics);

      const padding = STROKE_CONFIG.PADDING;
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(
        10 - padding,
        20 - padding,
        100 + padding * 2,
        50 + padding * 2
      );
    });
  });

  describe('drawPendingFill', () => {
    it('should draw fill with specified parameters', () => {
      drawPendingFill(mockCtx, 10, 20, 100, 50);

      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should use pending fill color', () => {
      drawPendingFill(mockCtx, 0, 0, 100, 100);

      expect(mockCtx.fillStyle).toBe(OVERLAY_COLORS.PENDING_FILL);
    });

    it('should apply padding to fill rectangle', () => {
      drawPendingFill(mockCtx, 10, 20, 100, 50);

      const padding = STROKE_CONFIG.PADDING;
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        10 - padding,
        20 - padding,
        100 + padding * 2,
        50 + padding * 2
      );
    });
  });

  describe('drawClickIndicator', () => {
    it('should draw click indicator circle', () => {
      drawClickIndicator(mockCtx, 100, 200);

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should use red color for click indicator', () => {
      drawClickIndicator(mockCtx, 0, 0);

      expect(mockCtx.fillStyle).toBe(OVERLAY_COLORS.RED);
    });

    it('should draw circle at specified coordinates', () => {
      drawClickIndicator(mockCtx, 100, 200);

      expect(mockCtx.arc).toHaveBeenCalledWith(
        100,
        200,
        CONTROL_SIZES.CLICK_INDICATOR_RADIUS,
        0,
        Math.PI * 2
      );
    });
  });
});


