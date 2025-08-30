/**
 * @file PatchInput.ts
 * @description Use case to update an existing input.
 * Handles input updates with validation, persistence, and domain event emission.
 */

/**
 * @file PatchInput.ts
 * @summary Use case to update an existing input.
 *
 * @description
 * Responsibilities:
 * - Validate and normalize input updates (geometry, types, references).
 * - Update the `Input` entity via the repository port.
 * - Emit domain events (`input.updated`) for upstream subscribers (e.g., audit).
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
import { InputTypeSchema } from "@/domain/value-objects/InputType";
import { envelopeNotFound, inputNotFound } from "@/errors";

/**
 * @description Input contract for PatchInput use case.
 * Defines the required parameters for updating an input.
 */
export interface PatchInputInput {
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Input identifier */
  inputId: string;
  /** Fields to update */
  updates: Partial<{
    /** Type of input */
    type: string;
    /** Page number */
    page: number;
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
    /** Whether the input is required */
    required: boolean;
    /** Party ID assigned to this input */
    partyId: string;
    /** Value of the input */
    value: string;
  }>;
}

/**
 * @description Output contract for PatchInput use case.
 * Contains the updated input and emitted domain events.
 */
export interface PatchInputOutput {
  /** Updated input entity */
  input: Input;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for PatchInput use case.
 * Provides repository access and ID generation capabilities.
 */
export interface PatchInputContext {
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
 * @description Updates an existing input and emits `input.updated` domain event.
 * Validates input, updates input entity, persists to repository, and emits audit event.
 *
 * @param {PatchInputInput} input - Input parameters for input update
 * @param {PatchInputContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<PatchInputOutput>} Promise resolving to updated input and domain events
 * @throws {AppError} 400 when invariants are violated, 404 when input/envelope not found, 409 when envelope not in draft
 */
export const patchInput = async (
  input: PatchInputInput,
  ctx: PatchInputContext
): Promise<PatchInputOutput> => {
  // 1. Validate envelope exists and is in draft state
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw envelopeNotFound();
  }
  assertDraft(envelope);

  // 2. Validate input exists
  const existingInput = await ctx.repos.inputs.getById({
    envelopeId: input.envelopeId,
    inputId: input.inputId,
  });
  if (!existingInput) {
    throw inputNotFound();
  }

  // 3. Validate updates
  if (input.updates.type) {
    InputTypeSchema.parse(input.updates.type);
  }
  
  if (input.updates.page !== undefined && input.updates.page < 1) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "Page number must be positive"
    );
  }
  
  if (input.updates.x !== undefined && input.updates.x < 0) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "X coordinate must be non-negative"
    );
  }
  
  if (input.updates.y !== undefined && input.updates.y < 0) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "Y coordinate must be non-negative"
    );
  }

  // 4. Create updated input entity
  const updatedInput: Input = {
    ...existingInput,
    type: input.updates.type as any || existingInput.type,
    required: input.updates.required !== undefined ? input.updates.required : existingInput.required,
    position: {
      page: input.updates.page !== undefined ? input.updates.page : existingInput.position.page,
      x: input.updates.x !== undefined ? input.updates.x : existingInput.position.x,
      y: input.updates.y !== undefined ? input.updates.y : existingInput.position.y,
    },
    partyId: input.updates.partyId !== undefined ? input.updates.partyId : existingInput.partyId,
    value: input.updates.value !== undefined ? input.updates.value : existingInput.value,
    updatedAt: nowIso() as ISODateString,
  };

  // 5. Persist updated input
  await ctx.repos.inputs.update(
    { envelopeId: input.envelopeId, inputId: input.inputId },
    updatedInput
  );

  // 6. Emit domain event
  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "input.updated",
    occurredAt: nowIso() as ISODateString,
    payload: {
      envelopeId: input.envelopeId,
      inputId: input.inputId,
      updates: input.updates,
    },
  };

  return { input: updatedInput, events: [event] as const };
};
