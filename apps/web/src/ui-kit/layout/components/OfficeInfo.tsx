/**
 * @fileoverview Office Info - Component for displaying a single office contact information
 * @summary Displays office location and contact details
 * @description
 * Footer component that displays contact information for a single office location.
 * Shows address, phone, and email with icon indicators.
 */

import type { ReactElement } from 'react';
import type { OfficeInfoProps } from '../interfaces/FooterInterfaces';
import { FooterSection } from './FooterSection';
import { LocationIcon, PhoneIcon, EmailIcon } from '../../icons';

/**
 * @description Renders a single office contact information section in the footer.
 * @param {OfficeInfoProps} props - Office information configuration
 * @param {ContactOffice} props.office - Office contact information
 * @returns {ReactElement} Office information section with address, phone, and email
 */
export function OfficeInfo({ office }: OfficeInfoProps): ReactElement {
  return (
    <FooterSection className="pt-0 md:pt-28 lg:pt-36">
      <div className="h-7 mb-4"></div>
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-start gap-2">
          <LocationIcon className="w-4 h-4 shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">{office.name}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 shrink-0"></div>
          <p className="text-white text-sm md:text-base whitespace-pre-line">{office.address}</p>
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

