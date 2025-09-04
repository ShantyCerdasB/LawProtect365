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
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @summary Validation service for Input operations
 * @description Provides validation methods for input commands
 */
export class InputsValidationService {
  /**
   * @summary Validates input creation command
   * @description Ensures all required fields are present and valid
   */
  async validateCreate(command: CreateInputsCommand): Promise<void> {
    if (!command.tenantId || command.tenantId.trim().length === 0) {
      throw new BadRequestError(
        "Tenant ID is required",
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
    if (!command.tenantId || command.tenantId.trim().length === 0) {
      throw new BadRequestError(
        "Tenant ID is required",
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

    if (!command.inputId || command.inputId.trim().length === 0) {
      throw new BadRequestError(
        "Input ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

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
    if (command.updates.page !== undefined && (command.updates.page < 1 || !Number.isInteger(command.updates.page))) {
      throw new BadRequestError(
        "Page number must be a positive integer",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    if (command.updates.x !== undefined && (command.updates.x < 0 || !Number.isFinite(command.updates.x))) {
      throw new BadRequestError(
        "X coordinate must be a non-negative number",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }

    if (command.updates.y !== undefined && (command.updates.y < 0 || !Number.isFinite(command.updates.y))) {
      throw new BadRequestError(
        "Y coordinate must be a non-negative number",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }
  }

  /**
   * @summary Validates input positions update command
   * @description Ensures all positions are valid
   */
  async validateUpdatePositions(command: UpdateInputPositionsCommand): Promise<void> {
    if (!command.tenantId || command.tenantId.trim().length === 0) {
      throw new BadRequestError(
        "Tenant ID is required",
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

      if (item.page < 1 || !Number.isInteger(item.page)) {
        throw new BadRequestError(
          `Page number must be a positive integer for item at index ${i}`,
          ErrorCodes.COMMON_BAD_REQUEST,
          { command, index: i }
        );
      }

      if (item.x < 0 || !Number.isFinite(item.x)) {
        throw new BadRequestError(
          `X coordinate must be a non-negative number for item at index ${i}`,
          ErrorCodes.COMMON_BAD_REQUEST,
          { command, index: i }
        );
      }

      if (item.y < 0 || !Number.isFinite(item.y)) {
        throw new BadRequestError(
          `Y coordinate must be a non-negative number for item at index ${i}`,
          ErrorCodes.COMMON_BAD_REQUEST,
          { command, index: i }
        );
      }
    }
  }

  /**
   * @summary Validates input deletion command
   * @description Ensures required fields are present
   */
  async validateDelete(command: DeleteInputCommand): Promise<void> {
    if (!command.tenantId || command.tenantId.trim().length === 0) {
      throw new BadRequestError(
        "Tenant ID is required",
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

    if (!command.inputId || command.inputId.trim().length === 0) {
      throw new BadRequestError(
        "Input ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { command }
      );
    }
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

    if (input.page < 1 || !Number.isInteger(input.page)) {
      throw new BadRequestError(
        `Page number must be a positive integer for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }

    if (input.x < 0 || !Number.isFinite(input.x)) {
      throw new BadRequestError(
        `X coordinate must be a non-negative number for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }

    if (input.y < 0 || !Number.isFinite(input.y)) {
      throw new BadRequestError(
        `Y coordinate must be a non-negative number for input at index ${index}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { input, index }
      );
    }

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
}
