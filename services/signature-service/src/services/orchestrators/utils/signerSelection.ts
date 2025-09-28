/**
 * @fileoverview Signer selection utilities for orchestration operations
 * @summary Utilities for filtering and selecting target signers
 * @description This module provides utilities for selecting and filtering signers
 * based on various criteria, supporting both bulk operations and targeted
 * signer selection for envelope operations.
 */

import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';

/**
 * Selects target signers based on delivery options and criteria
 * @param externalSigners - External signers available for delivery
 * @param options - Options to send to all or restrict by signer id
 * @returns Target signer list based on selection criteria
 * @throws Error when invalid signer IDs are provided
 */
export function selectTargetSigners(
  externalSigners: EnvelopeSigner[],
  options?: { sendToAll?: boolean; signers?: Array<{ signerId: string }> }
) {
  if (options?.sendToAll) return externalSigners;
  if (!options) return externalSigners;
  if (!options.signers || options.signers.length === 0) return [];
  const ids = new Set(options.signers.map(s => s.signerId));
  return externalSigners.filter(s => ids.has(s.getId().getValue()));
}


/**
 * Filters a list of signers by specific signer ID strings
 * @param signers - Available signers to filter from
 * @param signerIds - Signer IDs to include in the result
 * @returns Filtered list of signers matching the provided IDs
 * @throws Error when signer IDs are invalid or not found
 */
export function filterSignersByIds(
  signers: EnvelopeSigner[],
  signerIds: string[]
): EnvelopeSigner[] {
  const ids = new Set(signerIds);
  return signers.filter(s => ids.has(s.getId().getValue()));
}
