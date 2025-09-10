/**
 * @file InputsRepository.ts
 * @summary Repository contract for Input entities
 * @description Defines the interface for Input repository operations using branded types
 */

import type { Input } from "@/domain/entities/Input";
import type { EnvelopeId } from "@/domain/value-objects/index";
import type { InputKey } from "@/domain/types/infrastructure/dynamodb";

/**
 * Repository contract for Input entities
 * Provides CRUD operations and specific queries for Input management
 */
export interface InputsRepository {
  /**
   * Retrieves an Input by its composite key
   * @param inputKey - The Input composite key (envelopeId + inputId)
   * @returns Promise resolving to the Input or null if not found
   */
  getById(inputKey: InputKey): Promise<Input | null>;

  /**
   * Lists inputs by envelope with pagination support and optional filtering
   * @param params - Query parameters including envelopeId, limit, cursor, and filters
   * @returns Promise resolving to paginated list of inputs
   */
  listByEnvelope(params: {
    envelopeId: EnvelopeId;
    limit?: number;
    cursor?: string;
    documentId?: string;
    partyId?: string;
    type?: string;
    required?: boolean;
  }): Promise<{ items: Input[]; nextCursor?: string }>;

  /**
   * Creates a new Input
   * @param input - The Input entity to create
   * @returns Promise resolving to the created Input
   */
  create(input: Input): Promise<Input>;

  /**
   * Updates an existing Input
   * @param inputKey - The Input composite key to update
   * @param patch - Partial fields to update
   * @returns Promise resolving to the updated Input
   */
  update(inputKey: InputKey, patch: Partial<Input>): Promise<Input>;

  /**
   * Deletes an Input by composite key
   * @param inputKey - The Input composite key to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(inputKey: InputKey): Promise<void>;

  /**
   * Checks if an Input exists
   * @param inputKey - The Input composite key to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  exists(inputKey: InputKey): Promise<boolean>;
}

