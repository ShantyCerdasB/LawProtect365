/**
 * @file DelegationTypes.ts
 * @summary Delegation-related domain and repository types
 * @description Defines all delegation-related types including domain entities, repository rows, and mapping functions
 */

import type { ISODateString } from "@lawprotect/shared-ts";
import type { ConsentId } from "../../../domain/value-objects/Ids";
import type { DelegationStatus } from "../../../domain/values/enums";

/**
 * @summary Base interface for envelope-scoped entities
 * @description Common interface for entities that belong to an envelope
 */
export interface EnvelopeScoped {
  /** Envelope identifier */
  readonly envelopeId: string;
}

/**
 * @summary Base interface for entities with timestamps
 * @description Common interface for entities with creation and update timestamps
 */
export interface WithTimestamps {
  /** Creation timestamp */
  readonly createdAt: ISODateString;
  /** Last update timestamp */
  readonly updatedAt: ISODateString;
}

/**
 * @summary Base interface for entities with metadata
 * @description Common interface for entities that can have additional metadata
 */
export interface WithMetadata {
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Consent delegation data
 * @description Information about consent delegation to another party
 */
export type ConsentDelegation = {
  /** The unique identifier of the delegation */
  readonly delegationId: string;
  /** The consent ID being delegated */
  readonly consentId: ConsentId;
  /** Email of the delegate */
  readonly delegateEmail: string;
  /** Name of the delegate */
  readonly delegateName: string;
  /** Reason for delegation (optional) */
  readonly reason?: string;
  /** ISO timestamp when the delegation expires (optional) */
  readonly expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  readonly metadata?: Record<string, unknown>;
  /** ISO timestamp when the delegation was created */
  readonly createdAt: string;
};

/**
 * @summary Delegation repository row type for database operations
 * @description Repository layer type for consent delegation records
 */
export type DelegationRepoRow =
  & EnvelopeScoped
  & WithTimestamps
  & WithMetadata
  & {
    /** Delegation identifier */
    readonly delegationId: string;
    /** Tenant identifier */
    readonly tenantId: string;
    /** Consent identifier */
    readonly consentId: string;
    /** Original party identifier */
    readonly originalPartyId: string;
    /** Delegate party identifier */
    readonly delegatePartyId: string;
    /** Delegation reason */
    readonly reason?: string;
    /** Delegation status */
    readonly status: DelegationStatus;
    /** Expiration timestamp */
    readonly expiresAt?: ISODateString;
  };

/**
 * @summary Input for creating a delegation in the repository
 * @description Parameters required to create a new delegation record
 */
export type DelegationRepoCreateInput = Omit<
  DelegationRepoRow,
  "updatedAt" | "createdAt"
> & {
  /** Creation timestamp */
  readonly createdAt?: ISODateString;
};

/**
 * @summary Maps a delegation repository row to domain result
 * @description Converts a repository row to the domain delegation result format
 *
 * @param {DelegationRepoRow} r - Repository row from database
 * @returns {ConsentDelegation} Domain delegation result record
 */
export const mapDelegationRowToResult = (r: DelegationRepoRow): ConsentDelegation => ({
  delegationId: r.delegationId,
  consentId: r.consentId as ConsentId,
  delegateEmail: "", // TODO: Get from party service
  delegateName: "", // TODO: Get from party service
  reason: r.reason,
  expiresAt: r.expiresAt,
  metadata: r.metadata,
  createdAt: r.createdAt,
});
