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
import { GraySeparator } from '../../../ui-kit/layout/components/GraySeparator';
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
    <>
      {/* First Section with GrayColumn */}
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

      {/* Gray Separator - Horizontal separator between sections (much wider) */}
      <GraySeparator height="h-16 md:h-24 lg:h-32" />

      {/* Testimonials Section - Without gray column, completely separate container */}
      <div className="relative w-full min-h-[400px] md:min-h-[600px] py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          {/* Testimonials Title */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue mb-2">
              {t('home.testimonials.title.line1')}
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-dark mb-4">
              {t('home.testimonials.title.line2')}
            </h3>
            <p className="text-lg md:text-xl lg:text-2xl text-blue">
              {t('home.testimonials.subtitle')}
            </p>
          </div>
          {/* Testimonials carousel will go here */}
        </div>
        {/* Decorative SVG - Bottom Left Corner, much larger like first slice, moved up */}
        <DecorativeSVG
          src="/LinesBottomHome.svg"
          alt="Decorative lines bottom"
          position="bottom-left"
          opacity={80}
          size="w-[800px] h-[800px] md:w-[1000px] md:h-[1000px] lg:w-[1200px] lg:h-[1200px]"
          bottomOffset="bottom-[-350px] md:bottom-[-437px] lg:bottom-[-525px] xl:bottom-[-700px]"
        />
      </div>
    </>
  );
}

