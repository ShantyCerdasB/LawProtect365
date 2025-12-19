/**
 * @fileoverview Overlay Constants Tests
 * @summary Tests for overlay constants
 */

import {
  DEFAULT_DIMENSIONS,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  CONTROL_SIZES,
  STROKE_CONFIG,
  OVERLAY_COLORS,
  REDRAW_TIMEOUT_MS,
} from '@/modules/documents/hooks/constants/OverlayConstants';

describe('OverlayConstants', () => {
  describe('DEFAULT_DIMENSIONS', () => {
    it('should have correct signature width', () => {
      expect(DEFAULT_DIMENSIONS.SIGNATURE_WIDTH).toBe(150);
    });

    it('should have correct signature height', () => {
      expect(DEFAULT_DIMENSIONS.SIGNATURE_HEIGHT).toBe(60);
    });

    it('should have correct text placeholder width', () => {
      expect(DEFAULT_DIMENSIONS.TEXT_PLACEHOLDER_WIDTH).toBe(100);
    });

    it('should have correct text placeholder height', () => {
      expect(DEFAULT_DIMENSIONS.TEXT_PLACEHOLDER_HEIGHT).toBe(14);
    });

    it('should have correct date placeholder width', () => {
      expect(DEFAULT_DIMENSIONS.DATE_PLACEHOLDER_WIDTH).toBe(80);
    });

    it('should have correct date placeholder height', () => {
      expect(DEFAULT_DIMENSIONS.DATE_PLACEHOLDER_HEIGHT).toBe(14);
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(DEFAULT_DIMENSIONS)).toBe(true);
    });
  });

  describe('DEFAULT_FONT_SIZE', () => {
    it('should have correct default font size', () => {
      expect(DEFAULT_FONT_SIZE).toBe(12);
    });
  });

  describe('DEFAULT_FONT_FAMILY', () => {
    it('should have correct default font family', () => {
      expect(DEFAULT_FONT_FAMILY).toBe('Arial');
    });
  });

  describe('CONTROL_SIZES', () => {
    it('should have correct handle size', () => {
      expect(CONTROL_SIZES.HANDLE_SIZE).toBe(12);
    });

    it('should have correct delete size', () => {
      expect(CONTROL_SIZES.DELETE_SIZE).toBe(16);
    });

    it('should have correct delete offset X', () => {
      expect(CONTROL_SIZES.DELETE_OFFSET_X).toBe(3);
    });

    it('should have correct delete offset Y', () => {
      expect(CONTROL_SIZES.DELETE_OFFSET_Y).toBe(3);
    });

    it('should have correct click indicator radius', () => {
      expect(CONTROL_SIZES.CLICK_INDICATOR_RADIUS).toBe(3);
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(CONTROL_SIZES)).toBe(true);
    });
  });

  describe('STROKE_CONFIG', () => {
    it('should have correct padding', () => {
      expect(STROKE_CONFIG.PADDING).toBe(2);
    });

    it('should have correct line width normal', () => {
      expect(STROKE_CONFIG.LINE_WIDTH_NORMAL).toBe(1);
    });

    it('should have correct line width active', () => {
      expect(STROKE_CONFIG.LINE_WIDTH_ACTIVE).toBe(2);
    });

    it('should have correct line width dragged', () => {
      expect(STROKE_CONFIG.LINE_WIDTH_DRAGGED).toBe(3);
    });

    it('should have correct dash pattern', () => {
      expect(STROKE_CONFIG.DASH_PATTERN).toEqual([5, 5]);
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(STROKE_CONFIG)).toBe(true);
    });
  });

  describe('OVERLAY_COLORS', () => {
    it('should have correct active color', () => {
      expect(OVERLAY_COLORS.ACTIVE).toBe('#f59e0b');
    });

    it('should have correct normal color', () => {
      expect(OVERLAY_COLORS.NORMAL).toBe('#3b82f6');
    });

    it('should have correct delete color', () => {
      expect(OVERLAY_COLORS.DELETE).toBe('#ef4444');
    });

    it('should have correct white color', () => {
      expect(OVERLAY_COLORS.WHITE).toBe('#ffffff');
    });

    it('should have correct black color', () => {
      expect(OVERLAY_COLORS.BLACK).toBe('#000000');
    });

    it('should have correct red color', () => {
      expect(OVERLAY_COLORS.RED).toBe('red');
    });

    it('should have correct pending fill color', () => {
      expect(OVERLAY_COLORS.PENDING_FILL).toBe('rgba(245, 158, 11, 0.1)');
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(OVERLAY_COLORS)).toBe(true);
    });
  });

  describe('REDRAW_TIMEOUT_MS', () => {
    it('should have correct redraw timeout', () => {
      expect(REDRAW_TIMEOUT_MS).toBe(50);
    });
  });
});




