/**
 * @fileoverview Image Text Section - Reusable component for full-width image with overlaid text
 * @summary Displays a full-width background image with text content overlaid on top
 * @description
 * Reusable component that displays a full-width, full-height background image with
 * text content overlaid on top. The image covers the entire viewport and the text
 * is positioned over it. Used for mission statements, feature descriptions, and promotional content.
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import type { ImageTextSectionProps } from '../interfaces/ImageTextSectionInterfaces';

/**
 * @description Renders a full-width image section with text content overlaid on top.
 * @param {ImageTextSectionProps} props - Image text section configuration
 * @param {string} props.imageSrc - Path to the image file
 * @param {string} props.imageAlt - Alt text for the image
 * @param {ReactNode} props.children - Text content to display overlaid on the image
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Full-width image section with overlaid text content
 */
export function ImageTextSection({
  imageSrc,
  imageAlt,
  children,
  className = '',
}: ImageTextSectionProps): ReactElement {
  const [backgroundPosition, setBackgroundPosition] = useState('110% center');

  useEffect(() => {
    const updateBackgroundPosition = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setBackgroundPosition('110% center');
      } else if (width >= 768) {
        setBackgroundPosition('100% center');
      } else {
        setBackgroundPosition('center center');
      }
    };

    updateBackgroundPosition();
    window.addEventListener('resize', updateBackgroundPosition);
    return () => window.removeEventListener('resize', updateBackgroundPosition);
  }, []);

  return (
    <section 
      className={`w-full relative h-64 md:h-300 lg:h-300 bg-cover bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${imageSrc})`, backgroundPosition }}
    >
      <img src={imageSrc} alt={imageAlt} className="sr-only" />
      <div className="relative z-10 w-full h-full pr-2 md:pr-12 lg:pr-20 xl:pr-32">
        <div className="absolute right-0" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <div className="max-w-full md:max-w-2xl">{children}</div>
        </div>
      </div>
    </section>
  );
}

