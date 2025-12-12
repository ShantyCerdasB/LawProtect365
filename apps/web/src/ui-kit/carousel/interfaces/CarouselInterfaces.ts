/**
 * @fileoverview Carousel Interfaces - Type definitions for carousel components
 * @summary Defines interfaces for carousel functionality
 * @description
 * Type definitions for carousel components including slide data structure,
 * carousel configuration, and component props.
 */

import type { ReactNode } from 'react';

/**
 * @description Configuration for a single carousel slide
 */
export interface CarouselSlideData {
  /** Image source path for the slide */
  imageSrc: string;
  /** Alt text for the slide image */
  imageAlt: string;
  /** Title text displayed on the slide */
  title: string;
  /** Description text displayed on the slide */
  description: string;
  /** Optional buttons configuration */
  buttons?: CarouselButton[];
}

/**
 * @description Configuration for a carousel button
 */
export interface CarouselButton {
  /** Button text label */
  label: string;
  /** Button click handler */
  onClick?: () => void;
  /** Button variant style */
  variant?: 'primary' | 'secondary';
  /** Optional link URL */
  href?: string;
}

/**
 * @description Props for the main Carousel component
 */
export interface CarouselProps {
  /** Array of slide data to display */
  slides: CarouselSlideData[];
  /** Color class for active indicator (default: 'text-emerald') */
  activeIndicatorColor?: string;
  /** Color class for inactive indicators (default: 'text-emerald/40') */
  inactiveIndicatorColor?: string;
  /** Auto-play interval in milliseconds (0 to disable) */
  autoPlayInterval?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Props for the CarouselSlide component
 */
export interface CarouselSlideProps {
  /** Slide data to display */
  slide: CarouselSlideData;
  /** Whether this slide is currently active */
  isActive: boolean;
  /** Optional indicators component to render above title */
  indicators?: ReactNode | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Props for the CarouselIndicators component
 */
export interface CarouselIndicatorsProps {
  /** Total number of slides */
  totalSlides: number;
  /** Currently active slide index */
  activeIndex: number;
  /** Callback when indicator is clicked */
  onIndicatorClick: (index: number) => void;
  /** Color class for active indicator */
  activeColor: string;
  /** Color class for inactive indicators */
  inactiveColor: string;
}

