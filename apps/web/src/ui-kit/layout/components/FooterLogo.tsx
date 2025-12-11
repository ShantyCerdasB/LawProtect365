/**
 * @fileoverview Footer Logo - Component for displaying logo and mission statement in footer
 * @summary Displays Law Protect 365 logo and company mission
 * @description
 * Footer logo component that displays the company logo image and mission statement.
 * Used in the footer's left column to provide brand identity and company description.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { FooterSection } from './FooterSection';

/**
 * @description Renders the footer logo section with company logo and mission statement.
 * @returns {ReactElement} Footer logo section with logo image and description
 */
export function FooterLogo(): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <FooterSection>
      <div className="mb-4">
        <img
          src="/lawProtectLogo.png"
          alt="Law Protect 365"
          className="h-24 md:h-32 lg:h-36 object-contain"
        />
      </div>
      <p className="text-white text-sm md:text-base leading-relaxed max-w-md text-center md:text-left">
        {t('footer.mission')}
      </p>
    </FooterSection>
  );
}

