/**
 * @fileoverview Application Router - Central routing configuration for the web app
 * @summary Composes module routes using React Router
 * @description
 * This file defines the root React Router instance and wires together routes
 * exposed by feature modules (e.g. `home`, `auth`, `cases`).
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { withAuthGuard } from './guards';
import { homeRoutes } from '../../modules/home/routes';
import { authRoutes } from '../../modules/auth/routes';
import { adminRoutes } from '../../modules/admin/routes';
import { documentsRoutes } from '../../modules/documents/routes';

const router = createBrowserRouter([
  ...homeRoutes(),
  ...authRoutes(),
  ...adminRoutes(),
  ...documentsRoutes()
]);

import type { ReactElement } from 'react';

/**
 * @description Root router component that renders the current route tree.
 * @returns JSX element with the RouterProvider
 */
export function AppRouter(): ReactElement {
  return <RouterProvider router={router} />;
}

/**
 * @description Auth guard higher-order component, re-exported for convenience.
 */
export const AuthGuard = withAuthGuard;

