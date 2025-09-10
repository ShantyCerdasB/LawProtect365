/**
 * @file EnvelopesCommandsPort.ts
 * @summary Commands port for envelope operations
 * @description Defines the interface for envelope command operations
 */

import type { Envelope } from "../../../domain/entities/Envelope";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/index";

/**
 * @summary Base interface for envelope operations
 * @description Common attributes shared across envelope operations
 */
interface BaseEnvelopeCommand {
  readonly ownerEmail: string;
}

/**
 * @summary Base interface for envelope updates
 * @description Common attributes for update operations
 */
interface BaseEnvelopeUpdate {
  readonly name?: string;
  readonly status?: EnvelopeStatus;
  readonly parties?: string[];
  readonly documents?: string[];
}

/**
 * @summary Input for creating an envelope
 * @description Required data to create a new envelope
 */
export interface CreateEnvelopeCommand extends BaseEnvelopeCommand {
  readonly name: string;
  readonly status?: EnvelopeStatus;
  readonly parties?: string[];
  readonly documents?: string[];
}

/**
 * @summary Result of creating an envelope
 * @description Returns the created envelope entity
 */
export interface CreateEnvelopeResult {
  readonly envelope: Envelope;
}

/**
 * @summary Input for updating an envelope
 * @description Data to update an existing envelope
 */
export interface UpdateEnvelopeCommand extends BaseEnvelopeCommand, BaseEnvelopeUpdate {
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Result of updating an envelope
 * @description Returns the updated envelope entity
 */
export interface UpdateEnvelopeResult {
  readonly envelope: Envelope;
}

/**
 * @summary Input for deleting an envelope
 * @description Data to delete an envelope
 */
export interface DeleteEnvelopeCommand extends BaseEnvelopeCommand {
  readonly envelopeId: EnvelopeId;
}

/**
 * @summary Result of deleting an envelope
 * @description Confirms the deletion operation
 */
export interface DeleteEnvelopeResult {
  readonly deleted: boolean;
}

/**
 * @summary Commands port for envelope operations
 * @description Defines all command operations for envelopes
 */
export interface EnvelopesCommandsPort {
  /**
   * @summary Creates a new envelope
   * @param command - Command data for creating an envelope
   * @returns Promise resolving to the created envelope
   */
  create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult>;

  /**
   * @summary Updates an existing envelope
   * @param command - Command data for updating an envelope
   * @returns Promise resolving to the updated envelope
   */
  update(command: UpdateEnvelopeCommand): Promise<UpdateEnvelopeResult>;

  /**
   * @summary Deletes an envelope
   * @param command - Command data for deleting an envelope
   * @returns Promise resolving to deletion confirmation
   */
  delete(command: DeleteEnvelopeCommand): Promise<DeleteEnvelopeResult>;
};
