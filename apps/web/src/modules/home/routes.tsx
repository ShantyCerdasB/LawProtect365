/**
 * @fileoverview Home Module Routes - Landing page and navigation entrypoints
 * @summary Defines the home module routes and main navigation menu
 * @description
 * The home module is the first screen users see. It provides a Tailwind-based
 * layout and links into the core business modules (auth, cases, documents, etc.).
 * It also demonstrates how to consume shared utilities from `frontend-core`.
 */

import { Sign365Page } from './pages/Sign365Page';
import { OurServicesPage } from './pages/OurServicesPage';
import { HomePage } from './pages/HomePage';

/**
 * @description Returns the route configuration for the home module.
 * @returns Array of React Router route objects
 */
export function homeRoutes() {
  return [
    {
      path: '/',
      element: <HomePage />
    },
    {
      path: '/sign-365',
      element: <Sign365Page />
    },
    {
      path: '/our-services',
      element: <OurServicesPage />
    }
  ];
}


