/**
 * @fileoverview Carousel Slide - Component for individual carousel slide
 * @summary Displays a single slide with image and text content
 * @description
 * Renders a carousel slide with an image on the left (with rounded corners)
 * and text content (title, description, buttons) on the right.
 */

import type { ReactElement } from 'react';
import type { CarouselSlideProps } from '../interfaces';
import { Button } from '../../buttons';

/**
 * @description Renders a single carousel slide.
 * @param {CarouselSlideProps} props - Slide configuration
 * @param {CarouselSlideData} props.slide - Slide data to display
 * @param {boolean} props.isActive - Whether this slide is currently active
 * @param {ReactNode} [props.indicators] - Optional indicators to render above title
 * @param {string} [props.className] - Additional CSS classes
 * @returns {ReactElement} Carousel slide component
 */
export function CarouselSlide({
  slide,
  isActive,
  indicators,
  className = '',
}: CarouselSlideProps): ReactElement {
  const { imageSrc, imageAlt, title, description, buttons = [] } = slide;

  return (
    <div
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${className} ${
        isActive ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
      } transition-opacity duration-500`}
    >
      {/* Image Section - A bit larger, positioned almost completely to the left */}
      <div className="w-full md:w-[65%] lg:w-[70%] shrink-0 ml-[1%] md:ml-[-6%] lg:ml-[-12%]">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-auto rounded-2xl md:rounded-3xl object-cover"
        />
      </div>

      {/* Text Content Section - Takes more width, larger text, centered lower */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center pt-8 md:pt-12 lg:pt-16">
        {/* Indicators above title */}
        {indicators && <div className="mb-4">{indicators}</div>}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue mb-4 md:mb-6 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-blue mb-6 md:mb-8 leading-relaxed">
          {description}
        </p>
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            {buttons.map((button, index) => {
              if (button.href) {
                return (
                  <a
                    key={index}
                    href={button.href}
                    className="inline-block"
                  >
                    <Button
                      variant={button.variant === 'secondary' ? 'emerald-outline' : 'emerald-primary'}
                      size="md"
                      className="px-8"
                    >
                      {button.label}
                    </Button>
                  </a>
                );
              }

              return (
                <Button
                  key={index}
                  variant={button.variant === 'secondary' ? 'emerald-outline' : 'emerald-primary'}
                  size="md"
                  onClick={button.onClick}
                  className="px-8"
                >
                  {button.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

