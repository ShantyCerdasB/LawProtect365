/**
 * @file PatchInputPositions.ts
 * @description Use case to update input positions in batch.
 * Handles position updates with validation, persistence, and domain event emission.
 */

/**
 * @file PatchInputPositions.ts
 * @summary Use case to update input positions in batch.
 *
 * @description
 * Responsibilities:
 * - Validate and normalize position updates (geometry, page bounds).
 * - Update multiple `Input` entities via the repository port.
 * - Emit domain events (`inputs.repositioned`) for upstream subscribers (e.g., audit).
 * - Keep orchestration-only; no transport or provider concerns.
 */

import {
  nowIso,
  AppError,
  ErrorCodes,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Input } from "@/domain/entities/Input";
import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { InputId } from "@/adapters/dynamodb/InputRepositoryDdb";
import { assertDraft } from "@/domain/rules/EnvelopeLifecycle.rules";
import { envelopeNotFound, inputNotFound } from "@/errors";

/**
 * @description Input contract for PatchInputPositions use case.
 * Defines the required parameters for updating input positions.
 */
export interface PatchInputPositionsInput {
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Array of input positions to update */
  items: Array<{
    /** Input identifier */
    inputId: string;
    /** Page number where the input is placed */
    page: number;
    /** X coordinate of the input */
    x: number;
    /** Y coordinate of the input */
    y: number;
  }>;
}

/**
 * @description Output contract for PatchInputPositions use case.
 * Contains the number of inputs updated and emitted domain events.
 */
export interface PatchInputPositionsOutput {
  /** Number of inputs updated */
  updated: number;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for PatchInputPositions use case.
 * Provides repository access and ID generation capabilities.
 */
export interface PatchInputPositionsContext {
  /** Repository dependencies */
  repos: {
    /** Input repository */
    inputs: Repository<Input, InputId>;
    /** Envelope repository for validation */
    envelopes: Repository<Envelope, EnvelopeId>;
  };
  /** ID generation utilities */
  ids: {
    /** Monotonic or time-ordered id generator (e.g., ULID) */
    ulid(): string;
  };
}

/**
 * @description Updates input positions in batch and emits `inputs.repositioned` domain event.
 * Validates input, updates input entities, persists to repository, and emits audit event.
 *
 * @param {PatchInputPositionsInput} input - Input parameters for position updates
 * @param {PatchInputPositionsContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<PatchInputPositionsOutput>} Promise resolving to update count and domain events
 * @throws {AppError} 400 when invariants are violated, 404 when input/envelope not found, 409 when envelope not in draft
 */
export const patchInputPositions = async (
  input: PatchInputPositionsInput,
  ctx: PatchInputPositionsContext
): Promise<PatchInputPositionsOutput> => {
  // 1. Validate envelope exists and is in draft state
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw envelopeNotFound();
  }
  assertDraft(envelope);

  // 2. Validate input array
  if (!input.items || input.items.length === 0) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "At least one input position must be provided"
    );
  }

  // 3. Validate each position update
  for (const item of input.items) {
    if (!item.inputId) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Input ID is required for each position update"
      );
    }
    
    if (item.page < 1) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Page number must be positive"
      );
    }
    
    if (item.x < 0 || item.y < 0) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Invalid geometry: coordinates must be non-negative"
      );
    }
  }

  // 4. Update each input position
  let updatedCount = 0;
  const updatedInputIds: string[] = [];

  for (const item of input.items) {
    // Get existing input
    const existingInput = await ctx.repos.inputs.getById({
      envelopeId: input.envelopeId,
      inputId: item.inputId,
    });
    
    if (!existingInput) {
      throw inputNotFound();
    }

    // Create updated input with new position
    const updatedInput: Input = {
      ...existingInput,
      position: {
        page: item.page,
        x: item.x,
        y: item.y,
      },
      updatedAt: nowIso() as ISODateString,
    };

    // Persist updated input
    await ctx.repos.inputs.update(
      { envelopeId: input.envelopeId, inputId: item.inputId },
      updatedInput
    );

    updatedCount++;
    updatedInputIds.push(item.inputId);
  }

  // 5. Emit domain event
  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "inputs.repositioned",
    occurredAt: nowIso() as ISODateString,
    payload: {
      envelopeId: input.envelopeId,
      inputIds: updatedInputIds,
      count: updatedCount,
    },
  };

  return { updated: updatedCount, events: [event] as const };
};
