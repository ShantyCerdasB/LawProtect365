/**
 * @file ControllerInputs.ts
 * @summary Controller input types for certificate operations
 * @description Defines input types for certificate controllers, and actor are injected by factory
 */

import type { EnvelopeId } from "@/domain/value-objects/ids";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for certificate controllers
 * @description Common properties for all certificate controller inputs
 */
export interface BaseCertificateControllerInput {
  /** Tenant identifier */
}

// ============================================================================
// GET CERTIFICATE
// ============================================================================

/**
 * @summary Input for getting certificate (controller level)
 * @description Parameters for retrieving certificate and audit trail, is injected by factory
 */
export interface GetCertificateControllerInput extends BaseCertificateControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of events to return */
  readonly limit: number;
  /** Optional cursor for pagination */
  readonly cursor?: string;
}

