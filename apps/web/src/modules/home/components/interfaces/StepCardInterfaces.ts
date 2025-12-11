/**
 * @fileoverview Step Card Interfaces - Type definitions for StepCard component
 * @summary Defines props interface for step card component
 * @description
 * Contains TypeScript interfaces for the StepCard component props.
 * Defines the structure for displaying process steps with icons, titles, and descriptions.
 */

import type { ReactNode } from 'react';

/**
 * @description Props for the StepCard component.
 * @property {ReactNode} icon - The icon element to display at the top of the card
 * @property {string} title - Heading text displayed below the icon
 * @property {string} description - Descriptive text displayed below the title
 */
export interface StepCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

