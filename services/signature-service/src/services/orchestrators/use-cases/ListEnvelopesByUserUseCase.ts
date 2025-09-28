/**
 * @fileoverview ListEnvelopesByUserUseCase - Use case for listing user envelopes with pagination
 * @summary Handles envelope listing with pagination and signer data fetching
 * @description This use case manages the listing of signature envelopes for authenticated users,
 * including pagination validation, envelope filtering by status, signer data fetching,
 * and cursor-based pagination. It ensures proper data retrieval and maintains
 * consistent pagination patterns for envelope management operations.
 */

import { EnvelopeSpec } from '@/domain/types/envelope';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { paginationLimitRequired } from '@lawprotect/shared-ts';
import { ListEnvelopesByUserInput, ListEnvelopesByUserResult } from '@/domain/types/usecase/orchestrator/ListEnvelopesByUserUseCase';

export class ListEnvelopesByUserUseCase {
  constructor(private readonly envelopeCrudService: EnvelopeCrudService) {}

  /**
   * Lists envelopes for a user with pagination and signer data
   * @param input - The listing request containing user ID and optional filters
   * @returns Promise that resolves to the paginated envelope list with signers
   * @throws BadRequestError when pagination limit is not provided
   * @throws NotFoundError when user has no envelopes
   * @throws BadRequestError when envelope retrieval fails
   * @example
   * const result = await useCase.execute({
   *   userId: 'user-123',
   *   filters: { status: EnvelopeStatus.DRAFT, limit: 10, cursor: 'cursor-456' }
   * });
   */
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
    const result = await this.envelopeCrudService.listEnvelopes(spec, limit, cursor);

    // Always fetch signers for each envelope
    const signers = await Promise.all(
      result.items.map(env =>
        this.envelopeCrudService
          .getEnvelopeWithSigners(env.getId())
          .then(e => e?.getSigners() ?? [])
      )
    );

    return {
      envelopes: result.items,
      signers,
      nextCursor: result.nextCursor
    };
  }
}
