/**
 * @fileoverview Get Carousel Slides - Helper function to generate carousel slides
 * @summary Returns carousel slide data for the home page
 * @description
 * Helper function that generates carousel slide data for the home page.
 * Accepts a translation function to provide internationalized content.
 */

import type { TFunction } from 'i18next';
import type { CarouselSlideData } from '../../../ui-kit/carousel';

/**
 * @description Generates carousel slides data for the home page.
 * @param {TFunction} t - Translation function from i18next
 * @returns {CarouselSlideData[]} Array of carousel slide data
 */
export function getCarouselSlides(t: TFunction): CarouselSlideData[] {
  return [
    {
      imageSrc: '/Carrusel1.jpg',
      imageAlt: 'Justice for all',
      title: t('home.carousel.slides.0.title'),
      description: t('home.carousel.slides.0.description'),
      buttons: [
        {
          label: t('home.carousel.buttons.learnMore'),
          variant: 'primary',
        },
        {
          label: t('home.carousel.buttons.startToday'),
          variant: 'secondary',
        },
      ],
    },
    {
      imageSrc: '/Carrusel2.jpg',
      imageAlt: 'Promote equal access nation wide',
      title: t('home.carousel.slides.1.title'),
      description: t('home.carousel.slides.1.description'),
      buttons: [
        {
          label: t('home.carousel.buttons.learnMore'),
          variant: 'primary',
        },
        {
          label: t('home.carousel.buttons.startToday'),
          variant: 'secondary',
        },
      ],
    },
    {
      imageSrc: '/Carrusel3.jpg',
      imageAlt: 'Enhance consumer and environment protection',
      title: t('home.carousel.slides.2.title'),
      description: t('home.carousel.slides.2.description'),
      buttons: [
        {
          label: t('home.carousel.buttons.learnMore'),
          variant: 'primary',
        },
        {
          label: t('home.carousel.buttons.startToday'),
          variant: 'secondary',
        },
      ],
    },
    {
      imageSrc: '/Carruse4.jpg',
      imageAlt: 'Strengthen public trust in justice',
      title: t('home.carousel.slides.3.title'),
      description: t('home.carousel.slides.3.description'),
      buttons: [
        {
          label: t('home.carousel.buttons.learnMore'),
          variant: 'primary',
        },
        {
          label: t('home.carousel.buttons.startToday'),
          variant: 'secondary',
        },
      ],
    },
  ];
}

