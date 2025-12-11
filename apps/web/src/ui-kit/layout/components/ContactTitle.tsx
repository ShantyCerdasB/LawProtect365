/**
 * @fileoverview Contact Title - Component for displaying "Contact Us" title in footer
 * @summary Displays the contact section title
 * @description
 * Footer component that displays the "Contact Us" title as a separate column.
 * Used to separate the contact section title from the office information.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { FooterSection } from './FooterSection';

/**
 * @description Renders the contact title section in the footer.
 * @returns {ReactElement} Contact title section
 */
export function ContactTitle(): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <FooterSection>
      <h3 className="text-white font-bold text-lg mb-4">{t('footer.contact.title')}</h3>
    </FooterSection>
  );
}

