/**
 * @fileoverview Home Page - Main landing page with carousel
 * @summary Displays carousel with company mission and services
 * @description
 * Main landing page that displays a carousel showcasing company values,
 * mission, and services. Includes decorative SVG elements and call-to-action buttons.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { Carousel } from '../../../ui-kit/carousel';
import { GrayColumn } from '../../../ui-kit/layout/components/GrayColumn';
import { DecorativeSVG } from '../../../ui-kit/layout/components/DecorativeSVG';
import { Sign365PromoSection } from '../../../ui-kit/layout/components/Sign365PromoSection';
import { getCarouselSlides } from '../constants/getCarouselSlides';

/**
 * @description Renders the main home page with carousel.
 * @returns {ReactElement} Home page with carousel
 */
export function HomePage(): ReactElement {
  const { t } = useTranslation('layout');
  const slides = getCarouselSlides(t);

  return (
    <div className="relative w-full min-h-screen bg-white">
      <DecorativeSVG
        src="/LinesHome.svg"
        alt="Decorative lines"
        position="top-right"
        opacity={60}
      />
      <GrayColumn />
      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16">
        <Carousel
          slides={slides}
          activeIndicatorColor="text-emerald"
          inactiveIndicatorColor="text-emerald/40"
          autoPlayInterval={4000}
          className="mt-16 md:mt-20"
        />
      </div>
      {/* Sign365 Promo Section - Outside gray column container */}
      <div className="relative w-full">
        <Sign365PromoSection
          title={t('home.sign365Promo.title')}
          highlightText={t('home.sign365Promo.highlightText')}
          subtitle={t('home.sign365Promo.subtitle')}
          description={t('home.sign365Promo.description')}
          buttonLabel={t('home.sign365Promo.buttonLabel')}
          imageAlt={t('home.sign365Promo.title')}
        />
      </div>
    </div>
  );
}

