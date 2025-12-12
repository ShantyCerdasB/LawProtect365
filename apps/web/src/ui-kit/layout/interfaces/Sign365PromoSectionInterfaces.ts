/**
 * @fileoverview Sign365 Promo Section Interfaces - Type definitions for Sign365PromoSection component
 * @summary Defines interfaces for Sign365PromoSection component
 * @description
 * Type definitions for the Sign365PromoSection component including props configuration.
 */

/**
 * @description Props for the Sign365PromoSection component
 */
export interface Sign365PromoSectionProps {
  /** Source path to the background image (default: '/sign365.jpg') */
  imageSrc?: string;
  /** Alt text for the background image */
  imageAlt?: string;
  /** Title text displayed in emerald color (default: 'Sign 365') */
  title?: string;
  /** Highlight text displayed in blue, semibold, larger (default: 'Save time and money') */
  highlightText?: string;
  /** Subtitle text displayed in blue (default: 'with our digital signature for your legal documents') */
  subtitle?: string;
  /** Description text displayed in blue, smaller (default: description text) */
  description?: string;
  /** Button label (default: 'Learn more') */
  buttonLabel?: string;
  /** Button href link (default: '/sign-365') */
  buttonHref?: string;
  /** Additional CSS classes */
  className?: string;
}

