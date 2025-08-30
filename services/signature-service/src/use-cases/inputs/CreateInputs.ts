/**
 * @file CreateInputs.ts
 * @description Use case to create inputs in batch and emit domain events.
 * Handles input creation with validation, persistence, and domain event emission for audit tracking.
 */

/**
 * @file CreateInputs.ts
 * @summary Use case to create inputs in batch and emit domain events.
 *
 * @description
 * Responsibilities:
 * - Validate and normalize input (geometry, types, references).
 * - Build and persist the `Input` entities via the repository port.
 * - Emit domain events (`inputs.created`) for upstream subscribers (e.g., audit).
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
import type { EnvelopeId, TenantId } from "@/domain/value-objects/Ids";
import type { InputId } from "@/adapters/dynamodb/InputRepositoryDdb";
import { assertDraft } from "@/domain/rules/EnvelopeLifecycle.rules";
import { InputTypeSchema } from "@/domain/value-objects/InputType";
import { envelopeNotFound } from "@/errors";

/**
 * @description Minimal actor context propagated for attribution/auditing purposes.
 * Contains user and request information for audit trail tracking.
 */
export interface ActorContext {
  /** User identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** User locale preference */
  locale?: string;
}

/**
 * @description Input contract for CreateInputs use case.
 * Defines the required parameters for creating inputs in batch.
 */
export interface CreateInputsInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Document identifier */
  documentId: string;
  /** Array of inputs to create */
  inputs: Array<{
    /** Type of input (signature, initials, text, date, checkbox) */
    type: string;
    /** Page number where the input is placed */
    page: number;
    /** X coordinate of the input */
    x: number;
    /** Y coordinate of the input */
    y: number;
    /** Whether the input is required */
    required: boolean;
    /** Party ID assigned to this input (optional) */
    partyId?: string;
    /** Initial value of the input (optional) */
    value?: string;
  }>;
  /** Optional actor context for downstream subscribers */
  actor?: ActorContext;
}

/**
 * @description Output contract for CreateInputs use case.
 * Contains the created inputs and emitted domain events.
 */
export interface CreateInputsOutput {
  /** Created input entities */
  inputs: Input[];
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for CreateInputs use case.
 * Provides repository access and ID generation capabilities.
 */
export interface CreateInputsContext {
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
 * @description Creates inputs in batch and emits `inputs.created` domain event.
 * Validates input, creates input entities, persists to repository, and emits audit event.
 *
 * @param {CreateInputsInput} input - Input parameters for input creation
 * @param {CreateInputsContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<CreateInputsOutput>} Promise resolving to created inputs and domain events
 * @throws {AppError} 400 when invariants are violated, 404 when envelope not found, 409 when envelope not in draft
 */
export const createInputs = async (
  input: CreateInputsInput,
  ctx: CreateInputsContext
): Promise<CreateInputsOutput> => {
  // 1. Validate envelope exists and is in draft state
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw envelopeNotFound();
  }
  assertDraft(envelope);

  // 2. Validate inputs
  for (const inputData of input.inputs) {
    // Validate input type
    InputTypeSchema.parse(inputData.type);
    
    // Validate page number
    if (inputData.page < 1) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Page number must be positive"
      );
    }
    
    // Validate geometry
    if (inputData.x < 0 || inputData.y < 0) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Invalid geometry: coordinates must be non-negative"
      );
    }
  }

  // 3. Create input entities
  const inputs: Input[] = input.inputs.map(inputData => ({
    inputId: ctx.ids.ulid(),
    envelopeId: input.envelopeId,
    documentId: input.documentId,
    partyId: inputData.partyId || "",
    type: inputData.type as any,
    required: inputData.required,
    position: {
      page: inputData.page,
      x: inputData.x,
      y: inputData.y,
    },
    value: inputData.value,
    createdAt: nowIso() as ISODateString,
    updatedAt: nowIso() as ISODateString,
  }));

  // 4. Persist inputs
  for (const inputEntity of inputs) {
    await ctx.repos.inputs.create(inputEntity);
  }

  // 5. Emit domain event
  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "inputs.created",
    occurredAt: nowIso() as ISODateString,
    payload: {
      envelopeId: input.envelopeId,
      documentId: input.documentId,
      inputIds: inputs.map(i => i.inputId),
      count: inputs.length,
      actor: input.actor,
    },
  };

  return { inputs, events: [event] as const };
};
