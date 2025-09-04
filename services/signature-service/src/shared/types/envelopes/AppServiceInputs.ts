/**
 * @file AppServiceInputs.ts
 * @summary App service input and result types for envelopes
 * @description Defines the input and result types used by envelope app services
 */

import type { TenantId, EnvelopeId, UserId } from "../../../domain/value-objects/Ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/EnvelopeStatus";

/**
 * @summary Input for creating an envelope app service
 */
export interface CreateEnvelopeAppInput {
  readonly tenantId: TenantId;
  readonly ownerId: UserId;
  readonly title: string;
  readonly description?: string;
}

/**
 * @summary Result of creating an envelope app service
 */
export interface CreateEnvelopeAppResult {
  readonly envelopeId: EnvelopeId;
  readonly createdAt: string;
}

/**
 * @summary Input for getting an envelope app service
 */
export interface GetEnvelopeAppInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Result of getting an envelope app service
 */
export interface GetEnvelopeAppResult {
  readonly id: EnvelopeId;
  readonly title: string;
  readonly status: EnvelopeStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly ownerId: UserId;
  readonly parties: string[];
  readonly documents: string[];
}

/**
 * @summary Input for listing envelopes app service
 */
export interface ListEnvelopesAppInput {
  readonly tenantId: TenantId;
  readonly limit: number;
  readonly cursor?: string;
}

/**
 * @summary Result of listing envelopes app service
 */
export interface ListEnvelopesAppResult {
  readonly items: Array<{
    readonly id: EnvelopeId;
    readonly title: string;
    readonly status: EnvelopeStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly ownerId: UserId;
    readonly partiesCount: number;
    readonly documentsCount: number;
  }>;
  readonly nextCursor?: string;
}

/**
 * @summary Input for updating an envelope app service
 */
export interface UpdateEnvelopeAppInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
  readonly title?: string;
  readonly status?: EnvelopeStatus;
}

/**
 * @summary Result of updating an envelope app service
 */
export interface UpdateEnvelopeAppResult {
  readonly id: EnvelopeId;
  readonly title: string;
  readonly status: EnvelopeStatus;
  readonly updatedAt: string;
}

/**
 * @summary Input for deleting an envelope app service
 */
export interface DeleteEnvelopeAppInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Result of deleting an envelope app service
 */
export interface DeleteEnvelopeAppResult {
  readonly deleted: boolean;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Input for getting envelope status app service
 */
export interface GetEnvelopeStatusAppInput {
  readonly tenantId: TenantId;
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Result of getting envelope status app service
 */
export interface GetEnvelopeStatusAppResult {
  readonly id: EnvelopeId;
  readonly status: EnvelopeStatus;
  readonly updatedAt: string;
}
