/**
 * @fileoverview Decorative SVG - Reusable decorative SVG component
 * @summary Displays a decorative SVG image with configurable positioning and styling
 * @description
 * Reusable component that renders a decorative SVG image with configurable
 * position, size, opacity, and other styling options. Commonly used for
 * background decorative elements across multiple pages.
 */

import type { ReactElement } from 'react';
import type { DecorativeSVGProps, DecorativeSVGPosition } from '../interfaces/DecorativeSVGInterfaces';

/**
 * @description Gets position classes based on position prop
 * @param {DecorativeSVGPosition} position - Position of the SVG
 * @returns {string} Position classes
 */
function getPositionClasses(position: DecorativeSVGPosition): string {
  const positionMap: Record<DecorativeSVGPosition, string> = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };
  return positionMap[position];
}

/**
 * @description Renders a decorative SVG image.
 * @param {DecorativeSVGProps} props - Component configuration
 * @param {string} props.src - Source path to the SVG image
 * @param {string} props.alt - Alt text for the SVG image
 * @param {DecorativeSVGPosition} [props.position] - Position of the SVG
 * @param {string} [props.size] - Width and height classes
 * @param {number} [props.opacity] - Opacity value (0-100)
 * @param {string} [props.topOffset] - Top offset classes
 * @param {string} [props.className] - Additional CSS classes
 * @returns {ReactElement} Decorative SVG component
 */
export function DecorativeSVG({
  src,
  alt,
  position = 'top-right',
  size = 'w-[600px] h-[600px] md:w-[800px] md:h-[800px]',
  opacity = 60,
  topOffset = 'top-[-50px] md:top-[-100px]',
  bottomOffset = 'bottom-[-50px] md:bottom-[-100px]',
  className = '',
}: DecorativeSVGProps): ReactElement {
  const positionClasses = getPositionClasses(position);
  const opacityValue = opacity / 100;
  
  // Use bottomOffset for bottom positions, topOffset for top positions
  const offsetClasses = position.startsWith('bottom')
    ? bottomOffset
    : topOffset;

  return (
    <div
      className={`absolute ${positionClasses} ${offsetClasses} ${size} pointer-events-none z-0 ${className}`.trim()}
      style={{ opacity: opacityValue }}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
}

