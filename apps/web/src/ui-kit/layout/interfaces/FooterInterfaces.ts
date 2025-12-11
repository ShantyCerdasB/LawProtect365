/**
 * @fileoverview Footer Interfaces - Type definitions for Footer components
 * @summary Defines props interfaces for footer-related components
 * @description
 * Contains TypeScript interfaces for Footer components and their props.
 * Defines the structure for footer sections, contact information, and working hours.
 */

import type React from 'react';

/**
 * @description Props for the Footer component.
 */
export interface FooterProps {
  className?: string;
}

/**
 * @description Contact office information structure.
 * @property {string} name - Office name (e.g., "Corporate Office", "Beverly Hills Office")
 * @property {string} address - Full address of the office
 * @property {string} phone - Phone number
 * @property {string} email - Email address
 */
export interface ContactOffice {
  name: string;
  address: string;
  phone: string;
  email: string;
}

/**
 * @description Props for the ContactInfo component.
 * @property {ContactOffice[]} offices - Array of office contact information
 */
export interface ContactInfoProps {
  offices: ContactOffice[];
}

/**
 * @description Props for the WorkingHours component.
 * @property {string} schedule - Working hours schedule text (e.g., "Mon-Fri: 9:00AM - 5:00PM")
 */
export interface WorkingHoursProps {
  schedule: string;
}

/**
 * @description Props for the FooterBottom component.
 * @property {string} copyright - Copyright text
 * @property {string} privacyPolicyPath - Path to privacy policy page
 * @property {string} termsPath - Path to terms and conditions page
 */
export interface FooterBottomProps {
  copyright: string;
  privacyPolicyPath: string;
  termsPath: string;
}

/**
 * @description Props for the FooterSection component.
 * @property {ReactNode} children - Content to display in the section
 * @property {string} [className] - Optional additional CSS classes
 */
export interface FooterSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * @description Props for the ContactSection component.
 * @property {ContactOffice} office - Office contact information
 */
export interface ContactSectionProps {
  office: ContactOffice;
}

/**
 * @description Props for the OfficeInfo component.
 * @property {ContactOffice} office - Office contact information
 */
export interface OfficeInfoProps {
  office: ContactOffice;
}

