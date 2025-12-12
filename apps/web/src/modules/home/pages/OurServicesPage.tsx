/**
 * @fileoverview Our Services Page - Services page with mission statement
 * @summary Displays the company mission with image and text layout
 * @description
 * Page that displays the company mission statement using an image-text layout.
 * Shows an image on the left and mission text on the right, covering the full width.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { ImageTextSection } from '../../../ui-kit/layout/components';

/**
 * @description Renders the Our Services page with mission statement.
 * @returns {ReactElement} Our Services page with image and mission text
 */
export function OurServicesPage(): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <ImageTextSection
      imageSrc="/OurServicesFirst.jpg"
      imageAlt="Law Protect 365 Services"
    >
      <div className="p-4 md:p-8 lg:p-10">
        <h2 className="text-lg md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 md:mb-8 text-emerald-dark">
          {t('ourServices.mission.title')}
        </h2>
        <div className="text-sm md:text-3xl lg:text-4xl xl:text-5xl leading-relaxed text-blue">
          <p>
            {t('ourServices.mission.line1')}{' '}
            <span className="font-bold">{t('ourServices.mission.highlight')}</span>
          </p>
          <p className="pl-4 md:pl-12 lg:pl-16">{t('ourServices.mission.line2')}</p>
          <p className="pl-6 md:pl-16 lg:pl-20 xl:pl-24">{t('ourServices.mission.line3')}</p>
        </div>
      </div>
    </ImageTextSection>
  );
}

