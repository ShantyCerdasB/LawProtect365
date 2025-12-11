/**
 * @fileoverview Footer - Main footer component for the application
 * @summary Displays company information, working hours, contact details, and legal links
 * @description
 * Main footer component that displays company logo, mission statement, working hours,
 * contact information for multiple offices, and legal links. Uses a dark teal background
 * with white text and is fully responsive.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { FooterProps } from '../interfaces/FooterInterfaces';
import { FooterLogo } from './FooterLogo';
import { WorkingHours } from './WorkingHours';
import { ContactSection } from './ContactSection';
import { OfficeInfo } from './OfficeInfo';
import { FooterBottom } from './FooterBottom';

/**
 * @description Renders the main footer component with all sections.
 * @param {FooterProps} props - Footer configuration
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Complete footer with logo, hours, contact info, and bottom bar
 */
export function Footer({ className = '' }: FooterProps): ReactElement {
  const { t } = useTranslation('layout');

  const offices = [
    {
      name: t('footer.contact.corporateOffice.name'),
      address: t('footer.contact.corporateOffice.address'),
      phone: t('footer.contact.corporateOffice.phone'),
      email: t('footer.contact.corporateOffice.email'),
    },
    {
      name: t('footer.contact.beverlyHillsOffice.name'),
      address: t('footer.contact.beverlyHillsOffice.address'),
      phone: t('footer.contact.beverlyHillsOffice.phone'),
      email: t('footer.contact.beverlyHillsOffice.email'),
    },
  ];

  return (
    <footer className={`bg-emerald-dark text-white py-12 md:py-16 ${className}`}>
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
          <FooterLogo />
          <div className="max-w-7xl mx-auto">
            <WorkingHours schedule={t('footer.workingHours.schedule')} />
          </div>
          <div className="max-w-7xl mx-auto">
            <ContactSection office={offices[0]} />
          </div>
          <div className="max-w-7xl mx-auto">
            <OfficeInfo office={offices[1]} />
          </div>
        </div>
      </div>
      <FooterBottom
        copyright={t('footer.bottom.copyright')}
        privacyPolicyPath="/privacy-policy"
        termsPath="/terms-and-conditions"
      />
    </footer>
  );
}

