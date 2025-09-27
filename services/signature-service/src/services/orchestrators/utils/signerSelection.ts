import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';

/**
 * Selects target signers given external signers and options.
 * @param externalSigners External signers available for delivery.
 * @param options Options to send to all or restrict by signer id.
 * @returns Target signer list.
 */
export function selectTargetSigners(
  externalSigners: EnvelopeSigner[],
  options?: { sendToAll?: boolean; signers?: Array<{ signerId: string }> }
) {
  if (options?.sendToAll) return externalSigners;
  const ids = new Set((options?.signers ?? []).map(s => s.signerId));
  return externalSigners.filter(s => ids.has(s.getId().getValue()));
}


/**
 * Filters a list of signers by signerId strings.
 * @param signers Available signers.
 * @param signerIds Signer ids to include.
 */
export function filterSignersByIds(
  signers: EnvelopeSigner[],
  signerIds: string[]
): EnvelopeSigner[] {
  const ids = new Set(signerIds);
  return signers.filter(s => ids.has(s.getId().getValue()));
}
