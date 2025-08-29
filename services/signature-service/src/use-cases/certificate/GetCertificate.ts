/**
 * @file GetCertificate.ts
 * @summary Use case for retrieving certificate/audit trail of an envelope
 * 
 * @description
 * Retrieves the certificate and audit trail for a given envelope.
 * Validates the envelope exists and returns events in ascending order with chain validation.
 */

/**
 * Input parameters for the GetCertificate use case
 */
export interface GetCertificateInput {
  /** Tenant identifier for multi-tenancy boundary */
  tenantId: string;
  /** Envelope identifier to retrieve certificate for */
  envelopeId: string;
  /** Maximum number of events to return */
  limit?: number;
  /** Pagination cursor for forward-only pagination */
  cursor?: string;
}

/**
 * Output result of the GetCertificate use case
 */
export interface GetCertificateOutput {
  /** Envelope identifier */
  envelopeId: string;
  /** Current status of the envelope */
  status: "draft" | "sent" | "completed" | "cancelled" | "declined";
  /** Array of audit events in ascending order */
  events: Array<{
    id: string;
    occurredAt: string; // ISO
    type: string;
    actor?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    prevHash?: string;
    hash?: string;
  }>;
  /** Whether the hash chain is valid */
  chainValid: boolean;
  /** Next cursor for pagination */
  nextCursor?: string;
}

/**
 * Context dependencies for the GetCertificate use case
 */
export interface GetCertificateContext {
  /** Repository for envelope operations */
  envelopes: {
    getById(id: string): Promise<{
      envelopeId: string;
      tenantId: string;
      status: string;
    } | null>;
  };
  /** Repository for audit operations */
  audit: {
    listByEnvelope(input: {
      tenantId: string;
      envelopeId: string;
      limit: number;
      cursor?: string;
    }): Promise<{
      items: Array<{
        id: string;
        occurredAt: string;
        type: string;
        actor?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
        prevHash?: string;
        hash?: string;
      }>;
      meta: { limit: number; nextCursor?: string };
    }>;
  };
}

/**
 * Retrieves the certificate and audit trail for an envelope
 * 
 * @param input - Input parameters including tenant and envelope IDs
 * @param context - Repository dependencies
 * @returns Promise resolving to certificate data with events and chain validation
 * 
 * @example
 * ```typescript
 * const result = await getCertificate(
 *   { tenantId: "tenant-123", envelopeId: "env-456", limit: 50 },
 *   { envelopes: envelopeRepo, audit: auditRepo }
 * );
 * ```
 */
export async function getCertificate(
  input: GetCertificateInput,
  context: GetCertificateContext
): Promise<GetCertificateOutput | null> {
  const { tenantId, envelopeId, limit = 50, cursor } = input;
  const { envelopes, audit } = context;

  // Load envelope to verify it exists and get status
  const envelope = await envelopes.getById(envelopeId);
  if (!envelope) {
    return null; // Envelope not found
  }

  // List audit events in ascending order
  const auditResult = await audit.listByEnvelope({
    tenantId,
    envelopeId,
    limit: Math.min(limit, 100), // Cap at 100 for performance
    cursor,
  });

  // Validate hash chain
  let chainValid = true;
  let previousHash: string | undefined;

  for (const event of auditResult.items) {
    if (event.prevHash && previousHash && event.prevHash !== previousHash) {
      chainValid = false;
      break;
    }
    previousHash = event.hash;
  }

  // Transform events to response format
  const events = auditResult.items.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt,
    type: event.type,
    actor: event.actor,
    metadata: event.metadata,
    prevHash: event.prevHash,
    hash: event.hash,
  }));

  return {
    envelopeId: String(envelopeId),
    status: envelope.status as "draft" | "sent" | "completed" | "cancelled" | "declined",
    events,
    chainValid,
    nextCursor: auditResult.meta.nextCursor,
  };
}
