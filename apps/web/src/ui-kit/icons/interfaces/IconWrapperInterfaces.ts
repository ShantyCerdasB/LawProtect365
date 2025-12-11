/**
 * @fileoverview Icon Wrapper Interfaces - Type definitions for IconWrapper component
 * @summary Defines props interface for icon wrapper component
 * @description
 * Contains TypeScript interfaces for the IconWrapper component props.
 * Defines the structure for wrapping icons with consistent styling.
 */

import type { ReactNode } from 'react';

/**
 * @description Props for the IconWrapper component.
 * @property {ReactNode} icon - The icon element to wrap (SVG, img, or React component)
 * @property {string} [className] - Optional additional CSS classes to apply to the wrapper
 * @property {number} [size] - Optional size of the wrapper in pixels (default: 106)
 */
export interface IconWrapperProps {
  icon: ReactNode;
  className?: string;
  size?: number;
}

