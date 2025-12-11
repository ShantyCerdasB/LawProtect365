/**
 * @fileoverview Hero Section - Component for page hero sections
 * @summary Displays main title, subtitle, and optional description
 * @description
 * Reusable hero section component for landing pages and feature pages.
 * Displays a prominent title with supporting subtitle and description text.
 */

import type { ReactElement } from 'react';
import type { HeroSectionProps } from './interfaces/HeroSectionInterfaces';

/**
 * @description Renders a hero section with title, subtitle, and optional description.
 * @param {HeroSectionProps} props - Hero section configuration
 * @param {string} props.title - Main heading text displayed prominently
 * @param {string} props.subtitle - Secondary heading text displayed below the title
 * @param {string} [props.description] - Optional additional descriptive text displayed below the subtitle
 * @returns {ReactElement} Hero section JSX with centered text layout
 */
export function HeroSection({
  title,
  subtitle,
  description,
}: HeroSectionProps): ReactElement {
  return (
    <div className="text-center mb-12">
      <h1 className="text-5xl md:text-6xl font-bold text-emerald-dark mb-4">
        {title}
      </h1>
      <p className="text-lg md:text-xl text-gray mb-2">{subtitle}</p>
      {description && (
        <p className="text-base md:text-lg text-gray">{description}</p>
      )}
    </div>
  );
}

