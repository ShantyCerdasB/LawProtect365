/**
 * @fileoverview CreateEnvelopeUseCase - Use case for creating new signature envelopes
 * @summary Handles envelope creation with ID generation and service delegation
 * @description This use case manages the creation of new signature envelopes by generating
 * a unique envelope ID, injecting it into the creation data, and delegating the actual
 * creation process to the SignatureEnvelopeService. It ensures proper ID generation and
 * maintains the separation of concerns between orchestration and business logic.
 */

import { v4 as uuid } from 'uuid';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { CreateEnvelopeData } from '@/domain/types/envelope/CreateEnvelopeData';
import { CreateEnvelopeRequest, CreateEnvelopeResult } from '@/domain/types/orchestrator';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeHashService } from '@/services/envelopeHashService/EnvelopeHashService';
import { S3Service } from '@/services/S3Service';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EntityFactory } from '@/domain/factories/EntityFactory';
import { sha256Hex } from '@lawprotect/shared-ts';
import { createEnvelopeCreatedAudit } from '../utils/audit/envelopeAuditHelpers';
export class CreateEnvelopeUseCase {
  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly envelopeHashService: EnvelopeHashService,
    private readonly s3Service: S3Service,
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Creates a new signature envelope with generated ID and delegates to service
   * @param input - The creation request containing envelope data and user identifier
   * @returns Promise that resolves to the created envelope and empty signers array
   * @throws Error when envelope creation fails or service returns error
   * @example
   * const result = await useCase.execute({
   *   envelopeData: { title: 'Contract', ... },
   *   userId: 'user-123'
   * });
   */
  async execute(input: CreateEnvelopeRequest): Promise<CreateEnvelopeResult> {
    const envelopeId = EntityFactory.createValueObjects.envelopeId(uuid());
    const envelopeDataWithId: CreateEnvelopeData = {
      ...input.envelopeData,
      id: envelopeId
    };

    const envelope: SignatureEnvelope = await this.envelopeCrudService.createEnvelope(
      envelopeDataWithId
    );

    await this.auditEventService.create(createEnvelopeCreatedAudit(envelope, input.userId));

    if (input.envelopeData.sourceKey) {
      const sourceDocumentContent = await this.s3Service.getDocumentContent(input.envelopeData.sourceKey);
      const sourceHash = sha256Hex(sourceDocumentContent);
      
      await this.envelopeHashService.updateHashes(
        envelope.getId(),
        { sourceSha256: sourceHash },
        input.userId
      );
    }

    return { envelope, signers: [] };
  }
}
