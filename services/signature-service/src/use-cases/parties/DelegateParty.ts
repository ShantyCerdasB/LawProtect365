/**
 * @file DelegateParty.ts
 * @summary Use case for delegating a party's signing authority
 * 
 * @description
 * Delegates a party's signing authority to another person.
 * Validates envelope and party existence, and applies delegation rules.
 */

/**
 * Input parameters for the DelegateParty use case
 */
export interface DelegatePartyInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party identifier */
  partyId: string;
  /** Email of the delegate */
  delegateEmail: string;
  /** Name of the delegate */
  delegateName: string;
  /** Reason for delegation */
  reason: string;
  /** Optional expiration date for the delegation */
  expiresAt?: string;
  /** Optional metadata for the delegation */
  metadata?: Record<string, unknown>;
  /** Actor performing the action */
  actor?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * Output result of the DelegateParty use case
 */
export interface DelegatePartyOutput {
  /** Generated delegation identifier */
  delegationId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Original party identifier */
  originalPartyId: string;
  /** Delegate party identifier */
  delegatePartyId: string;
  /** Delegate email address */
  delegateEmail: string;
  /** Delegate full name */
  delegateName: string;
  /** Reason for delegation */
  reason: string;
  /** Current status of the delegation */
  status: "pending" | "accepted" | "declined" | "expired";
  /** Creation timestamp */
  createdAt: string;
  /** Optional expiration timestamp */
  expiresAt?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Context dependencies for the DelegateParty use case
 */
export interface DelegatePartyContext {
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
      email: string;
      role: string;
      status: string;
    } | null>;
    create(input: {
      envelopeId: string;
      email: string;
      name: string;
      role: string;
      order?: number;
      metadata?: Record<string, unknown>;
    }): Promise<{
      partyId: string;
      envelopeId: string;
      email: string;
      name: string;
      role: string;
      order?: number;
      status: string;
      createdAt: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  /** Repository for delegation operations */
  delegations: {
    create(input: {
      tenantId: string;
      envelopeId: string;
      originalPartyId: string;
      delegatePartyId: string;
      reason: string;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }): Promise<{
      delegationId: string;
      envelopeId: string;
      originalPartyId: string;
      delegatePartyId: string;
      reason: string;
      status: string;
      createdAt: string;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  /** ID generator for new records */
  ids: {
    ulid(): string;
  };
}

/**
 * Delegates a party's signing authority to another person
 * 
 * @param input - Input parameters including delegation details
 * @param context - Repository dependencies and utilities
 * @returns Promise resolving to created delegation record
 * 
 * @example
 * ```typescript
 * const result = await delegateParty(
 *   {
 *     tenantId: "tenant-123",
 *     envelopeId: "env-456",
 *     partyId: "party-789",
 *     delegateEmail: "delegate@example.com",
 *     delegateName: "John Doe",
 *     reason: "Temporary absence"
 *   },
 *   { envelopes, parties, delegations, ids }
 * );
 * ```
 */
export async function delegateParty(
  input: DelegatePartyInput,
  context: DelegatePartyContext
): Promise<DelegatePartyOutput | null> {
  const { tenantId, envelopeId, partyId, delegateEmail, delegateName, reason, expiresAt, metadata, actor } = input;
  const { envelopes, parties, delegations, ids } = context;

  // Verify envelope exists and belongs to tenant
  const envelope = await envelopes.getById(envelopeId);
  if (!envelope || envelope.tenantId !== tenantId) {
    return null; // Envelope not found or access denied
  }

  // Verify original party exists and belongs to envelope
  const originalParty = await parties.getById(partyId);
  if (!originalParty || originalParty.envelopeId !== envelopeId) {
    return null; // Party not found or does not belong to envelope
  }

  // Check if envelope is in a state that allows delegation
  if (envelope.status === "completed" || envelope.status === "cancelled") {
    throw new Error("Cannot delegate parties for envelope in completed or cancelled status");
  }

  // Check if original party is in a state that allows delegation
  if (originalParty.status === "signed") {
    throw new Error("Cannot delegate party that has already signed");
  }

  // Check if original party is a signer (only signers can be delegated)
  if (originalParty.role !== "signer") {
    throw new Error("Only signers can be delegated");
  }

  // Check if delegate email is different from original party
  if (originalParty.email === delegateEmail) {
    throw new Error("Cannot delegate to the same email address");
  }

  // Create delegate party record
  const delegateParty = await parties.create({
    envelopeId,
    email: delegateEmail,
    name: delegateName,
    role: "delegate",
    metadata: {
      ...metadata,
      originalPartyId: partyId,
      delegationReason: reason,
    },
  });

  // Create delegation record
  const delegation = await delegations.create({
    tenantId,
    envelopeId,
    originalPartyId: partyId,
    delegatePartyId: delegateParty.partyId,
    reason,
    expiresAt,
    metadata,
  });

  return {
    delegationId: delegation.delegationId,
    envelopeId: delegation.envelopeId,
    originalPartyId: delegation.originalPartyId,
    delegatePartyId: delegation.delegatePartyId,
    delegateEmail: delegateParty.email,
    delegateName: delegateParty.name,
    reason: delegation.reason,
    status: delegation.status as "pending" | "accepted" | "declined" | "expired",
    createdAt: delegation.createdAt,
    expiresAt: delegation.expiresAt,
    metadata: delegation.metadata,
  };
}




