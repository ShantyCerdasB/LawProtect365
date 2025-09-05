/**
 * @file AppServiceInputs.ts
 * @summary Input and output types for global party application services
 * @description Defines the input and output contracts for global party application services
 */

import type { TenantId, PartyId } from "../../../domain/value-objects/Ids";
import type { GlobalPartyCommon, GlobalPartyPatch, GlobalPartyExtended } from "./GlobalPartiesTypes";

/**
 * @summary Input for getting global party app service
 */
export interface GetGlobalPartyAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Party identifier */
  readonly partyId: PartyId;
}

/**
 * @summary Output for getting global party app service
 */
export interface GetGlobalPartyAppResult {
  /** Global party data */
  readonly party: GlobalPartyRow | null;
}

/**
 * @summary Input for creating global party app service
 */
export interface CreateGlobalPartyAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Party name */
  readonly name: string;
  /** Party email */
  readonly email: string;
  /** Additional email addresses */
  readonly emails?: string[];
  /** Party phone number */
  readonly phone?: string;
  /** Party locale preference */
  readonly locale?: string;
  /** Party role */
  readonly role: GlobalPartyRow['role'];
  /** Party source */
  readonly source: GlobalPartyRow['source'];
  /** Party status */
  readonly status: GlobalPartyRow['status'];
  /** Party tags */
  readonly tags?: string[];
  /** Party metadata */
  readonly metadata?: Record<string, unknown>;
  /** Party attributes */
  readonly attributes?: Record<string, unknown>;
  /** Party preferences */
  readonly preferences: GlobalPartyRow['preferences'];
  /** Party notification preferences */
  readonly notificationPreferences: GlobalPartyRow['notificationPreferences'];
  /** Party statistics */
  readonly stats: GlobalPartyRow['stats'];
}

/**
 * @summary Output for creating global party app service
 */
export interface CreateGlobalPartyAppResult {
  /** Created global party data */
  readonly party: GlobalPartyRow;
}

/**
 * @summary Input for updating global party app service
 */
export interface UpdateGlobalPartyAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Updates to apply */
  readonly updates: GlobalPartyPatch;
}

/**
 * @summary Output for updating global party app service
 */
export interface UpdateGlobalPartyAppResult {
  /** Updated global party data */
  readonly party: GlobalPartyRow;
}

/**
 * @summary Input for deleting global party app service
 */
export interface DeleteGlobalPartyAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Party identifier */
  readonly partyId: PartyId;
}

/**
 * @summary Output for deleting global party app service
 */
export interface DeleteGlobalPartyAppResult {
  /** Deleted global party data */
  readonly party: GlobalPartyRow;
}

/**
 * @summary Input for listing global parties app service
 */
export interface ListGlobalPartiesAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Search term for name or email */
  readonly search?: string;
  /** Filter by tags */
  readonly tags?: string[];
  /** Filter by role */
  readonly role?: GlobalPartyRow['role'];
  /** Filter by source */
  readonly source?: GlobalPartyRow['source'];
  /** Filter by status */
  readonly status?: GlobalPartyRow['status'];
  /** Maximum number of results */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
}

/**
 * @summary Output for listing global parties app service
 */
export interface ListGlobalPartiesAppResult {
  /** List of global parties */
  readonly parties: GlobalPartyCommon[];
  /** Next page cursor */
  readonly nextCursor?: string;
  /** Total count */
  readonly total: number;
}

/**
 * @summary Input for searching global parties by email app service
 */
export interface SearchGlobalPartiesByEmailAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Email to search for */
  readonly email: string;
  /** Maximum number of results */
  readonly limit?: number;
}

/**
 * @summary Output for searching global parties by email app service
 */
export interface SearchGlobalPartiesByEmailAppResult {
  /** List of matching global parties */
  readonly parties: GlobalPartyCommon[];
}

/**
 * @summary Input for finding global party by email app service
 */
export interface FindGlobalPartyByEmailAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Email to search for */
  readonly email: string;
}

/**
 * @summary Output for finding global party by email app service
 */
export interface FindGlobalPartyByEmailAppResult {
  /** Found global party data */
  readonly party: GlobalPartyRow | null;
}
