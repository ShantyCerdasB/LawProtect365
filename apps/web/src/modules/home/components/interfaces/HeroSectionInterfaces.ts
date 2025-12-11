/**
 * @fileoverview Hero Section Interfaces - Type definitions for HeroSection component
 * @summary Defines props interface for hero section component
 * @description
 * Contains TypeScript interfaces for the HeroSection component props.
 * Defines the structure for displaying page hero sections with titles and descriptions.
 */

/**
 * @description Props for the HeroSection component.
 * @property {string} title - Main heading text displayed prominently
 * @property {string} subtitle - Secondary heading text displayed below the title
 * @property {string} [description] - Optional additional descriptive text displayed below the subtitle
 */
export interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
}

