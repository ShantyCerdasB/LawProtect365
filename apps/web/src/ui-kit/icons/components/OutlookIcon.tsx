/**
 * @fileoverview Outlook Icon - SVG icon component for Microsoft Outlook OAuth
 * @summary Displays Microsoft Outlook logo icon
 * @description
 * SVG icon component representing the Microsoft Outlook logo. Used in OAuth authentication
 * buttons to indicate Microsoft/Outlook sign-in option.
 */

import type { ReactElement } from 'react';
import type { OutlookIconProps } from '../interfaces/IconInterfaces';

/**
 * @description Renders a Microsoft Outlook logo icon SVG.
 * @param {OutlookIconProps} props - Icon configuration
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Outlook icon SVG
 */
export function OutlookIcon({ className = 'w-5 h-5' }: OutlookIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 11.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm13-7H15V3c0-.6-.4-1-1-1s-1 .4-1 1v1.5c0 .8.7 1.5 1.5 1.5H20.5c.8 0 1.5-.7 1.5-1.5V4.5c0-.6-.4-1-1-1z"
        fill="#0078D4"
      />
      <path
        d="M20.5 12h-13c-.8 0-1.5.7-1.5 1.5v7c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-7c0-.8-.7-1.5-1.5-1.5zm-6.5 8H8v-6h6v6zm6-6v6h-4v-6h4z"
        fill="#0078D4"
      />
      <path
        d="M3.5 6.5c-.8 0-1.5.7-1.5 1.5v8c0 .8.7 1.5 1.5 1.5H7V6.5H3.5z"
        fill="#0078D4"
      />
    </svg>
  );
}

