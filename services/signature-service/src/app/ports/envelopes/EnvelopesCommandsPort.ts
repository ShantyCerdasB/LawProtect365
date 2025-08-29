/**
 * @file EnvelopesCommandsPort.ts
 * @summary Port for envelope command operations
 * @description Defines the interface for write operations on envelopes.
 * This port provides methods to create, update, and delete envelopes.
 * Used by application services to modify envelope data.
 */

import type { TenantId, UserId, EnvelopeId } from "../shared";

/**
 * Context information about the actor performing an operation
 * Used for audit trails and authorization purposes
 */
export interface ActorContext {
  /** User ID of the actor (optional) */
  userId?: string;
  /** Email address of the actor (optional) */
  email?: string;
  /** IP address of the actor (optional) */
  ip?: string;
  /** User agent string of the actor (optional) */
  userAgent?: string;
  /** Locale preference of the actor (optional) */
  locale?: string;
}

/**
 * Command for creating a new envelope
 */
export interface CreateEnvelopeCommand {
  /** The tenant ID that owns the envelope */
  tenantId: TenantId;
  /** The user ID of the envelope owner */
  ownerId: UserId;
  /** The title/name of the envelope */
  title: string;
  /** Context information about the actor creating the envelope (optional) */
  actor?: ActorContext;
}

/**
 * Result of creating a new envelope
 */
export interface CreateEnvelopeResult {
  /** The unique identifier of the created envelope */
  envelopeId: EnvelopeId;
  /** ISO timestamp when the envelope was created */
  createdAt: string;
}

/**
 * Port interface for envelope command operations
 * 
 * This port defines the contract for write operations on envelopes.
 * Implementations should handle data persistence and business rule validation.
 */
export interface EnvelopesCommandsPort {
  /**
   * Creates a new envelope
   * @param command - The envelope creation command with required data
   * @returns Promise resolving to creation result with envelope ID and timestamp
   */
  create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult>;

  /**
   * Updates an existing envelope with partial data
   * @param envelopeId - The unique identifier of the envelope to update
   * @param patch - Partial data containing fields to update (title and/or status)
   * @returns Promise resolving to update result with envelope ID and timestamp
   */
  update(envelopeId: EnvelopeId, patch: Partial<{ title: string; status: string }>): Promise<{ envelopeId: EnvelopeId; updatedAt: string }>;

  /**
   * Deletes an envelope
   * @param envelopeId - The unique identifier of the envelope to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(envelopeId: EnvelopeId): Promise<void>;
}
