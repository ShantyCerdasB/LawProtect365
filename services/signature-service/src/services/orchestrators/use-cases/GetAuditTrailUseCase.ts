/**
 * @fileoverview GetAuditTrailUseCase - Use case for retrieving complete audit trails from envelopes
 * @summary Handles audit trail retrieval with access validation and event mapping
 * @description This use case manages the retrieval of complete audit trails for signature envelopes,
 * including envelope existence validation, ownership verification, audit event fetching,
 * and mapping to frontend-friendly DTOs. It ensures proper access control and provides
 * comprehensive audit information for compliance and tracking purposes.
 */

import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeAccessValidationRule } from '@/domain/rules/EnvelopeAccessValidationRule';
import { envelopeNotFound } from '@/signature-errors';
import { rethrow } from '@lawprotect/shared-ts';
import { GetAuditTrailInput, GetAuditTrailResult } from '@/domain/types/usecase/orchestrator/GetAuditTrailUseCase';

export class GetAuditTrailUseCase {
  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly signatureAuditEventService: AuditEventService
  ) {}

  /**
   * Retrieves the complete audit trail for an envelope with access validation
   * @param input - The audit trail request containing envelope ID and user identifier
   * @returns Promise that resolves to the audit trail with mapped events
   * @throws NotFoundError when envelope is not found
   * @throws AccessDeniedError when user lacks permission to access the envelope
   * @throws BadRequestError when audit events cannot be retrieved
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   userId: 'user-456'
   * });
   */
  async execute(input: GetAuditTrailInput): Promise<GetAuditTrailResult> {
    const { envelopeId, userId } = input;

    try {
      // 1) Existence + ownership
      const envelope = await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      // 2) Fetch events
      const events = await this.signatureAuditEventService.getByEnvelope(envelopeId.getValue());

      // 3) Map to DTO
      const mapped = events.map((ev: any) => ({
        id: ev.getId().getValue(),
        eventType: ev.getEventType(),
        description: ev.getDescription(),
        userEmail: ev.getUserEmail(),
        userName: ev.getUserEmail(),
        createdAt: ev.getCreatedAt(),
        metadata: ev.getMetadata()
      }));

      return {
        envelopeId: envelopeId.getValue(),
        events: mapped
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
