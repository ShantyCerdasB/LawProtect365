/**
 * @fileoverview Use case for listing envelopes for an authenticated user with pagination and signers.
 * @description Validates pagination input, queries envelopes by spec, and fetches full signer data
 * for each envelope. Mirrors existing contracts and errors.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';
import { EnvelopeSpec } from '@/domain/types/envelope';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { paginationLimitRequired } from '@lawprotect/shared-ts';

export type ListEnvelopesByUserInput = {
  userId: string;
  filters?: {
    status?: EnvelopeStatus;
    limit?: number;
    cursor?: string;
  };
};

export type ListEnvelopesByUserResult = {
  envelopes: SignatureEnvelope[];
  signers: EnvelopeSigner[][];
  nextCursor?: string;
  totalCount?: number; // preserved for future use if your service starts returning it
};

export class ListEnvelopesByUserUseCase {
  constructor(private readonly signatureEnvelopeService: SignatureEnvelopeService) {}

  async execute(input: ListEnvelopesByUserInput): Promise<ListEnvelopesByUserResult> {
    const { userId, filters = {} } = input;
    const { status, limit, cursor } = filters;

    if (limit === undefined || limit === null) {
      throw paginationLimitRequired('Frontend must provide pagination limit');
    }

    // Build spec (status is already a VO coming from your schema)
    const spec: EnvelopeSpec = {
      createdBy: userId,
      status
    };

    // Page envelopes
    const result = await this.signatureEnvelopeService.listEnvelopes(spec, limit, cursor);

    // Always fetch signers for each envelope
    const signers = await Promise.all(
      result.items.map(env =>
        this.signatureEnvelopeService
          .getEnvelopeWithSigners(env.getId())
          .then(e => e?.getSigners() ?? [])
      )
    );

    return {
      envelopes: result.items,
      signers,
      nextCursor: result.nextCursor
      // totalCount passthrough if your service returns it later
    };
  }
}
