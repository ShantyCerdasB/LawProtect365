/**
 * @file DeleteParty.ts
 * @summary Use case for deleting a party record
 * 
 * @description
 * Deletes a party record from an envelope.
 * Validates envelope and party existence, and applies business rules for deletion.
 */

/**
 * Input parameters for the DeleteParty use case
 */
export interface DeletePartyInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party identifier */
  partyId: string;
  /** Actor performing the action */
  actor?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * Output result of the DeleteParty use case
 */
export interface DeletePartyOutput {
  /** Party identifier */
  partyId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Deletion timestamp */
  deletedAt: string;
}

/**
 * Context dependencies for the DeleteParty use case
 */
export interface DeletePartyContext {
  /** Repository for envelope operations */
  envelopes: {
    getById(id: string): Promise<{
      envelopeId: string;
      tenantId: string;
      status: string;
    } | null>;
  };
  /** Repository for party operations */
  parties: {
    getById(id: string): Promise<{
      partyId: string;
      envelopeId: string;
      role: string;
      status: string;
    } | null>;
    delete(id: string): Promise<void>;
    countByEnvelope(envelopeId: string): Promise<number>;
  };
}

/**
 * Deletes a party record from an envelope
 * 
 * @param input - Input parameters including party ID
 * @param context - Repository dependencies
 * @returns Promise resolving to deletion confirmation
 * 
 * @example
 * ```typescript
 * const result = await deleteParty(
 *   {
 *     tenantId: "tenant-123",
 *     envelopeId: "env-456",
 *     partyId: "party-789"
 *   },
 *   { envelopes, parties }
 * );
 * ```
 */
export async function deleteParty(
  input: DeletePartyInput,
  context: DeletePartyContext
): Promise<DeletePartyOutput | null> {
  const { tenantId, envelopeId, partyId, actor } = input;
  const { envelopes, parties } = context;

  // Verify envelope exists and belongs to tenant
  const envelope = await envelopes.getById(envelopeId);
  if (!envelope || envelope.tenantId !== tenantId) {
    return null; // Envelope not found or access denied
  }

  // Verify party exists and belongs to envelope
  const existingParty = await parties.getById(partyId);
  if (!existingParty || existingParty.envelopeId !== envelopeId) {
    return null; // Party not found or does not belong to envelope
  }

  // Check if envelope is in a state that allows party deletion
  if (envelope.status === "completed" || envelope.status === "cancelled") {
    throw new Error("Cannot delete parties for envelope in completed or cancelled status");
  }

  // Check if party has already signed
  if (existingParty.status === "signed") {
    throw new Error("Cannot delete party that has already signed");
  }

  // Check if this is the last party and would leave envelope without parties
  const partyCount = await parties.countByEnvelope(envelopeId);
  if (partyCount <= 1) {
    throw new Error("Cannot delete the last party from an envelope");
  }

  // Check if this is the last signer and would leave envelope without signers
  if (existingParty.role === "signer") {
    // This would require additional logic to check if there are other signers
    // For now, we'll allow deletion but this should be enhanced
  }

  // Delete party record
  await parties.delete(partyId);

  return {
    partyId,
    envelopeId,
    deletedAt: new Date().toISOString(),
  };
}


