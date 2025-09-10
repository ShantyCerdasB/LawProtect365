/**
 * @file InputsCommandsPort.ts
 * @summary Port for input command operations
 * @description Defines the interface for write operations on inputs.
 * This port provides methods to create, update, and delete inputs.
 * Used by application services to modify input data.
 */

import type { EnvelopeId, InputId, PartyId } from "../../../domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
import { InputType } from "../../../domain/values/enums";

/**
 * @description Command for creating inputs in batch.
 * Contains all required data for input creation.
 */
export interface CreateInputsCommand {
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
    partyId?: PartyId;
    /** Initial value of the input (optional) */
    value?: string;
  }>;
  /** Context information about the actor creating the inputs */
  actor: ActorContext;
}

/**
 * @description Result of creating inputs in batch.
 * Contains the created input identifiers and count.
 */
export interface CreateInputsResult {
  /** Array of created input data */
  items: Array<{
    /** The unique identifier of the created input */
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
  inputId: InputId;
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
    /** Whether the input is required */
    required: boolean;
    /** Party ID assigned to this input */
    partyId: PartyId;
    /** Value of the input */
    value: string;
  }>;
  /** Context information about the actor updating the input */
  actor: ActorContext;
}

/**
 * @description Result of updating an input.
 * Contains the updated input identifier and timestamp.
 */
export interface UpdateInputResult {
  /** The unique identifier of the updated input */
  inputId: InputId;
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
    inputId: InputId;
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
  /** Context information about the actor updating the positions */
  actor: ActorContext;
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
  inputId: InputId;
  /** Context information about the actor deleting the input */
  actor: ActorContext;
}

/**
 * @description Port interface for input command operations.
 * 
 * This port defines the contract for write operations on inputs.
 * Implementations should handle data persistence and business rule validation.
 */
export interface InputsCommandsPort {
  /**
   * @summary Creates inputs in batch
   * @description Creates multiple inputs in a single operation with validation
   * @param command - The input creation command with required data
   * @returns Promise resolving to creation result with input data and count
   */
  create(command: CreateInputsCommand): Promise<CreateInputsResult>;

  /**
   * @summary Updates an existing input with partial data
   * @description Updates an existing input with partial data
   * @param command - The input update command with identifier and fields to update
   * @returns Promise resolving to update result with input ID and timestamp
   */
  update(command: UpdateInputCommand): Promise<UpdateInputResult>;

  /**
   * @summary Updates input positions in batch
   * @description Updates input positions in batch for efficient bulk operations
   * @param command - The position update command with array of positions
   * @returns Promise resolving to update result with count
   */
  updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult>;

  /**
   * @summary Deletes an input
   * @description Deletes an input from the repository
   * @param command - The input deletion command with identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(command: DeleteInputCommand): Promise<void>;
};
