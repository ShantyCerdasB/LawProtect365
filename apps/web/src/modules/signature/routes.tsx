/**
 * @fileoverview Signature Module Routes - Routes for signature operations
 * @summary Defines routes for signature envelope management
 * @description
 * Routes for signature envelope operations including creation, listing, and management.
 */

import type { ReactElement } from 'react';
import { CreateEnvelopePage } from './pages/CreateEnvelopePage';
import { EnvelopesListPage } from './pages/EnvelopesListPage';
import { EnvelopeDetailsPage } from './pages/EnvelopeDetailsPage';

/**
 * @description Returns the route configuration for the signature module.
 * @returns Array of React Router route objects
 */
export function signatureRoutes() {
  return [
    {
      path: '/signature/envelopes',
      element: <EnvelopesListPage />
    },
    {
      path: '/signature/envelopes/create',
      element: <CreateEnvelopePage />
    },
    {
      path: '/signature/envelopes/:id',
      element: <EnvelopeDetailsPage />
    },
  ];
}

