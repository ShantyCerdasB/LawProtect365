/**
 * @file ControllerInputs.ts
 * @summary Input types for global party controllers
 * @description Defines input types for controllers that don't include tenantId (added by factory)
 */

import type { PartyId } from "../../../domain/value-objects/Ids";
import type { GlobalPartyPatch } from "./GlobalPartiesTypes";

/**
 * @summary Input for creating global party controller
 */
export interface CreateGlobalPartyControllerInput {
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
  readonly role: GlobalPartyPatch['role'];
  /** Party source */
  readonly source: GlobalPartyPatch['source'];
  /** Party status */
  readonly status: GlobalPartyPatch['status'];
  /** Party tags */
  readonly tags?: string[];
  /** Party metadata */
  readonly metadata?: Record<string, unknown>;
  /** Party attributes */
  readonly attributes?: Record<string, unknown>;
  /** Party preferences */
  readonly preferences: GlobalPartyPatch['preferences'];
  /** Party notification preferences */
  readonly notificationPreferences: GlobalPartyPatch['notificationPreferences'];
  /** Party statistics */
  readonly stats: GlobalPartyPatch['stats'];
}

/**
 * @summary Input for updating global party controller
 */
export interface UpdateGlobalPartyControllerInput {
  /** Party identifier */
  readonly partyId: PartyId;
  /** Updates to apply */
  readonly updates: GlobalPartyPatch;
}

/**
 * @summary Input for getting global party controller
 */
export interface GetGlobalPartyControllerInput {
  /** Party identifier */
  readonly partyId: PartyId;
}

/**
 * @summary Input for listing global parties controller
 */
export interface ListGlobalPartiesControllerInput {
  /** Search term for name or email */
  readonly search?: string;
  /** Filter by tags */
  readonly tags?: string[];
  /** Filter by role */
  readonly role?: GlobalPartyPatch['role'];
  /** Filter by source */
  readonly source?: GlobalPartyPatch['source'];
  /** Filter by status */
  readonly status?: GlobalPartyPatch['status'];
  /** Maximum number of results */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
}

/**
 * @summary Input for searching global parties by email controller
 */
export interface SearchGlobalPartiesByEmailControllerInput {
  /** Email to search for */
  readonly email: string;
  /** Maximum number of results */
  readonly limit?: number;
}

/**
 * @summary Input for deleting global party controller
 */
export interface DeleteGlobalPartyControllerInput {
  /** Party identifier */
  readonly partyId: PartyId;
}
