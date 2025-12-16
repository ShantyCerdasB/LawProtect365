/**
 * @fileoverview Create Envelope Page - Page for creating new signature envelopes
 * @summary Page component that renders the envelope creation wizard
 * @description
 * This page component renders the CreateEnvelopeWizard component,
 * providing a complete interface for creating new signature envelopes.
 */

import { type ReactElement } from 'react';
import { CreateEnvelopeWizard } from '../components/CreateEnvelopeWizard';

/**
 * @description Page component for creating new envelopes.
 * @returns JSX element with the envelope creation wizard
 */
export function CreateEnvelopePage(): ReactElement {
  return <CreateEnvelopeWizard />;
}

