import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';

export type MappedSigner<T extends Record<string, unknown> = Record<string, unknown>> =
  T & {
    envelopeId: EnvelopeId;
    participantRole: 'SIGNER';
    invitedByUserId: string;
  };

/**
 * Maps addSigners payload to the creation DTO for the signer service.
 * Preserves all original signer fields and adds required orchestration fields.
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
    participantRole: 'SIGNER' as const,
    invitedByUserId: userId,
  }));
}
