/**
 * @fileoverview ListEnvelopesByUserUseCase Types - Input and result types for ListEnvelopesByUserUseCase
 * @summary Type definitions for envelope listing operations
 * @description This module contains the input and result type definitions for the
 * ListEnvelopesByUserUseCase, including request parameters, response structure, and
 * pagination information for envelope listing operations in signature envelopes.
 */

import { SignatureEnvelope } from '../../../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../entities/EnvelopeSigner';
import { EnvelopeStatus } from '../../../value-objects/EnvelopeStatus';

/**
 * Input parameters for listing envelopes by user
 * @param userId - The user identifier requesting the envelope list
 * @param filters - Optional filters for envelope listing
 */
export interface ListEnvelopesByUserInput {
  userId: string;
  filters?: {
    status?: EnvelopeStatus;
    limit?: number;
    cursor?: string;
  };
}

/**
 * Result structure for successful envelope listing operation
 * @param envelopes - Array of envelopes matching the criteria
 * @param signers - Array of signer arrays for each envelope
 * @param nextCursor - Optional cursor for pagination
 * @param totalCount - Optional total count of envelopes
 */
export interface ListEnvelopesByUserResult {
  envelopes: SignatureEnvelope[];
  signers: EnvelopeSigner[][];
  nextCursor?: string;
  totalCount?: number;
}
