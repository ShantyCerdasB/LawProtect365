/**
 * @file ControllerInputs.ts
 * @summary Controller input types for certificate operations
 * @description Defines input types for certificate controllers, tenantId and actor are injected by factory
 */

import type { EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for certificate controllers
 * @description Common properties for all certificate controller inputs
 */
export interface BaseCertificateControllerInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
}

// ============================================================================
// GET CERTIFICATE
// ============================================================================

/**
 * @summary Input for getting certificate (controller level)
 * @description Parameters for retrieving certificate and audit trail, tenantId and actor are injected by factory
 */
export interface GetCertificateControllerInput extends BaseCertificateControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of events to return */
  readonly limit: number;
  /** Optional cursor for pagination */
  readonly cursor?: string;
  /** Actor context for audit logging */
  readonly actor?: ActorContext;
}
