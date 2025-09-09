/**
 * @file base.ts
 * @summary Base common types
 * @description Shared base types used across all layers of the application
 */

import { ISODateString } from "@lawprotect/shared-ts";
import type { EnvelopeId, ConsentId } from "@/domain/value-objects";

/**
 * @summary Entity with timestamp fields
 * @description Base type for entities that track creation and update times
 */
export type WithTimestamps = {
  /** ISO timestamp when the entity was created */
  readonly createdAt: ISODateString;
  /** ISO timestamp when the entity was last updated (optional) */
  readonly updatedAt?: ISODateString;
};

/**
 * @summary Entity with optional metadata
 * @description Base type for entities that can store additional metadata
 */
export type WithMetadata = {
  /** Optional metadata object for storing additional information */
  readonly metadata?: Record<string, unknown>;
};

/**
 * @summary Entity scoped to an envelope
 * @description Base type for entities that belong to a specific envelope
 */
export type EnvelopeScoped = {
  /** Envelope identifier */
  readonly envelopeId: string;
};

/**
 * @summary Entity scoped to a tenant
 * @description Base type for entities that belong to a specific tenant
 */
export type TenantScoped = {
  /** Tenant identifier */
  readonly tenantId: string;
};

/**
 * @summary Composite key for consent entities
 * @description Key structure for consent-related entities
 */
export type ConsentKey = {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
};

/**
 * @summary Composite key for delegation entities
 * @description Key structure for delegation-related entities
 */
export type DelegationKey = {
  /** Envelope identifier */
  readonly envelopeId: string;
  /** Delegation identifier */
  readonly delegationId: string;
};


