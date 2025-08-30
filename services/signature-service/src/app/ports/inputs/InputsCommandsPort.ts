
/**
 * @file InputsCommandsPort.ts
 * @summary Port for input command operations
 * @description Defines the interface for write operations on inputs.
 * This port provides methods to create, update, and delete inputs.
 * Used by application services to modify input data.
 */

import type { TenantId, EnvelopeId, ActorContext } from "../shared";
import { InputType } from "@/domain/values/enums";

/**
 * @description Command for creating inputs in batch.
 * Contains all required data for input creation.
 */
export interface CreateInputsCommand {
  /** The tenant ID that owns the inputs */
  tenantId: TenantId;
  /** The envelope ID that contains the inputs */
  envelopeId: EnvelopeId;
  /** The document ID that contains the inputs */
  documentId: string;
  /** Array of inputs to create */
  inputs: Array<{
    /** Type of input (signature, initials, text, date, checkbox) */
    type: InputType;
    /** Page number where the input is placed */
    page: number;
    /** X coordinate of the input */
    x: number;
    /** Y coordinate of the input */
    y: number;
    /** Width of the input */
    width: number;
    /** Height of the input */
    height: number;
    /** Whether the input is required */
    required: boolean;
    /** Party ID assigned to this input (optional) */
    partyId?: string;
    /** Initial value of the input (optional) */
    value?: string;
  }>;
  /** Context information about the actor creating the inputs (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of creating inputs in batch.
 * Contains the created input identifiers and count.
 */
export interface CreateInputsResult {
  /** Array of created input data */
  items: Array<{
    /** The unique identifier of the created input */
    inputId: string;
    /** Type of the input */
    type: InputType;
    /** Page number where the input is placed */
    page: number;
    /** Geometry of the input */
    geometry: { x: number; y: number; w: number; h: number };
    /** Party ID assigned to this input (optional) */
    assignedPartyId?: string;
    /** Whether the input is required */
    required: boolean;
  }>;
  /** Number of inputs created */
  count: number;
}

/**
 * @description Command for updating an existing input.
 * Contains the input identifier and fields to update.
 */
export interface UpdateInputCommand {
  /** The envelope ID that contains the input */
  envelopeId: EnvelopeId;
  /** The unique identifier of the input to update */
  inputId: string;
  /** Fields to update */
  updates: Partial<{
    /** Type of input */
    type: InputType;
    /** Page number */
    page: number;
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
    /** Width */
    width: number;
    /** Height */
    height: number;
    /** Whether the input is required */
    required: boolean;
    /** Party ID assigned to this input */
    partyId: string;
    /** Value of the input */
    value: string;
  }>;
  /** Context information about the actor updating the input (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of updating an input.
 * Contains the updated input identifier and timestamp.
 */
export interface UpdateInputResult {
  /** The unique identifier of the updated input */
  inputId: string;
  /** ISO timestamp when the input was updated */
  updatedAt: string;
}

/**
 * @description Command for updating input positions in batch.
 * Contains array of input positions to update.
 */
export interface UpdateInputPositionsCommand {
  /** The envelope ID that contains the inputs */
  envelopeId: EnvelopeId;
  /** Array of input positions to update */
  items: Array<{
    /** The unique identifier of the input */
    inputId: string;
    /** Page number where the input is placed */
    page: number;
    /** X coordinate of the input */
    x: number;
    /** Y coordinate of the input */
    y: number;
    /** Width of the input */
    width: number;
    /** Height of the input */
    height: number;
  }>;
  /** Context information about the actor updating the positions (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of updating input positions in batch.
 * Contains the number of inputs updated.
 */
export interface UpdateInputPositionsResult {
  /** Number of inputs updated */
  updated: number;
}

/**
 * @description Command for deleting an input.
 * Contains the input identifier to delete.
 */
export interface DeleteInputCommand {
  /** The envelope ID that contains the input */
  envelopeId: EnvelopeId;
  /** The unique identifier of the input to delete */
  inputId: string;
  /** Context information about the actor deleting the input (optional) */
  actor?: ActorContext;
}

/**
 * @description Port interface for input command operations.
 * 
 * This port defines the contract for write operations on inputs.
 * Implementations should handle data persistence and business rule validation.
 */
export interface InputsCommandsPort {
  /**
   * @description Creates inputs in batch.
   *
   * @param {CreateInputsCommand} command - The input creation command with required data
   * @returns {Promise<CreateInputsResult>} Promise resolving to creation result with input data and count
   */
  create(command: CreateInputsCommand): Promise<CreateInputsResult>;

  /**
   * @description Updates an existing input with partial data.
   *
   * @param {UpdateInputCommand} command - The input update command with identifier and fields to update
   * @returns {Promise<UpdateInputResult>} Promise resolving to update result with input ID and timestamp
   */
  update(command: UpdateInputCommand): Promise<UpdateInputResult>;

  /**
   * @description Updates input positions in batch.
   *
   * @param {UpdateInputPositionsCommand} command - The position update command with array of positions
   * @returns {Promise<UpdateInputPositionsResult>} Promise resolving to update result with count
   */
  updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult>;

  /**
   * @description Deletes an input.
   *
   * @param {DeleteInputCommand} command - The input deletion command with identifier
   * @returns {Promise<void>} Promise resolving when deletion is complete
   */
  delete(command: DeleteInputCommand): Promise<void>;
}
