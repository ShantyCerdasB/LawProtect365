/**
 * @fileoverview mapAddSigners - Utility for mapping signer data with orchestration fields
 * @summary Maps addSigners payload to creation DTO for signer service
 * @description This utility function transforms raw signer data from API requests into
 * the structured format required by the signer service, adding necessary orchestration
 * fields like envelopeId, participantRole, and invitedByUserId while preserving all
 * original signer properties.
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { ParticipantRole } from '@prisma/client';

/**
 * Mapped signer type that extends the original signer data with required orchestration fields
 * @template T - The original signer data type
 */
export type MappedSigner<T extends Record<string, unknown> = Record<string, unknown>> =
  T & {
    envelopeId: EnvelopeId;
    participantRole: ParticipantRole;
    invitedByUserId: string;
  };

/**
 * Maps addSigners payload to the creation DTO for the signer service
 * @param addSigners - Array of signer data to map (can be undefined or empty)
 * @param envelopeId - The envelope ID to associate with all signers
 * @param userId - The user ID of the person inviting the signers
 * @returns Array of mapped signers with orchestration fields added
 * @example
 * const signers = [
 *   { email: 'signer1@example.com', fullName: 'John Doe' },
 *   { email: 'signer2@example.com', fullName: 'Jane Smith' }
 * ];
 * const mapped = mapAddSigners(signers, envelopeId, 'user123');
 * // Returns: [
 * //   { email: 'signer1@example.com', fullName: 'John Doe', envelopeId, participantRole: 'SIGNER', invitedByUserId: 'user123' },
 * //   { email: 'signer2@example.com', fullName: 'Jane Smith', envelopeId, participantRole: 'SIGNER', invitedByUserId: 'user123' }
 * // ]
 */
export function mapAddSigners<T extends Record<string, unknown>>(
  addSigners: readonly T[] | undefined,
  envelopeId: EnvelopeId,
  userId: string
): MappedSigner<T>[] {
  if (!addSigners?.length) return [];
  return addSigners.map((signer) => ({
    ...(signer as T),
    envelopeId,
    participantRole: ParticipantRole.SIGNER,
    invitedByUserId: userId,
  }));
}