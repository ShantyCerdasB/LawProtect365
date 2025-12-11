/**
 * @fileoverview Footer Bottom - Component for footer bottom bar with copyright and links
 * @summary Displays copyright notice and legal links
 * @description
 * Footer bottom component that displays copyright information and legal links
 * (Privacy Policy, Terms & Conditions) in a horizontal bar at the bottom of the footer.
 */

import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { FooterBottomProps } from '../interfaces/FooterInterfaces';

/**
 * @description Renders the footer bottom bar with copyright and legal links.
 * @param {FooterBottomProps} props - Footer bottom configuration
 * @param {string} props.copyright - Copyright text
 * @param {string} props.privacyPolicyPath - Path to privacy policy page
 * @param {string} props.termsPath - Path to terms and conditions page
 * @returns {ReactElement} Footer bottom bar with copyright and links
 */
export function FooterBottom({
  copyright,
  privacyPolicyPath,
  termsPath,
}: FooterBottomProps): ReactElement {
  return (
    <div className="w-full pt-8 mt-12">
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="border-t border-white/20 mb-8"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
          <p className="text-white text-sm">{copyright}</p>
          <div className="flex gap-8 md:gap-12">
            <Link
              to={privacyPolicyPath}
              className="text-white text-sm hover:text-emerald transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to={termsPath}
              className="text-white text-sm hover:text-emerald transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

