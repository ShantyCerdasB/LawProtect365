/**
 * @fileoverview Login Layout - Split-screen layout for login page
 * @summary Layout component with image on left and form on right
 * @description
 * Provides a split-screen layout for the login page, displaying an image or custom content
 * on the left side (60% width) and the authentication form on the right side (40% width).
 * Responsive design stacks vertically on mobile devices.
 */

import type { ReactElement } from 'react';
import type { LoginLayoutProps } from './interfaces';

/**
 * @description Default left panel content with decorative SVG image.
 * @returns {ReactElement} SVG image component
 */
function DefaultLeftContent(): ReactElement {
  return (
    <div className="flex items-center justify-center h-full bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <img
        src="/LinesHome.svg"
        alt="LawProtect365"
        className="w-full h-full object-contain p-12 opacity-60"
      />
    </div>
  );
}

/**
 * @description Renders a split-screen layout for the login page.
 * @param {LoginLayoutProps} props - Layout configuration
 * @param {ReactNode} props.children - Content for the right panel (login form)
 * @param {ReactNode} [props.leftContent] - Optional custom content for left panel
 * @param {string} [props.className] - Optional additional CSS classes
 * @returns {ReactElement} Split-screen layout component
 */
export function LoginLayout({
  children,
  leftContent,
  className = '',
}: LoginLayoutProps): ReactElement {
  const leftPanel = leftContent || <DefaultLeftContent />;

  return (
    <div className={`min-h-screen flex ${className}`}>
      <div className="hidden lg:flex lg:w-3/5 items-center justify-center bg-slate-50 dark:bg-slate-900">
        {leftPanel}
      </div>
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}

