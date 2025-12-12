/**
 * @fileoverview Carousel - Main carousel component with navigation and indicators
 * @summary Reusable carousel component for displaying slides with images and text
 * @description
 * A fully-featured carousel component that displays multiple slides with images
 * and text content. Supports automatic rotation, manual navigation, and indicator dots.
 * Designed to be reusable across different pages with customizable content and colors.
 */

import { useEffect, useState, type ReactElement } from 'react';
import type { CarouselProps } from '../interfaces';
import { CarouselSlide } from './CarouselSlide';
import { CarouselIndicators } from './CarouselIndicators';

/**
 * @description Renders a carousel with slides, indicators, and navigation.
 * @param {CarouselProps} props - Carousel configuration
 * @param {CarouselSlideData[]} props.slides - Array of slide data
 * @param {string} [props.activeIndicatorColor='text-emerald'] - Active indicator color
 * @param {string} [props.inactiveIndicatorColor='text-emerald/40'] - Inactive indicator color
 * @param {number} [props.autoPlayInterval=0] - Auto-play interval in ms (0 to disable)
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {ReactElement} Carousel component
 */
export function Carousel({
  slides,
  activeIndicatorColor = 'text-emerald',
  inactiveIndicatorColor = 'text-emerald/40',
  autoPlayInterval = 0,
  className = '',
}: CarouselProps): ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (autoPlayInterval > 0 && slides.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlayInterval, slides.length]);

  const handleIndicatorClick = (index: number): void => {
    setActiveIndex(index);
  };


  if (slides.length === 0) {
    return <div>No slides to display</div>;
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Slides Container */}
      <div className="relative w-full min-h-[400px] md:min-h-[600px]">
        {slides.map((slide, index) => (
          <CarouselSlide
            key={index}
            slide={slide}
            isActive={index === activeIndex}
            indicators={
              index === activeIndex ? (
                <CarouselIndicators
                  totalSlides={slides.length}
                  activeIndex={activeIndex}
                  onIndicatorClick={handleIndicatorClick}
                  activeColor={activeIndicatorColor}
                  inactiveColor={inactiveIndicatorColor}
                />
              ) : null
            }
          />
        ))}
      </div>

    </div>
  );
}

