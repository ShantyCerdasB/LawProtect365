/**
 * @fileoverview Page Layout - Basic screen layout wrapper for the web app
 * @summary Provides padding, typography and page title styling
 * @description
 * This layout component is used across modules to keep consistent spacing
 * and heading styles for top-level screens.
 */

import type { PropsWithChildren, ReactNode, ReactElement } from 'react';

type Props = PropsWithChildren<{ title?: ReactNode }>;

/**
 * @description Wraps a page with standard padding and optional title header.
 * @param props.title Optional page title node
 * @param props.children Page content
 * @returns JSX element containing the page layout
 */
export function PageLayout({ title, children }: Props): ReactElement {
  return (
    <main className="p-6 space-y-4">
      {title && <header className="text-2xl font-semibold">{title}</header>}
      {children}
    </main>
  );
}

