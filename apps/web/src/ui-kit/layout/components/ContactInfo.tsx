/**
 * @fileoverview Contact Info - Component for displaying contact information in footer
 * @summary Displays office locations and contact details
 * @description
 * Footer component that displays contact information for multiple office locations.
 * Shows address, phone, and email for each office with icon indicators.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { ContactInfoProps } from '../interfaces/FooterInterfaces';
import { FooterSection } from './FooterSection';
import { LocationIcon, PhoneIcon, EmailIcon } from '../../icons';

/**
 * @description Renders the contact information section in the footer.
 * @param {ContactInfoProps} props - Contact information configuration
 * @param {ContactOffice[]} props.offices - Array of office contact information
 * @returns {ReactElement} Contact information section with office details
 */
export function ContactInfo({ offices }: ContactInfoProps): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <FooterSection>
      <h3 className="text-white font-bold text-lg mb-4">{t('footer.contact.title')}</h3>
      <div className="space-y-6 w-full">
        {offices.map((office, index) => (
          <div key={index} className="flex flex-col space-y-2">
            <div className="flex items-start gap-2">
              <LocationIcon className="w-4 h-4 shrink-0" />
              <span className="text-white text-sm md:text-base font-medium">
                {office.name}
              </span>
            </div>
            <p className="text-white text-sm md:text-base ml-6 whitespace-pre-line">{office.address}</p>
            <div className="flex items-center gap-2 ml-6">
              <PhoneIcon className="w-4 h-4 shrink-0" />
              <a
                href={`tel:${office.phone}`}
                className="text-white text-sm md:text-base hover:text-emerald transition-colors"
              >
                {office.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <EmailIcon className="w-4 h-4 shrink-0" />
              <a
                href={`mailto:${office.email}`}
                className="text-white text-sm md:text-base hover:text-emerald transition-colors"
              >
                {office.email}
              </a>
            </div>
          </div>
        ))}
      </div>
    </FooterSection>
  );
}

