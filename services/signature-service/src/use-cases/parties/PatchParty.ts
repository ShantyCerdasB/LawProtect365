/**
 * @file PatchParty.ts
 * @summary Use case for updating a party record
 * 
 * @description
 * Updates a party record with partial data.
 * Validates envelope and party existence, and applies business rules for updates.
 */

import { ConsentType, PartyStatus } from "@/domain/values/enums";

/**
 * Input parameters for the PatchParty use case
 */
export interface PatchPartyInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party identifier */
  partyId: string;
  /** New name for the party */
  name?: string;
  /** New role for the party */
  role?: ConsentType;
  /** New signing order for sequential signing */
  order?: number;
  /** New status for the party */
  status?: PartyStatus;
  /** Optional metadata updates */
  metadata?: Record<string, unknown>;
  /** Optional notification preferences updates */
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
 * Output result of the PatchParty use case
 */
export interface PatchPartyOutput {
  /** Party identifier */
  partyId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Party email address */
  email: string;
  /** Party full name */
  name: string;
  /** Party role in the envelope */
  role: ConsentType;
  /** Optional signing order for sequential signing */
  order?: number;
  /** Current status of the party */
  status: PartyStatus;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional notification preferences */
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
}

/**
 * Context dependencies for the PatchParty use case
 */
export interface PatchPartyContext {
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
      name: string;
      role: string;
      order?: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      metadata?: Record<string, unknown>;
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
      };
    } | null>;
    update(id: string, input: {
      name?: string;
      role?: string;
      order?: number;
      status?: string;
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
      updatedAt: string;
      metadata?: Record<string, unknown>;
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
      };
    }>;
  };
}

/**
 * Updates a party record with partial data
 * 
 * @param input - Input parameters including party ID and update data
 * @param context - Repository dependencies
 * @returns Promise resolving to updated party record
 * 
 * @example
 * ```typescript
 * const result = await patchParty(
 *   {
 *     tenantId: "tenant-123",
 *     envelopeId: "env-456",
 *     partyId: "party-789",
 *     name: "Updated Name",
 *     role: "signer"
 *   },
 *   { envelopes, parties }
 * );
 * ```
 */
export async function patchParty(
  input: PatchPartyInput,
  context: PatchPartyContext
): Promise<PatchPartyOutput | null> {
  const { tenantId, envelopeId, partyId, name, role, order, status, metadata, notificationPreferences, actor } = input;
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

  // Check if envelope is in a state that allows party updates
  if (envelope.status === "completed" || envelope.status === "cancelled") {
    throw new Error("Cannot update parties for envelope in completed or cancelled status");
  }

  // Check if party has already signed and we're trying to change critical fields
  if (existingParty.status === "signed" && (role || order)) {
    throw new Error("Cannot change role or order for party that has already signed");
  }

  // Prepare update data
  const updateData: {
    name?: string;
    role?: string;
    order?: number;
    status?: string;
    metadata?: Record<string, unknown>;
    notificationPreferences?: {
      email: boolean;
      sms: boolean;
    };
  } = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (role !== undefined) {
    updateData.role = role;
  }

  if (order !== undefined) {
    updateData.order = order;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  if (metadata !== undefined) {
    updateData.metadata = metadata;
  }

  if (notificationPreferences !== undefined) {
    updateData.notificationPreferences = notificationPreferences;
  }

  // Update party record
  const updatedParty = await parties.update(partyId, updateData);

  return {
    partyId: updatedParty.partyId,
    envelopeId: updatedParty.envelopeId,
    email: updatedParty.email,
    name: updatedParty.name,
    role: updatedParty.role as ConsentType,
    order: updatedParty.order,
    status: updatedParty.status as PartyStatus,
    createdAt: updatedParty.createdAt,
    updatedAt: updatedParty.updatedAt,
    metadata: updatedParty.metadata,
    notificationPreferences: updatedParty.notificationPreferences,
  };
}



