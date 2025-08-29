/**
 * @file ListParties.ts
 * @summary Use case for listing parties of an envelope
 * 
 * @description
 * Lists parties for a given envelope with pagination and filtering capabilities.
 * Validates envelope existence and applies tenant boundary checks.
 */

import { ConsentType, PartyStatus } from "@/domain/values/enums";

/**
 * Input parameters for the ListParties use case
 */
export interface ListPartiesInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier */
  envelopeId: string;
  /** Maximum number of parties to return */
  limit?: number;
  /** Pagination cursor for forward-only pagination */
  cursor?: string;
  /** Optional role filter */
  role?: ConsentType;
  /** Optional status filter */
  status?: PartyStatus;
  /** Optional email filter */
  email?: string;
}

/**
 * Output result of the ListParties use case
 */
export interface ListPartiesOutput {
  /** Array of party records */
  parties: Array<{
    partyId: string;
    envelopeId: string;
    email: string;
    name: string;
    role: ConsentType;
    order?: number;
    status: PartyStatus;
    createdAt: string;
    metadata?: Record<string, unknown>;
    notificationPreferences?: {
      email: boolean;
      sms: boolean;
    };
  }>;
  /** Pagination metadata */
  meta: {
    limit: number;
    nextCursor?: string;
    total?: number;
  };
}

/**
 * Context dependencies for the ListParties use case
 */
export interface ListPartiesContext {
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
    listByEnvelope(input: {
      tenantId: string;
      envelopeId: string;
      limit: number;
      cursor?: string;
      role?: string;
      status?: string;
      email?: string;
    }): Promise<{
      items: Array<{
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
      meta: {
        limit: number;
        nextCursor?: string;
        total?: number;
      };
    }>;
  };
}

/**
 * Lists parties for an envelope with pagination and filtering
 * 
 * @param input - Input parameters including envelope ID and filtering options
 * @param context - Repository dependencies
 * @returns Promise resolving to party list with pagination metadata
 * 
 * @example
 * ```typescript
 * const result = await listParties(
 *   {
 *     tenantId: "tenant-123",
 *     envelopeId: "env-456",
 *     limit: 50,
 *     role: "signer"
 *   },
 *   { envelopes, parties }
 * );
 * ```
 */
export async function listParties(
  input: ListPartiesInput,
  context: ListPartiesContext
): Promise<ListPartiesOutput | null> {
  const { tenantId, envelopeId, limit = 50, cursor, role, status, email } = input;
  const { envelopes, parties } = context;

  // Verify envelope exists and belongs to tenant
  const envelope = await envelopes.getById(envelopeId);
  if (!envelope || envelope.tenantId !== tenantId) {
    return null; // Envelope not found or access denied
  }

  // List parties with filters
  const result = await parties.listByEnvelope({
    tenantId,
    envelopeId,
    limit: Math.min(limit, 100), // Cap at 100 for performance
    cursor,
    role,
    status,
    email,
  });

  // Transform parties to response format
  const transformedParties = result.items.map((party) => ({
    partyId: party.partyId,
    envelopeId: party.envelopeId,
    email: party.email,
    name: party.name,
    role: party.role as ConsentType,
    order: party.order,
    status: party.status as PartyStatus,
    createdAt: party.createdAt,
    metadata: party.metadata,
    notificationPreferences: party.notificationPreferences,
  }));

  return {
    parties: transformedParties,
    meta: result.meta,
  };
}


