/**
 * @fileoverview Documents Module Routes - Document signing and management routes
 * @summary Defines routes for document operations
 * @description
 * Routes for document signing workflow, including PDF upload and signature placement.
 */

import { useParams } from 'react-router-dom';
import type { ReactElement } from 'react';
import { SignDocumentPage } from './pages/SignDocumentPage';

/**
 * @description Returns the route configuration for the documents module.
 * @returns Array of React Router route objects
 */
export function documentsRoutes() {
  return [
    {
      path: '/documents',
      element: <SignDocumentPage envelopeId="demo" signerId="demo" />
    },
    {
      path: '/documents/sign/:envelopeId/:signerId',
      element: <SignDocumentPageWithParams />
    },
    {
      path: '/documents/sign/:envelopeId/:signerId/:invitationToken',
      element: <SignDocumentPageWithParams />
    }
  ];
}

/**
 * @description Wrapper component that extracts route parameters for SignDocumentPage
 * @returns JSX element with SignDocumentPage using route params
 */
function SignDocumentPageWithParams(): ReactElement {
  const { envelopeId, signerId, invitationToken } = useParams<{
    envelopeId: string;
    signerId: string;
    invitationToken?: string;
  }>();

  if (!envelopeId || !signerId) {
    return (
      <div className="p-4 text-red-600">
        Missing required parameters: envelopeId and signerId are required
      </div>
    );
  }

  return <SignDocumentPage envelopeId={envelopeId} signerId={signerId} invitationToken={invitationToken} />;
}

