/**
 * @fileoverview Email Icon - SVG icon component for email
 * @summary Displays an email icon
 * @description
 * SVG icon component representing an email envelope. Used to indicate email addresses
 * and contact information throughout the application.
 */

import type { ReactElement } from 'react';
import type { EmailIconProps } from '../interfaces/IconInterfaces';

/**
 * @description Renders an email icon SVG.
 * @param {EmailIconProps} props - Icon configuration
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Email icon SVG
 */
export function EmailIcon({ className = 'w-4 h-4' }: EmailIconProps): ReactElement {
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

