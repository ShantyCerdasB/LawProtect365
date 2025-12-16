import type { ReactElement } from 'react';
import type { ButtonProps } from './interfaces/ButtonInterfaces';
import {
  SIZE_CLASSES,
  VARIANT_CLASSES,
  VARIANT_CONFIGS,
  HOVER_CLASSES,
  DEFAULT_OUTLINE_HOVER_BORDER,
} from './constants/ButtonConstants';

export function Button({
  variant = 'primary',
  size = 'md',
  bgColor,
  textColor,
  borderColor,
  hoverBgColor,
  hoverTextColor,
  className = '',
  ...props
}: ButtonProps): ReactElement {
  const config = VARIANT_CONFIGS[variant];
  const sizeClass = SIZE_CLASSES[size];
  const variantClass = VARIANT_CLASSES[variant];
  const hoverClass = HOVER_CLASSES[variant];

  const styles: React.CSSProperties & Record<string, string> = {
    backgroundColor: bgColor || config.backgroundColor,
    color: textColor || config.color,
    '--border-color': borderColor || config.borderColor,
    borderColor: 'var(--border-color)',
  };

  if (variant === 'primary' || variant === 'emerald-primary') {
    styles['--hover-bg'] = hoverBgColor || config.hoverBg;
    if (hoverTextColor) {
      styles['--hover-text'] = hoverTextColor;
    }
  } else if (variant === 'outline') {
    styles['--hover-border'] = DEFAULT_OUTLINE_HOVER_BORDER;
    if (hoverTextColor) {
      styles['--hover-text'] = hoverTextColor;
    }
  } else if (variant === 'emerald-outline') {
    styles['--hover-border'] = '#1d4878';
    if (hoverTextColor) {
      styles['--hover-text'] = hoverTextColor;
    }
  }

  const baseClasses = 'rounded-full font-medium transition-colors border cursor-pointer';

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeClass} ${variantClass} ${hoverClass} ${className}`.trim()}
      style={styles as React.CSSProperties}
    />
  );
}
