/**
 * @fileoverview Home Module Routes - Landing page and navigation entrypoints
 * @summary Defines the home module routes and main navigation menu
 * @description
 * The home module is the first screen users see. It provides a Tailwind-based
 * layout and links into the core business modules (auth, cases, documents, etc.).
 * It also demonstrates how to consume shared utilities from `frontend-core`.
 */

import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PageLayout } from '../../ui-kit/layout/PageLayout';
import { queryKeys } from '@lawprotect/frontend-core';

const MODULE_LINKS = [
  { path: '/auth/login', label: 'Authentication' },
  { path: '/admin', label: 'Admin dashboard' },
  { path: '/cases', label: 'Cases' },
  { path: '/documents', label: 'Documents' },
  { path: '/kyc', label: 'KYC' },
  { path: '/payments', label: 'Payments' },
  { path: '/notifications', label: 'Notifications' }
];

/**
 * @description Home page component that renders the main navigation menu.
 * @returns JSX element with the home layout and module shortcuts
 */
function HomePage(): ReactElement {
  const meKey = queryKeys.auth.me.join(' / ');

  return (
    <PageLayout
      title={
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              LawProtect365
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage signatures, cases, KYC and payments from a single place.
            </p>
          </div>
          <span className="hidden text-xs text-slate-400 sm:inline">
            React Query session key: <code className="font-mono">{meKey}</code>
          </span>
        </div>
      }
    >
      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_LINKS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="group rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {item.label}
              </span>
              <span className="text-xs text-sky-600 group-hover:text-sky-500 dark:text-sky-400">
                Open
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {item.label} module (WIP).
            </p>
          </Link>
        ))}
      </nav>
    </PageLayout>
  );
}

/**
 * @description Returns the route configuration for the home module.
 * @returns Array of React Router route objects
 */
export function homeRoutes() {
  return [
    {
      path: '/',
      element: <HomePage />
    }
  ];
}


