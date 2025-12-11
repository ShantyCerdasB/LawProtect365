import type { ButtonHTMLAttributes } from 'react';
import type { ButtonVariant, ButtonSize } from '../types/ButtonTypes';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
}

export interface VariantConfig {
  backgroundColor: string;
  color: string;
  borderColor: string;
  hoverBg: string;
  hoverText?: string;
}

