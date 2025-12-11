/**
 * @fileoverview Footer Section - Reusable component for footer column sections
 * @summary Wrapper component for footer column content with consistent styling
 * @description
 * Reusable footer section component that provides consistent layout and alignment
 * for footer columns. Centers content on mobile and aligns left on desktop.
 */

import type { ReactElement } from 'react';
import type { FooterSectionProps } from '../interfaces/FooterInterfaces';

/**
 * @description Renders a footer section with consistent styling and responsive alignment.
 * @param {FooterSectionProps} props - Footer section configuration
 * @param {ReactNode} props.children - Content to display in the section
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Footer section with centered mobile and left-aligned desktop layout
 */
export function FooterSection({ children, className = '' }: FooterSectionProps): ReactElement {
  return (
    <div className={`flex flex-col items-center md:items-start ${className}`}>{children}</div>
  );
}

