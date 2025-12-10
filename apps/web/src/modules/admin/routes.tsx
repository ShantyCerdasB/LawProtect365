/**
 * @fileoverview Admin Module Routes - Admin dashboard entrypoints
 * @summary Exposes the main dashboard route for admin users
 * @description
 * The admin module is the shell for administrative views such as user management,
 * usage reports and configuration screens.
 */

import type { ReactElement } from 'react';
import { PageLayout } from '../../ui-kit/layout/PageLayout';

/**
 * @description Minimal admin dashboard placeholder page.
 * @returns JSX element with a basic dashboard layout
 */
function AdminDashboardPage(): ReactElement {
  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Admin dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            High-level overview of your legal operations.
          </p>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Getting started
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Connect your auth provider, import users and configure signature templates.
          </p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next steps
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Soon you will see live metrics for envelopes, KYC checks and payments here.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}

/**
 * @description Returns the route configuration for the admin module.
 * @returns Array of React Router route objects for admin
 */
export function adminRoutes() {
  return [
    {
      path: '/admin',
      element: <AdminDashboardPage />
    }
  ];
}


