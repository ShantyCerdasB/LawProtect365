/**
 * @file ControllerInputs.ts
 * @summary Controller input types for envelopes
 * @description Defines the input types used by envelope controllers
 */

import type { TenantId, EnvelopeId, UserId } from "../../../domain/value-objects/Ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/EnvelopeStatus";

/**
 * @summary Input for creating an envelope
 */
export interface CreateEnvelopeControllerInput {
  readonly tenantId: TenantId;
  readonly ownerId: UserId;
  readonly title: string;
  readonly description?: string;
}

/**
 * @summary Input for getting an envelope by ID
 */
export interface GetEnvelopeControllerInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Input for listing envelopes
 */
export interface ListEnvelopesControllerInput {
  readonly tenantId: TenantId;
  readonly limit: number;
  readonly cursor?: string;
}

/**
 * @summary Input for updating an envelope
 */
export interface UpdateEnvelopeControllerInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
  readonly title?: string;
  readonly status?: EnvelopeStatus;
}

/**
 * @summary Input for deleting an envelope
 */
export interface DeleteEnvelopeControllerInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Input for getting envelope status
 */
export interface GetEnvelopeStatusControllerInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}
