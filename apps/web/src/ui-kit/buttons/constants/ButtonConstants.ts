import type { ButtonVariant, ButtonSize } from '../types/ButtonTypes';
import type { VariantConfig } from '../interfaces/ButtonInterfaces';

export const DEFAULT_PRIMARY_BG = '#1d4878';
export const DEFAULT_PRIMARY_HOVER_BG = '#003454';
export const DEFAULT_OUTLINE_BG = 'transparent';
export const DEFAULT_OUTLINE_HOVER_BG = '#ffffff';
export const DEFAULT_OUTLINE_HOVER_TEXT = '#1d4878';
export const DEFAULT_TEXT_COLOR = '#ffffff';
export const DEFAULT_BORDER_COLOR_PRIMARY = 'transparent';
export const DEFAULT_BORDER_COLOR_OUTLINE = '#ffffff';
export const DEFAULT_OUTLINE_HOVER_BORDER = '#5e9594';

export const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-6 py-1 text-xs sm:text-sm',
  md: 'px-10 py-1.5 text-sm sm:text-base',
  lg: 'px-12 py-2 text-base sm:text-lg',
};

export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-white border-transparent',
  outline: 'bg-transparent border-white',
};

export const VARIANT_CONFIGS: Record<ButtonVariant, VariantConfig> = {
  primary: {
    backgroundColor: DEFAULT_PRIMARY_BG,
    color: DEFAULT_TEXT_COLOR,
    borderColor: DEFAULT_BORDER_COLOR_PRIMARY,
    hoverBg: DEFAULT_PRIMARY_HOVER_BG,
  },
  outline: {
    backgroundColor: DEFAULT_OUTLINE_BG,
    color: DEFAULT_TEXT_COLOR,
    borderColor: DEFAULT_BORDER_COLOR_OUTLINE,
    hoverBg: DEFAULT_OUTLINE_HOVER_BG,
    hoverText: DEFAULT_OUTLINE_HOVER_TEXT,
  },
};

export const HOVER_CLASSES: Record<ButtonVariant, string> = {
  primary: 'hover:bg-[var(--hover-bg)]',
  outline: '[&:hover]:!border-[var(--hover-border)]',
};

