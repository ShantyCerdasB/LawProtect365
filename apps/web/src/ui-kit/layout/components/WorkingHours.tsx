/**
 * @fileoverview Working Hours - Component for displaying business hours in footer
 * @summary Displays working hours information
 * @description
 * Footer component that displays the company's working hours.
 * Shows the schedule in a simple, readable format.
 */

import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { WorkingHoursProps } from '../interfaces/FooterInterfaces';
import { FooterSection } from './FooterSection';

/**
 * @description Renders the working hours section in the footer.
 * @param {WorkingHoursProps} props - Working hours configuration
 * @param {string} props.schedule - Working hours schedule text
 * @returns {ReactElement} Working hours section with title and schedule
 */
export function WorkingHours({ schedule }: WorkingHoursProps): ReactElement {
  const { t } = useTranslation('layout');

  return (
    <FooterSection className="pt-0 md:pt-28 lg:pt-36">
      <h3 className="text-white font-bold text-lg mb-4">{t('footer.workingHours.title')}</h3>
      <p className="text-white text-sm md:text-base">{schedule}</p>
    </FooterSection>
  );
}

