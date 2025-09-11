/**
 * @file InputsValidationService.ts
 * @summary Validation service for Input operations
 * @description Handles validation logic for input create, update, and delete operations
 */

import type { 
  CreateInputsCommand,
  UpdateInputCommand,
  UpdateInputPositionsCommand,
  DeleteInputCommand
} from "../../ports/inputs/InputsCommandsPort";
import type {
  GetInputQuery,
  ListInputsQuery
} from "../../ports/inputs/InputsQueriesPort";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import { 
  assertInputReferences, 
  assertInputGeometry, 
  assertNoIllegalOverlap 
} from "../../../domain/rules/Inputs.rules";

/**
 * @summary Validation service for Input operations
 * @description Provides validation methods for input commands
 */
export class InputsValidationService {
  /**
   * @summary Validates common base fields (envelopeId)
   * @description Helper method to validate common fields across all operations
   */
  private validateBaseFields(envelopeId: string, context: any): void {
    if (!envelopeId || envelopeId.trim().length === 0) {
      throw new BadRequestError(
        "Envelope ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        context
      );
    }
  }

  /**
   * @summary Validates input ID field
   * @description Helper method to validate input ID field
   */
  private validateInputId(inputId: string, context: any): void {
    if (!inputId || inputId.trim().length === 0) {
      throw new BadRequestError(
        "Input ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        context
      );
    }
  }

  /**
   * @summary Validates coordinate values
   * @description Helper method to validate x, y coordinates
   */
  private validateCoordinates(x: number, y: number, context: any, index?: number): void {
    const prefix = index !== undefined ? `for item at index ${index}` : '';
    
    if (x < 0 || !Number.isFinite(x)) {
      throw new BadRequestError(
        `X coordinate must be a non-negative number ${prefix}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        context
      );
    }
    if (y < 0 || !Number.isFinite(y)) {
      throw new BadRequestError(
        `Y coordinate must be a non-negative number ${prefix}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        context
      );
    }
  }

  /**
   * @summary Validates page number
   * @description Helper method to validate page number
   */
  private validatePageNumber(page: number, context: any, index?: number): void {
    const prefix = index !== undefined ? `for item at index ${index}` : '';
    
    if (page < 1 || !Number.isInteger(page)) {
      throw new BadRequestError(
        `Page number must be a positive integer ${prefix}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        context
      );
    }
  }
  /**
   * @summary Validates input creation command
   * @description Ensures all required fields are present and valid
   */
  async validateCreate(command: CreateInputsCommand): Promise<void> {
    if (!command) {
      throw new BadRequestError(
        "Command is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError(
        "Envelope ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    if (!command.documentId || command.documentId.trim().length === 0) {
      throw new BadRequestError(
        "Document ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    if (!command.inputs || command.inputs.length === 0) {
      throw new BadRequestError(
        "At least one input is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    // Validate each input
    for (let i = 0; i < command.inputs.length; i++) {
      const input = command.inputs[i];
      await this.validateInputData(input, i);
    }
  }

  /**
   * @summary Validates input update command
   * @description Ensures at least one field is provided for update
   */
  async validateUpdate(command: UpdateInputCommand): Promise<void> {
    this.validateBaseFields(command.envelopeId, { command });
    this.validateInputId(command.inputId, { command });

    const hasUpdates = command.updates.type !== undefined ||
                      command.updates.page !== undefined ||
                      command.updates.x !== undefined ||
                      command.updates.y !== undefined ||
                      command.updates.required !== undefined ||
                      command.updates.partyId !== undefined ||
                      command.updates.value !== undefined;

    if (!hasUpdates) {
      throw new BadRequestError(
        "At least one field must be provided for update",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    // Validate individual fields if provided
    if (command.updates.page !== undefined) {
      this.validatePageNumber(command.updates.page, { command });
    }

    if (command.updates.x !== undefined && command.updates.y !== undefined) {
      this.validateCoordinates(command.updates.x, command.updates.y, { command });
    } else if (command.updates.x !== undefined) {
      this.validateCoordinates(command.updates.x, 0, { command });
    } else if (command.updates.y !== undefined) {
      this.validateCoordinates(0, command.updates.y, { command });
    }
  }

  /**
   * @summary Validates input positions update command
   * @description Ensures all positions are valid
   */
  async validateUpdatePositions(command: UpdateInputPositionsCommand): Promise<void> {
    this.validateBaseFields(command.envelopeId, { command });

    if (!command.items || command.items.length === 0) {
      throw new BadRequestError(
        "At least one input position is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    // Validate each position
    for (let i = 0; i < command.items.length; i++) {
      const item = command.items[i];
      
      if (!item.inputId || item.inputId.trim().length === 0) {
        throw new BadRequestError(
          `Input ID is required for item at index ${i}`,
          ErrorCodes.COMMON_BAD_REQUEST,
          { command, index: i }
        );
      }

      this.validatePageNumber(item.page, { command, index: i }, i);
      this.validateCoordinates(item.x, item.y, { command, index: i }, i);
    }
  }

  /**
   * @summary Validates input deletion command
   * @description Ensures required fields are present
   */
  async validateDelete(command: DeleteInputCommand): Promise<void> {
    this.validateBaseFields(command.envelopeId, { command });
    this.validateInputId(command.inputId, { command });
  }

  /**
   * @summary Validates get input by ID query
   * @description Ensures required fields are present for query
   */
  async validateGetById(query: GetInputQuery): Promise<void> {
    this.validateBaseFields(query.envelopeId, { query });
    this.validateInputId(query.inputId, { query });
  }

  /**
   * @summary Validates list inputs by envelope query
   * @description Ensures required fields are present and pagination limits are valid
   */
  async validateListByEnvelope(query: ListInputsQuery): Promise<void> {
    this.validateBaseFields(query.envelopeId, { query });

    // Validate pagination limits
    if (query.limit !== undefined) {
      if (query.limit < 1 || query.limit > 100 || !Number.isInteger(query.limit)) {
        throw new BadRequestError(
          "Limit must be an integer between 1 and 100",
          ErrorCodes.COMMON_BAD_REQUEST,
          { query }
        );
      }
    }

    // Validate cursor format if provided
    if (query.cursor !== undefined && (!query.cursor || query.cursor.trim().length === 0)) {
      throw new BadRequestError(
        "Cursor cannot be empty if provided",
        ErrorCodes.COMMON_BAD_REQUEST,
        { query }
      );
    }

    // Validate document ID if provided
    if (query.documentId !== undefined && (!query.documentId || query.documentId.trim().length === 0)) {
      throw new BadRequestError(
        "Document ID cannot be empty if provided",
        ErrorCodes.COMMON_BAD_REQUEST,
        { query }
      );
    }

    // Validate party ID if provided
    if (query.partyId !== undefined && (!query.partyId || query.partyId.trim().length === 0)) {
      throw new BadRequestError(
        "Party ID cannot be empty if provided",
        ErrorCodes.COMMON_BAD_REQUEST,
        { query }
      );
    }
  }

  /**
   * @summary Validates input references to documents and parties
   * @description Ensures all input references are valid
   */
  validateInputReferences(
    inputs: readonly any[],
    documentIds: ReadonlySet<string>,
    partyIds: ReadonlySet<string>
  ): void {
    assertInputReferences(inputs, documentIds, partyIds);
  }

  /**
   * @summary Validates input geometry within page bounds
   * @description Ensures inputs are within page dimensions
   */
  validateInputGeometry(
    inputs: readonly any[],
    pageSize: { width: number; height: number }
  ): void {
    assertInputGeometry(inputs, pageSize);
  }

  /**
   * @summary Validates no illegal overlap between inputs
   * @description Ensures inputs don't overlap when strict mode is enabled
   */
  validateNoIllegalOverlap(
    inputs: readonly any[],
    strict: boolean = false
  ): void {
    assertNoIllegalOverlap(inputs, strict);
  }

  /**
   * @summary Validates individual input data
   * @description Validates a single input object
   */
  private async validateInputData(input: any, index: number): Promise<void> {
    if (!input.type || input.type.trim().length === 0) {
      throw new BadRequestError(
        `Input type is required for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }

    this.validatePageNumber(input.page, { input, index }, index);
    this.validateCoordinates(input.x, input.y, { input, index }, index);

    if (typeof input.required !== "boolean") {
      throw new BadRequestError(
        `Required field must be a boolean for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }

    // Validate party ID if provided
    if (input.partyId !== undefined && (!input.partyId || input.partyId.trim().length === 0)) {
      throw new BadRequestError(
        `Party ID cannot be empty for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }
  }
};
