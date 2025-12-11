/**
 * @fileoverview Step Card - Component for displaying process steps
 * @summary Card component showing an icon, title, and description
 * @description
 * Displays a step in a process flow with an icon at the top,
 * followed by a title and description text below.
 */

import type { ReactElement } from 'react';
import type { StepCardProps } from './interfaces/StepCardInterfaces';

/**
 * @description Renders a step card with icon, title, and description in a vertical layout.
 * @param {StepCardProps} props - Step card configuration
 * @param {ReactNode} props.icon - The icon element to display at the top of the card
 * @param {string} props.title - Heading text displayed below the icon
 * @param {string} props.description - Descriptive text displayed below the title
 * @returns {ReactElement} Step card JSX with centered content and vertical layout
 */
export function StepCard({ icon, title, description }: StepCardProps): ReactElement {
  return (
    <div className="flex flex-col items-center text-center max-w-sm">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-semibold text-blue mb-3">{title}</h3>
      <p className="text-base text-blue leading-relaxed">{description}</p>
    </div>
  );
}

