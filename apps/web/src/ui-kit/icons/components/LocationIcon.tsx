/**
 * @fileoverview Location Icon - SVG icon component for location pin
 * @summary Displays a location pin icon
 * @description
 * SVG icon component representing a location pin. Used to indicate addresses
 * and geographic locations throughout the application.
 */

import type { ReactElement } from 'react';
import type { LocationIconProps } from '../interfaces/IconInterfaces';

/**
 * @description Renders a location pin icon SVG.
 * @param {LocationIconProps} props - Icon configuration
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Location pin icon SVG
 */
export function LocationIcon({ className = 'w-4 h-4' }: LocationIconProps): ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

