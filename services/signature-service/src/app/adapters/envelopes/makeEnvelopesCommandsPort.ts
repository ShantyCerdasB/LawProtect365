/**
 * @file makeEnvelopesCommandsPort.adapter.ts
 * @summary Factory for EnvelopesCommandsPort
 * @description Creates and configures the EnvelopesCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for envelope command operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { EnvelopesCommandsPort, CreateEnvelopeCommand, CreateEnvelopeResult } from "@/app/ports/envelopes/EnvelopesCommandsPort";
import { createEnvelope } from "@/use-cases/envelopes/CreateEnvelope";
import { patchEnvelope } from "@/use-cases/envelopes/PatchEnvelope";
import { deleteEnvelope } from "@/use-cases/envelopes/DeleteEnvelope";

/**
 * Creates an EnvelopesCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param deps - Dependencies including ID generators
 * @returns Configured EnvelopesCommandsPort implementation
 */
export const makeEnvelopesCommandsPort = (
  envelopesRepo: Repository<Envelope, EnvelopeId>,
  deps: { ids: { ulid(): string } }
): EnvelopesCommandsPort => {
  return {
    /**
     * Creates a new envelope
     * @param command - The envelope creation command
     * @returns Promise resolving to creation result
     */
    async create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult> {
      const result = await createEnvelope(
        {
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          title: command.title,
          actor: command.actor,
        },
        {
          repos: { envelopes: envelopesRepo },
          ids: deps.ids,
        }
      );

      return {
        envelopeId: result.envelope.envelopeId,
        createdAt: result.envelope.createdAt,
      };
    },

    /**
     * Updates an existing envelope
     * @param envelopeId - The envelope ID to update
     * @param patch - The fields to update
     * @returns Promise resolving to update result
     */
    async update(envelopeId: EnvelopeId, patch: Partial<{ title: string; status: string }>): Promise<{ envelopeId: EnvelopeId; updatedAt: string }> {
      const result = await patchEnvelope(
        { envelopeId, title: patch.title },
        { repos: { envelopes: envelopesRepo } }
      );

      return {
        envelopeId: result.envelope.envelopeId,
        updatedAt: result.envelope.updatedAt,
      };
    },

    /**
     * Deletes an envelope
     * @param envelopeId - The envelope ID to delete
     * @returns Promise resolving when deletion is complete
     */
    async delete(envelopeId: EnvelopeId): Promise<void> {
      await deleteEnvelope(
        { envelopeId },
        { repos: { envelopes: envelopesRepo } }
      );
    },
  };
};
