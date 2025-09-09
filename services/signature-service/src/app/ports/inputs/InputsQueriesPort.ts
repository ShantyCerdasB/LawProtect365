/**
 * @file InputsQueriesPort.ts
 * @summary Port for input query operations
 * @description Defines the interface for read-only operations on inputs.
 * This port provides methods to retrieve input data without modifying it.
 * Used by application services to query input information.
 */

import type { TenantId, EnvelopeId, InputId, PartyId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
import { InputType } from "../../../domain/values/enums";

/**
 * Query parameters for getting a single input by ID
 */
export interface GetInputQuery {
  /** The tenant ID that owns the input */
  tenantId: TenantId;
  /** The envelope ID that contains the input */
  envelopeId: EnvelopeId;
  /** The unique identifier of the input */
  inputId: InputId;
  /** Actor context for audit logging (optional) */
  actor?: ActorContext;
}

/**
 * Query parameters for listing inputs by envelope
 */
export interface ListInputsQuery {
  /** The tenant ID that owns the inputs */
  tenantId: TenantId;
  /** The envelope ID to filter inputs by */
  envelopeId: EnvelopeId;
  /** Maximum number of inputs to return (optional) */
  limit?: number;
  /** Pagination cursor for getting the next page of results (optional) */
  cursor?: string;
  /** Document ID to filter inputs by (optional) */
  documentId?: string;
  /** Party ID to filter inputs by (optional) */
  partyId?: PartyId;
  /** Input type to filter by (optional) */
  type?: InputType;
  /** Whether to filter by required status (optional) */
  required?: boolean;
  /** Actor context for audit logging (optional) */
  actor?: ActorContext;
}

/**
 * Result of listing inputs with pagination support
 */
export interface ListInputsResult {
  /** Array of input data */
  items: Array<{
    /** The unique identifier of the input */
    inputId: InputId;
    /** Type of the input */
    type: InputType;
    /** Page number where the input is placed */
    page: number;
    /** Position of the input */
    position: { x: number; y: number };
    /** Party ID assigned to this input (optional) */
    assignedPartyId?: PartyId;
    /** Whether the input is required */
    required: boolean;
    /** Current value of the input (optional) */
    value?: string;
    /** ISO timestamp when the input was created */
    createdAt: string;
    /** ISO timestamp when the input was last updated */
    updatedAt: string;
  }>;
  /** Cursor for the next page of results (optional) */
  nextCursor?: string;
}

/**
 * Port interface for input query operations
 * 
 * This port defines the contract for read-only operations on inputs.
 * Implementations should provide efficient data retrieval without side effects.
 */
export interface InputsQueriesPort {
  /**
   * Retrieves a single input by its ID
   * @param query - Query parameters including tenant ID, envelope ID, and input ID
   * @returns Promise resolving to input data or null if not found
   */
  getById(query: GetInputQuery): Promise<ListInputsResult["items"][number] | null>;

  /**
   * Lists inputs for a specific envelope with pagination support
   * @param query - Query parameters including tenant ID, envelope ID, and pagination options
   * @returns Promise resolving to paginated list of inputs
   */
  listByEnvelope(query: ListInputsQuery): Promise<ListInputsResult>;
}






