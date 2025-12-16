/**
 * @fileoverview Button Constants Tests
 * @summary Tests for button constants and configurations
 */

import { describe, it, expect } from '@jest/globals';
import {
  DEFAULT_PRIMARY_BG,
  DEFAULT_PRIMARY_HOVER_BG,
  DEFAULT_OUTLINE_BG,
  DEFAULT_OUTLINE_HOVER_BG,
  DEFAULT_OUTLINE_HOVER_TEXT,
  DEFAULT_TEXT_COLOR,
  DEFAULT_BORDER_COLOR_PRIMARY,
  DEFAULT_BORDER_COLOR_OUTLINE,
  DEFAULT_OUTLINE_HOVER_BORDER,
  SIZE_CLASSES,
  VARIANT_CLASSES,
  VARIANT_CONFIGS,
  HOVER_CLASSES,
} from '@/ui-kit/buttons/constants/ButtonConstants';
import type { ButtonSize, ButtonVariant } from '@/ui-kit/buttons/types/ButtonTypes';

describe('ButtonConstants', () => {
  describe('Color Constants', () => {
    it('should have correct default primary background color', () => {
      expect(DEFAULT_PRIMARY_BG).toBe('#1d4878');
    });

    it('should have correct default primary hover background color', () => {
      expect(DEFAULT_PRIMARY_HOVER_BG).toBe('#003454');
    });

    it('should have correct default outline background color', () => {
      expect(DEFAULT_OUTLINE_BG).toBe('transparent');
    });

    it('should have correct default outline hover background color', () => {
      expect(DEFAULT_OUTLINE_HOVER_BG).toBe('#ffffff');
    });

    it('should have correct default outline hover text color', () => {
      expect(DEFAULT_OUTLINE_HOVER_TEXT).toBe('#1d4878');
    });

    it('should have correct default text color', () => {
      expect(DEFAULT_TEXT_COLOR).toBe('#ffffff');
    });

    it('should have correct default border color for primary', () => {
      expect(DEFAULT_BORDER_COLOR_PRIMARY).toBe('transparent');
    });

    it('should have correct default border color for outline', () => {
      expect(DEFAULT_BORDER_COLOR_OUTLINE).toBe('#ffffff');
    });

    it('should have correct default outline hover border color', () => {
      expect(DEFAULT_OUTLINE_HOVER_BORDER).toBe('#5e9594');
    });
  });

  describe('SIZE_CLASSES', () => {
    it('should have size classes for all button sizes', () => {
      const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
      
      sizes.forEach((size) => {
        expect(SIZE_CLASSES[size]).toBeDefined();
        expect(typeof SIZE_CLASSES[size]).toBe('string');
      });
    });

    it('should have correct small size classes', () => {
      expect(SIZE_CLASSES.sm).toBe('px-6 py-1 text-xs sm:text-sm');
    });

    it('should have correct medium size classes', () => {
      expect(SIZE_CLASSES.md).toBe('px-10 py-1.5 text-sm sm:text-base');
    });

    it('should have correct large size classes', () => {
      expect(SIZE_CLASSES.lg).toBe('px-12 py-2 text-base sm:text-lg');
    });
  });

  describe('VARIANT_CLASSES', () => {
    it('should have variant classes for all button variants', () => {
      const variants: ButtonVariant[] = ['primary', 'outline', 'emerald-primary', 'emerald-outline'];
      
      variants.forEach((variant) => {
        expect(VARIANT_CLASSES[variant]).toBeDefined();
        expect(typeof VARIANT_CLASSES[variant]).toBe('string');
      });
    });

    it('should have correct primary variant classes', () => {
      expect(VARIANT_CLASSES.primary).toBe('text-white border-transparent');
    });

    it('should have correct outline variant classes', () => {
      expect(VARIANT_CLASSES.outline).toBe('bg-transparent border-white');
    });

    it('should have correct emerald-primary variant classes', () => {
      expect(VARIANT_CLASSES['emerald-primary']).toBe('text-white border-transparent');
    });

    it('should have correct emerald-outline variant classes', () => {
      expect(VARIANT_CLASSES['emerald-outline']).toBe('bg-transparent');
    });
  });

  describe('VARIANT_CONFIGS', () => {
    it('should have variant configs for all button variants', () => {
      const variants: ButtonVariant[] = ['primary', 'outline', 'emerald-primary', 'emerald-outline'];
      
      variants.forEach((variant) => {
        expect(VARIANT_CONFIGS[variant]).toBeDefined();
        expect(VARIANT_CONFIGS[variant]).toHaveProperty('backgroundColor');
        expect(VARIANT_CONFIGS[variant]).toHaveProperty('color');
        expect(VARIANT_CONFIGS[variant]).toHaveProperty('borderColor');
      });
    });

    it('should have correct primary variant config', () => {
      const config = VARIANT_CONFIGS.primary;
      
      expect(config.backgroundColor).toBe('#1d4878');
      expect(config.color).toBe('#ffffff');
      expect(config.borderColor).toBe('transparent');
      expect(config.hoverBg).toBe('#003454');
    });

    it('should have correct outline variant config', () => {
      const config = VARIANT_CONFIGS.outline;
      
      expect(config.backgroundColor).toBe('transparent');
      expect(config.color).toBe('#ffffff');
      expect(config.borderColor).toBe('#ffffff');
      expect(config.hoverBg).toBe('#ffffff');
      expect(config.hoverText).toBe('#1d4878');
    });

    it('should have correct emerald-primary variant config', () => {
      const config = VARIANT_CONFIGS['emerald-primary'];
      
      expect(config.backgroundColor).toBe('#12626d');
      expect(config.color).toBe('#ffffff');
      expect(config.borderColor).toBe('transparent');
      expect(config.hoverBg).toBe('#5e9594');
    });

    it('should have correct emerald-outline variant config', () => {
      const config = VARIANT_CONFIGS['emerald-outline'];
      
      expect(config.backgroundColor).toBe('transparent');
      expect(config.color).toBe('#5e9594');
      expect(config.borderColor).toBe('#5e9594');
      expect(config.hoverBg).toBe('transparent');
      expect(config.hoverText).toBe('#1d4878');
    });
  });

  describe('HOVER_CLASSES', () => {
    it('should have hover classes for all button variants', () => {
      const variants: ButtonVariant[] = ['primary', 'outline', 'emerald-primary', 'emerald-outline'];
      
      variants.forEach((variant) => {
        expect(HOVER_CLASSES[variant]).toBeDefined();
        expect(typeof HOVER_CLASSES[variant]).toBe('string');
      });
    });

    it('should have correct primary hover classes', () => {
      expect(HOVER_CLASSES.primary).toBe('hover:bg-[var(--hover-bg)]');
    });

    it('should have correct outline hover classes', () => {
      expect(HOVER_CLASSES.outline).toBe('[&:hover]:!border-[var(--hover-border)]');
    });

    it('should have correct emerald-primary hover classes', () => {
      expect(HOVER_CLASSES['emerald-primary']).toBe('hover:!bg-[#5e9594]');
    });

    it('should have correct emerald-outline hover classes', () => {
      expect(HOVER_CLASSES['emerald-outline']).toBe('[&:hover]:!border-blue [&:hover]:!text-blue');
    });
  });
});


