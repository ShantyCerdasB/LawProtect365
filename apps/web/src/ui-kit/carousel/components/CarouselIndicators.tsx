/**
 * @fileoverview Carousel Indicators - Component for carousel navigation indicators
 * @summary Displays clickable dots to navigate between carousel slides
 * @description
 * Renders a series of indicator dots that show the current slide position
 * and allow users to navigate directly to a specific slide.
 */

import type { ReactElement } from 'react';
import type { CarouselIndicatorsProps } from '../interfaces';

/**
 * @description Renders carousel navigation indicators.
 * @param {CarouselIndicatorsProps} props - Indicators configuration
 * @param {number} props.totalSlides - Total number of slides
 * @param {number} props.activeIndex - Currently active slide index
 * @param {(index: number) => void} props.onIndicatorClick - Click handler
 * @param {string} props.activeColor - Color class for active indicator
 * @param {string} props.inactiveColor - Color class for inactive indicators
 * @returns {ReactElement} Carousel indicators component
 */
export function CarouselIndicators({
  totalSlides,
  activeIndex,
  onIndicatorClick,
}: CarouselIndicatorsProps): ReactElement {
  return (
    <div className="flex gap-3 mb-4">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onIndicatorClick(index)}
          className={`w-3.5 h-3.5 rounded-full transition-colors ${
            index === activeIndex ? 'bg-emerald' : 'bg-emerald/40'
          }`}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === activeIndex ? 'true' : undefined}
        />
      ))}
    </div>
  );
}

