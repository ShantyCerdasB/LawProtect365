/**
 * @fileoverview Gray Separator - Reusable horizontal separator component
 * @summary Displays a gray horizontal separator bar between sections
 * @description
 * Reusable component that renders a gray horizontal separator bar.
 * Commonly used between sections across multiple pages for consistent visual design.
 */

import type { ReactElement } from 'react';
import type { GraySeparatorProps } from '../interfaces/GraySeparatorInterfaces';

/**
 * @description Renders a gray horizontal separator bar.
 * @param {GraySeparatorProps} props - Component configuration
 * @param {string} [props.height] - Height classes for the separator
 * @param {string} [props.backgroundColor] - Background color class
 * @param {string} [props.className] - Additional CSS classes
 * @returns {ReactElement} Gray separator component
 */
export function GraySeparator({
  height = 'h-16 md:h-24 lg:h-32',
  backgroundColor = 'bg-gray-100',
  className = '',
}: GraySeparatorProps): ReactElement {
  return (
    <div
      className={`w-full ${height} ${backgroundColor} ${className}`.trim()}
    />
  );
}

