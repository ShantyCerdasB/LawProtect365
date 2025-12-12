/**
 * @fileoverview Image Text Section Interfaces - Type definitions for ImageTextSection component
 * @summary Defines props interface for image-text section component
 * @description
 * Contains TypeScript interfaces for the ImageTextSection component props.
 * Defines the structure for displaying image and text side by side.
 */

import type { ReactNode } from 'react';

/**
 * @description Props for the ImageTextSection component.
 * @property {string} imageSrc - Path to the image file
 * @property {string} imageAlt - Alt text for accessibility
 * @property {ReactNode} children - Text content to display on the right side
 * @property {string} [className] - Optional additional CSS classes
 */
export interface ImageTextSectionProps {
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
  className?: string;
}


