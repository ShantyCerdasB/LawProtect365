/**
 * @fileoverview Auth Module Routes - Login and authentication entrypoints
 * @summary Exposes login and callback routes for the auth module
 * @description
 * The auth module is responsible for login, logout and session management.
 * This file wires the login page and OAuth callback handler into the central router.
 */

import { LoginPage } from './pages/LoginPage';
import { CallbackPage } from './pages/CallbackPage';

/**
 * @description Returns the route configuration for the auth module.
 * @returns Array of React Router route objects for auth
 */
export function authRoutes() {
  return [
    {
      path: '/auth/login',
      element: <LoginPage />,
    },
    {
      path: '/callback',
      element: <CallbackPage />,
    },
  ];
}


