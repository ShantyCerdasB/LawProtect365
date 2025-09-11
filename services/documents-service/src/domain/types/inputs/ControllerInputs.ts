/**
 * @file ControllerInputs.ts
 * @summary Inputs for input controllers 
 * @description Defines the input contracts for input controllers, and actor are injected by the factory
 */

import type { EnvelopeId, InputId, PartyId } from "@/domain/value-objects/ids";
import type { InputType } from "../../../domain/values/enums";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for all input controllers
 * @description Common fields for input operations
 */
export interface BaseInputControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Input with input ID
 * @description Base input plus input identifier
 */
export interface InputWithIdControllerInput extends BaseInputControllerInput {
  /** Input identifier */
  readonly inputId: InputId;
}

// ============================================================================
// CREATE INPUTS
// ============================================================================

/**
 * @summary Input for creating inputs (controller level)
 * @description Parameters for creating new inputs, and actor are injected by factory
 */
export interface CreateInputsControllerInput extends BaseInputControllerInput {
  /** Document identifier */
  readonly documentId: string;
  /** Array of inputs to create */
  readonly inputs: any[];
}

// ============================================================================
// UPDATE INPUT
// ============================================================================

/**
 * @summary Input for updating an input (controller level)
 * @description Parameters for updating an existing input, and actor are injected by factory
 */
export interface UpdateInputControllerInput extends InputWithIdControllerInput {
  /** Updates to apply to the input */
  readonly updates: any;
}

// ============================================================================
// UPDATE INPUT POSITIONS
// ============================================================================

/**
 * @summary Input for updating input positions (controller level)
 * @description Parameters for updating positions of multiple inputs, and actor are injected by factory
 */
export interface UpdateInputPositionsControllerInput extends BaseInputControllerInput {
  /** Array of items with position updates */
  readonly items: any[];
}

// ============================================================================
// DELETE INPUT
// ============================================================================

/**
 * @summary Input for deleting an input (controller level)
 * @description Parameters for deleting an input, and actor are injected by factory
 */
export interface DeleteInputControllerInput extends InputWithIdControllerInput {
  // No additional fields needed for DELETE
}

// ============================================================================
// QUERY CONTROLLER INPUTS
// ============================================================================

/**
 * @summary Input for getting an input by ID (query controller)
 * @description Parameters for retrieving a single input, and actor are injected by factory
 */
export interface GetInputQueryControllerInput extends InputWithIdControllerInput {
  // No additional fields needed for GET
}

/**
 * @summary Input for listing inputs (query controller)
 * @description Parameters for listing inputs with optional filters, and actor are injected by factory
 */
export interface ListInputsQueryControllerInput extends BaseInputControllerInput {
  /** Maximum number of items to return */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
  /** Filter by document ID */
  readonly documentId?: string;
  /** Filter by party ID */
  readonly partyId?: PartyId;
  /** Filter by input type */
  readonly type?: InputType;
  /** Filter by required status */
  readonly required?: boolean;
}

