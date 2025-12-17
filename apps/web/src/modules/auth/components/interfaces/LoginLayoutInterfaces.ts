/**
 * @fileoverview Login Layout Interfaces - Type definitions for login layout component
 * @summary Defines props interfaces for split-screen login layout
 * @description
 * Contains TypeScript interfaces for the login page layout component that displays
 * an image on the left and authentication form on the right.
 */

import type { ReactNode } from 'react';

/**
 * @description Props for the LoginLayout component.
 * @property {ReactNode} children - Content to display in the right panel (login form)
 * @property {ReactNode} [leftContent] - Optional custom content for the left panel (defaults to image)
 * @property {string} [className] - Optional additional CSS classes
 */
export interface LoginLayoutProps {
  children: ReactNode;
  leftContent?: ReactNode;
  className?: string;
}

