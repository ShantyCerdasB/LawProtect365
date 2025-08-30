/**
 * @file EnvelopesCommandsPort.ts
 * @description Port for envelope command operations defining write operations on envelopes.
 * Provides methods to create, update, and delete envelopes with proper business rule validation.
 */

/**
 * @file EnvelopesCommandsPort.ts
 * @summary Port for envelope command operations
 * @description Defines the interface for write operations on envelopes.
 * This port provides methods to create, update, and delete envelopes.
 * Used by application services to modify envelope data.
 */

import type { TenantId, UserId, EnvelopeId, ActorContext } from "../shared";



/**
 * @description Command for creating a new envelope.
 * Contains all required data for envelope creation.
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
 * @description Result of creating a new envelope.
 * Contains the created envelope identifier and creation timestamp.
 */
export interface CreateEnvelopeResult {
  /** The unique identifier of the created envelope */
  envelopeId: EnvelopeId;
  /** ISO timestamp when the envelope was created */
  createdAt: string;
}

/**
 * @description Port interface for envelope command operations.
 * 
 * This port defines the contract for write operations on envelopes.
 * Implementations should handle data persistence and business rule validation.
 */
export interface EnvelopesCommandsPort {
  /**
   * @description Creates a new envelope.
   *
   * @param {CreateEnvelopeCommand} command - The envelope creation command with required data
   * @returns {Promise<CreateEnvelopeResult>} Promise resolving to creation result with envelope ID and timestamp
   */
  create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult>;

  /**
   * @description Updates an existing envelope with partial data.
   *
   * @param {EnvelopeId} envelopeId - The unique identifier of the envelope to update
   * @param {Partial<{ title: string; status: string }>} patch - Partial data containing fields to update (title and/or status)
   * @returns {Promise<{ envelopeId: EnvelopeId; updatedAt: string }>} Promise resolving to update result with envelope ID and timestamp
   */
  update(envelopeId: EnvelopeId, patch: Partial<{ title: string; status: string }>): Promise<{ envelopeId: EnvelopeId; updatedAt: string }>;

  /**
   * @description Deletes an envelope.
   *
   * @param {EnvelopeId} envelopeId - The unique identifier of the envelope to delete
   * @returns {Promise<void>} Promise resolving when deletion is complete
   */
  delete(envelopeId: EnvelopeId): Promise<void>;
}
