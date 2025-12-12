/**
 * @fileoverview Decorative SVG Interfaces - Type definitions for DecorativeSVG component
 * @summary Defines interfaces for DecorativeSVG component
 * @description
 * Type definitions for the DecorativeSVG component including props configuration and position types.
 */

/**
 * @description Position options for the decorative SVG
 */
export type DecorativeSVGPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * @description Props for the DecorativeSVG component
 */
export interface DecorativeSVGProps {
  /** Source path to the SVG image */
  src: string;
  /** Alt text for the SVG image */
  alt: string;
  /** Position of the SVG (default: 'top-right') */
  position?: DecorativeSVGPosition;
  /** Width classes (default: 'w-[600px] h-[600px] md:w-[800px] md:h-[800px]') */
  size?: string;
  /** Opacity value (default: 60) */
  opacity?: number;
  /** Top offset classes (default: 'top-[-50px] md:top-[-100px]') */
  topOffset?: string;
  /** Additional CSS classes */
  className?: string;
}

