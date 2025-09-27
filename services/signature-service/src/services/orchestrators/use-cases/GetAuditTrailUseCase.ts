/**
 * @fileoverview Use case for retrieving the complete audit trail for an envelope.
 * @description Validates existence and ownership, fetches audit events, and maps
 * them into a frontend-friendly DTO.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeAccessValidationRule } from '@/domain/rules/EnvelopeAccessValidationRule';
import { envelopeNotFound } from '@/signature-errors';
import { rethrow } from '@lawprotect/shared-ts';
import { AuditEventType } from '@/domain';

export type GetAuditTrailInput = {
  envelopeId: EnvelopeId;
  userId: string;
};

export type GetAuditTrailResult = {
  envelopeId: string;
  events: Array<{
    id: string;
    eventType: AuditEventType;
    description: string;
    userEmail?: string;
    userName?: string;
    createdAt: Date;
    metadata?: Record<string, any>;
  }>;
};

export class GetAuditTrailUseCase {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly signatureAuditEventService: AuditEventService
  ) {}

  async execute(input: GetAuditTrailInput): Promise<GetAuditTrailResult> {
    const { envelopeId, userId } = input;

    try {
      // 1) Existence + ownership
      const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
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
