/**
 * @fileoverview Icon Wrapper - Generic wrapper for icons with consistent styling
 * @summary Reusable component for wrapping SVG icons with background and rounded corners
 * @description
 * Provides a consistent container for icons with a rounded background.
 * Used throughout the application to maintain visual consistency.
 */

import type { ReactElement } from 'react';
import type { IconWrapperProps } from './interfaces/IconWrapperInterfaces';

/**
 * @description Wraps an icon with a rounded background container for consistent styling.
 * @param {IconWrapperProps} props - Icon wrapper configuration
 * @param {ReactNode} props.icon - The icon element to wrap (SVG, img, or React component)
 * @param {string} [props.className] - Optional additional CSS classes to apply
 * @param {number} [props.size] - Optional size of the wrapper in pixels (default: 106)
 * @returns {ReactElement} Icon wrapped in a styled container with fixed dimensions
 */
export function IconWrapper({
  icon,
  className = '',
  size = 106,
}: IconWrapperProps): ReactElement {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div className="relative w-full h-full">{icon}</div>
    </div>
  );
}

