/**
 * @fileoverview Gray Column - Reusable background column component
 * @summary Displays a gray background column on the left side of the page
 * @description
 * Reusable component that renders a gray background column positioned
 * on the left side of the page. Commonly used across multiple pages for
 * consistent visual design.
 */

import type { ReactElement } from 'react';
import type { GrayColumnProps } from '../interfaces/GrayColumnInterfaces';

/**
 * @description Renders a gray background column on the left side.
 * @param {GrayColumnProps} props - Component configuration
 * @param {string} [props.width] - Width classes for the column
 * @param {string} [props.backgroundColor] - Background color class
 * @param {string} [props.className] - Additional CSS classes
 * @returns {ReactElement} Gray column component
 */
export function GrayColumn({
  width = 'w-1/5 md:w-[20%]',
  backgroundColor = 'bg-gray-100',
  className = '',
}: GrayColumnProps): ReactElement {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 ${width} ${backgroundColor} z-0 ${className}`.trim()}
    />
  );
}

