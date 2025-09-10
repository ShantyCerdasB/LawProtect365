/**
 * @file EnvelopesQueriesPort.ts
 * @summary Queries port for envelope operations
 * @description Defines the interface for envelope query operations
 */

import type { Envelope } from "../../../domain/entities/Envelope";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/index";
import type { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Input for getting an envelope by ID
 * @description Data to retrieve a specific envelope
 */
export interface GetEnvelopeQuery {
  readonly envelopeId: EnvelopeId;
  readonly actor?: ActorContext;
}

/**
 * @summary Result of getting an envelope by ID
 * @description Returns the envelope entity or null if not found
 */
export interface GetEnvelopeResult {
  readonly envelope: Envelope | null;
}

/**
 * @summary Input for listing envelopes
 * @description Parameters for listing envelopes with optional filters
 */
export interface ListEnvelopesQuery {
  readonly status?: EnvelopeStatus;
  readonly limit?: number;
  readonly cursor?: string;
  readonly actor?: ActorContext;
}

/**
 * @summary Result of listing envelopes
 * @description Returns paginated list of envelopes
 */
export interface ListEnvelopesResult {
  readonly items: Envelope[];
  readonly nextCursor?: string;
}

/**
 * @summary Input for getting envelope status
 * @description Data to retrieve envelope status
 */
export interface GetEnvelopeStatusQuery {
  readonly envelopeId: EnvelopeId;
  readonly actor?: ActorContext;
}

/**
 * @summary Result of getting envelope status
 * @description Returns the envelope status
 */
export interface GetEnvelopeStatusResult {
  readonly status: EnvelopeStatus | "not_found";
}

/**
 * @summary Queries port for envelope operations
 * @description Defines all query operations for envelopes
 */
export interface EnvelopesQueriesPort {
  /**
   * @summary Gets an envelope by ID
   * @param query - Query data for getting an envelope
   * @returns Promise resolving to the envelope or null
   */
  getById(query: GetEnvelopeQuery): Promise<GetEnvelopeResult>;

  /**
   * @summary Lists envelopes with optional filters
   * @param query - Query data for listing envelopes
   * @returns Promise resolving to paginated list of envelopes
   */
  list(query: ListEnvelopesQuery): Promise<ListEnvelopesResult>;

  /**
   * @summary Gets envelope status
   * @param query - Query data for getting envelope status
   * @returns Promise resolving to envelope status
   */
  getStatus(query: GetEnvelopeStatusQuery): Promise<GetEnvelopeStatusResult>;
};
