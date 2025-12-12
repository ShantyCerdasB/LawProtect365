/**
 * @fileoverview Sign365 Promo Section - Promotional section for Sign 365 service
 * @summary Displays a full-width promotional section with background image and text content
 * @description
 * Reusable component that displays a promotional section for Sign 365 service.
 * Features a background image with text content positioned on the left side.
 * Text includes title in emerald, highlight text in blue (semibold, larger),
 * subtitle and description in blue, and a call-to-action button.
 */

import type { ReactElement } from 'react';
import type { Sign365PromoSectionProps } from '../interfaces/Sign365PromoSectionInterfaces';
import { Button } from '../../buttons';

/**
 * @description Renders a promotional section for Sign 365 service.
 * @param {Sign365PromoSectionProps} props - Component configuration
 * @param {string} [props.imageSrc] - Source path to the background image
 * @param {string} [props.imageAlt] - Alt text for the background image
 * @param {string} [props.title] - Title text displayed in emerald
 * @param {string} [props.highlightText] - Highlight text displayed in blue, semibold, larger
 * @param {string} [props.subtitle] - Subtitle text displayed in blue
 * @param {string} [props.description] - Description text displayed in blue, smaller
 * @param {string} [props.buttonLabel] - Button label
 * @param {string} [props.buttonHref] - Button href link
 * @param {string} [props.className] - Additional CSS classes
 * @returns {ReactElement} Sign365 promotional section component
 */
export function Sign365PromoSection({
  imageSrc = '/Sign365Home.jpg',
  imageAlt = 'Sign 365 promotional background',
  title = 'Sign 365',
  highlightText = 'Save time and money',
  subtitle = 'with our digital signature for your legal documents',
  description = 'Digital signatures allow lawyers and clients to securely, quickly, and legally sign legal documents directly from the application, without the need to print or scan files.',
  buttonLabel = 'Learn more',
  buttonHref = '/sign-365',
  className = '',
}: Sign365PromoSectionProps): ReactElement {
  return (
    <section
      className={`relative w-full min-h-[500px] md:min-h-[700px] lg:min-h-[800px] bg-cover bg-center bg-no-repeat ${className}`.trim()}
      style={{ backgroundImage: `url(${imageSrc})` }}
    >
      <img src={imageSrc} alt={imageAlt} className="sr-only" />
      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 h-full min-h-[500px] md:min-h-[700px] lg:min-h-[800px] flex items-center">
        <div className="max-w-2xl ml-0 md:ml-[-50px] lg:ml-[-80px] xl:ml-[-120px] 2xl:ml-[-150px]">
          {/* Title - Emerald-dark, bold, larger */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-emerald-dark mb-4 md:mb-6">
            {title}
          </h2>

          {/* Highlight Text - Dark blue (#003454), semibold, larger */}
          <h3 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold mb-2 md:mb-3" style={{ color: '#003454' }}>
            {highlightText}
          </h3>

          {/* Subtitle - Blue, normal weight, same size as highlight */}
          <h4 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-blue mb-4 md:mb-6">
            {subtitle.includes(' for your legal documents')
              ? (
                  <>
                    {subtitle.split(' for your legal documents')[0]}
                    <br />
                    {'for your legal documents'}
                  </>
                )
              : subtitle.includes(' para tus documentos legales')
                ? (
                    <>
                      {subtitle.split(' para tus documentos legales')[0]}
                      <br />
                      {'para tus documentos legales'}
                    </>
                  )
                : subtitle.includes(' per i tuoi documenti legali')
                  ? (
                      <>
                        {subtitle.split(' per i tuoi documenti legali')[0]}
                        <br />
                        {'per i tuoi documenti legali'}
                      </>
                    )
                  : subtitle.includes('法的文書のための')
                    ? (
                        <>
                          {subtitle.split('法的文書のための')[0]}
                          <br />
                          {'法的文書のための'}
                        </>
                      )
                    : subtitle}
          </h4>

          {/* Description - Blue, normal weight, larger */}
          <p className="text-lg md:text-xl lg:text-2xl text-blue mb-6 md:mb-8 leading-relaxed max-w-xl">
            {description}
          </p>

          {/* Button - Emerald primary variant */}
          <a href={buttonHref}>
            <Button variant="emerald-primary" size="md" className="px-8">
              {buttonLabel}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

