import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { S3Service } from '@/services/S3Service';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { UpdateEnvelopeData } from '@/domain/rules/EnvelopeUpdateValidationRule';
import { envelopeNotFound } from '@/signature-errors';
import { rethrow } from '@lawprotect/shared-ts';
import { EntityFactory } from '@/domain/factories/EntityFactory';
import { mapAddSigners } from '@/services/orchestrators/utils/mapAddSigners';
import { EnvelopeSigner } from '@/domain';

type UpdateEnvelopeResult = {
  envelope: SignatureEnvelope;
  signers?: EnvelopeSigner[];
};

/**
 * Use case: update envelope metadata and signer roster.
 */
export class UpdateEnvelopeUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Updates envelope fields, adds/removes signers, and returns updated state.
   * Signers are returned only when there were additions or removals.
   */
  async execute(input: {
    envelopeId: EnvelopeId;
    updateData: UpdateEnvelopeData;
    userId: string;
  }): Promise<UpdateEnvelopeResult> {
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
