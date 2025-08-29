/**
 * @file AddParty.ts
 * @summary Use case for adding a party to an envelope
 * 
 * @description
 * Adds a new party to an envelope with proper validation and lifecycle management.
 * Validates envelope existence, party uniqueness, and role constraints.
 */

import { ConsentType, PartyRole, PartyStatus } from "@/domain/values/enums";

/**
 * Input parameters for the AddParty use case
 */
export interface AddPartyInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party email address */
  email: string;
  /** Party full name */
  name: string;
  /** Party role in the envelope */
  role: PartyRole;
  /** Optional signing order for sequential signing */
  order?: number;
  /** Optional metadata for the party */
  metadata?: Record<string, unknown>;
  /** Notification preferences */
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
  /** Actor performing the action */
  actor?: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * Output result of the AddParty use case
 */
export interface AddPartyOutput {
  /** Generated party identifier */
  partyId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party email address */
  email: string;
  /** Party full name */
  name: string;
  /** Party role */
  role: PartyRole;
  /** Signing order */
  order?: number;
  /** Current status of the party */
  status: PartyStatus;
  /** Creation timestamp */
  createdAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Notification preferences */
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
}

/**
 * Context dependencies for the AddParty use case
 */
export interface AddPartyContext {
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
    create(input: {
      tenantId: string;
      envelopeId: string;
      email: string;
      name: string;
      role: PartyRole;
      order?: number;
      metadata?: Record<string, unknown>;
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
      };
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
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
      };
    }>;
    listByEnvelope(input: {
      tenantId: string;
      envelopeId: string;
    }): Promise<Array<{
      partyId: string;
      email: string;
      role: string;
      order?: number;
    }>>;
  };
  /** ID generator for new party records */
  ids: {
    ulid(): string;
  };
}

/**
 * Adds a party to an envelope
 * 
 * @param input - Input parameters including party details and envelope ID
 * @param context - Repository dependencies and utilities
 * @returns Promise resolving to created party record
 * 
 * @example
 * ```typescript
 * const result = await addParty(
 *   {
 *     tenantId: "tenant-123",
 *     envelopeId: "env-456",
 *     email: "john@example.com",
 *     name: "John Doe",
 *     role: "signer"
 *   },
 *   { envelopes, parties, ids }
 * );
 * ```
 */
export async function addParty(
  input: AddPartyInput,
  context: AddPartyContext
): Promise<AddPartyOutput> {
  const { tenantId, envelopeId, email, name, role, order, metadata, notificationPreferences, actor } = input;
  const { envelopes, parties, ids } = context;

  // Verify envelope exists and belongs to tenant
  const envelope = await envelopes.getById(envelopeId);
  if (!envelope || envelope.tenantId !== tenantId) {
    throw new Error("Envelope not found or access denied");
  }

  // Check if envelope is in a state that allows adding parties
  if (envelope.status !== "draft") {
    throw new Error("Cannot add parties to envelope that is not in draft status");
  }

  // Check if party with this email already exists in the envelope
  const existingParties = await parties.listByEnvelope({ tenantId, envelopeId });
  const existingParty = existingParties.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (existingParty) {
    throw new Error("Party with this email already exists in the envelope");
  }

  // Validate order for signers (must be unique and sequential)
  if (role === "signer" && order !== undefined) {
    const existingSigners = existingParties.filter(p => p.role === "signer");
    const orderExists = existingSigners.some(p => p.order === order);
    if (orderExists) {
      throw new Error("Signing order already exists");
    }
  }

  // Create party record
  const party = await parties.create({
    tenantId,
    envelopeId,
    email,
    name,
    role,
    order,
    metadata,
    notificationPreferences,
  });

  return {
    partyId: party.partyId,
    envelopeId: party.envelopeId,
    email: party.email,
    name: party.name,
    role: party.role as PartyRole,
    order: party.order,
    status: party.status as PartyStatus,
    createdAt: party.createdAt,
    metadata: party.metadata,
    notificationPreferences: party.notificationPreferences,
  };
}


