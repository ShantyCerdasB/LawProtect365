/**
 * @fileoverview Contact Section - Component for displaying contact title with office information
 * @summary Displays "Contact Us" title with corporate office details
 * @description
 * Footer component that displays the "Contact Us" title followed by corporate office
 * contact information in a single column.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { ContactSectionProps } from '../interfaces/FooterInterfaces';
import { FooterSection } from './FooterSection';
import { LocationIcon, PhoneIcon, EmailIcon } from '../../icons';

/**
 * @description Renders the contact section with title and office information.
 * @param {ContactSectionProps} props - Contact section configuration
 * @param {ContactOffice} props.office - Office contact information
 * @returns {ReactElement} Contact section with title and office details
 */
export function ContactSection({ office }: ContactSectionProps): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <FooterSection className="pt-0 md:pt-28 lg:pt-36">
      <h3 className="text-white font-bold text-lg mb-4">{t('footer.contact.title')}</h3>
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-start gap-2">
          <LocationIcon className="w-4 h-4 shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">{office.name}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 shrink-0"></div>
          <p className="text-white text-sm md:text-base">{office.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon className="w-4 h-4 shrink-0" />
          <a
            href={`tel:${office.phone}`}
            className="text-white text-sm md:text-base hover:text-emerald transition-colors"
          >
            {office.phone}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <EmailIcon className="w-4 h-4 shrink-0" />
          <a
            href={`mailto:${office.email}`}
            className="text-white text-sm md:text-base hover:text-emerald transition-colors"
          >
            {office.email}
          </a>
        </div>
      </div>
    </FooterSection>
  );
}

