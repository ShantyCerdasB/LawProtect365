/**
 * @fileoverview CancelEnvelopeUseCase - Use case for cancelling signature envelopes
 * @summary Handles envelope cancellation and notification dispatch
 * @description This use case manages the cancellation of signature envelopes, including
 * business logic validation, envelope status updates, and asynchronous notification
 * dispatch to interested parties. It ensures proper error handling and maintains
 * audit trails for cancellation events.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { NetworkSecurityContext, fireAndForget, rethrow } from '@lawprotect/shared-ts';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeNotificationService } from '@/services/notification/EnvelopeNotificationService';
export class CancelEnvelopeUseCase {
  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  /**
   * Cancels an envelope. Notification is dispatched as fire-and-forget.
   * @param input.envelopeId Envelope identifier.
   * @param input.userId Initiating user identifier.
   * @param input.securityContext Network context for auditing/notifications.
   * @returns The cancelled envelope.
   */
  async execute(input: {
    envelopeId: EnvelopeId;
    userId: string;
    securityContext: NetworkSecurityContext;
  }): Promise<{ envelope: SignatureEnvelope }> {
    const { envelopeId, userId, securityContext } = input;

    try {
      const envelope = await this.envelopeCrudService.cancelEnvelope(envelopeId, userId);

      fireAndForget((async () => {
        const env = await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
        if (env) {
          await this.envelopeNotificationService.publishEnvelopeCancelled(env, userId, securityContext);
        }
      })());

      return { envelope };
    } catch (error) {
      rethrow(error);
    }
  }
}
