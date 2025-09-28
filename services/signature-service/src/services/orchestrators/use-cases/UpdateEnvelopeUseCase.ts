/**
 * @fileoverview UpdateEnvelopeUseCase - Use case for updating envelope metadata and signer roster
 * @summary Handles envelope updates including metadata changes and signer management
 * @description This use case manages the complete envelope update workflow, including
 * S3 file validation, envelope metadata updates, signer additions/removals, and
 * returning the updated envelope state with optional signer information.
 * It ensures proper validation and maintains data consistency during updates.
 */

import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { S3Service } from '@/services/S3Service';
import { envelopeNotFound } from '@/signature-errors';
import { rethrow } from '@lawprotect/shared-ts';
import { EntityFactory } from '@/domain/factories/EntityFactory';
import { mapAddSigners } from '@/services/orchestrators/utils/mapAddSigners';
import { UpdateEnvelopeUseCaseInput, UpdateEnvelopeUseCaseResult } from '@/domain/types/usecase/orchestrator/UpdateEnvelopeUseCase';

/**
 * Use case for updating envelope metadata and managing signer roster
 * @description Handles envelope updates including metadata changes, signer additions/removals,
 * and S3 file validation. Returns updated envelope state with optional signer information.
 */
export class UpdateEnvelopeUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Updates envelope metadata and manages signer roster with complete validation
   * @param input - The update request containing envelope ID, update data, and user context
   * @param input.envelopeId - The unique identifier of the envelope to update
   * @param input.updateData - The update data containing metadata changes and signer modifications
   * @param input.userId - The ID of the user performing the update
   * @returns Promise that resolves to the update result with envelope and optional signers
   * @throws NotFoundError when envelope is not found after update
   * @throws ValidationError when S3 files don't exist or update data is invalid
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('env-123'),
   *   updateData: { title: 'Updated Title', addSigners: [...] },
   *   userId: 'user-456'
   * });
   */
  async execute(input: UpdateEnvelopeUseCaseInput): Promise<UpdateEnvelopeUseCaseResult> {
    const { envelopeId, updateData, userId } = input;

    try {
      if (updateData.sourceKey || updateData.metaKey) {
        await this.s3Service.assertExists({
          sourceKey: updateData.sourceKey,
          metaKey: updateData.metaKey
        });
      }

      const updatedEnvelope = await this.signatureEnvelopeService.updateEnvelope(
        envelopeId,
        updateData,
        userId
      );

      if (updateData.addSigners?.length) {
        const signersData = mapAddSigners(updateData.addSigners, envelopeId, userId);
        await this.envelopeSignerService.createSignersForEnvelope(envelopeId, signersData);
      }

      if (updateData.removeSignerIds?.length) {
        for (const signerId of updateData.removeSignerIds) {
          await this.envelopeSignerService.deleteSigner(
            EntityFactory.createValueObjects.signerId(signerId)
          );
        }
      }

      const rosterChanged =
        (updateData.addSigners?.length ?? 0) > 0 ||
        (updateData.removeSignerIds?.length ?? 0) > 0;

      if (!rosterChanged) {
        return { envelope: updatedEnvelope };
      }

      const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelopeWithSigners) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      return {
        envelope: updatedEnvelope,
        signers: envelopeWithSigners.getSigners()
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
