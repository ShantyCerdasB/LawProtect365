/**
 * @file DeleteInput.ts
 * @description Use case to delete an existing input.
 * Handles input deletion with validation, persistence, and domain event emission.
 */

/**
 * @file DeleteInput.ts
 * @summary Use case to delete an existing input.
 *
 * @description
 * Responsibilities:
 * - Validate input exists and envelope is in draft state.
 * - Delete the `Input` entity via the repository port.
 * - Emit domain events (`input.deleted`) for upstream subscribers (e.g., audit).
 * - Keep orchestration-only; no transport or provider concerns.
 */

import {
  nowIso,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Input } from "@/domain/entities/Input";
import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { InputId } from "@/adapters/dynamodb/InputRepositoryDdb";
import { assertDraft } from "@/domain/rules/EnvelopeLifecycle.rules";
import { envelopeNotFound, inputNotFound } from "@/shared/errors";

/**
 * @description Input contract for DeleteInput use case.
 * Defines the required parameters for deleting an input.
 */
export interface DeleteInputInput {
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Input identifier */
  inputId: string;
}

/**
 * @description Output contract for DeleteInput use case.
 * Contains the emitted domain events.
 */
export interface DeleteInputOutput {
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for DeleteInput use case.
 * Provides repository access and ID generation capabilities.
 */
export interface DeleteInputContext {
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
 * @description Deletes an existing input and emits `input.deleted` domain event.
 * Validates input exists and envelope is in draft state, deletes from repository, and emits audit event.
 *
 * @param {DeleteInputInput} input - Input parameters for input deletion
 * @param {DeleteInputContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<DeleteInputOutput>} Promise resolving to domain events
 * @throws {AppError} 404 when input/envelope not found, 409 when envelope not in draft
 */
export const deleteInput = async (
  input: DeleteInputInput,
  ctx: DeleteInputContext
): Promise<DeleteInputOutput> => {
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

  // 3. Delete input from repository
  await ctx.repos.inputs.delete({
    envelopeId: input.envelopeId,
    inputId: input.inputId,
  });

  // 4. Emit domain event
  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "input.deleted",
    occurredAt: nowIso() as ISODateString,
    payload: {
      envelopeId: input.envelopeId,
      inputId: input.inputId,
      deletedInput: {
        type: existingInput.type,
        page: existingInput.position.page,
        partyId: existingInput.partyId,
      },
    },
  };

  return { events: [event] as const };
};
