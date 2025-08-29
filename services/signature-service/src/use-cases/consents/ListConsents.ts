/**
 * @file ListConsents.ts
 * @summary Use case: list consents for an envelope with filters & pagination.
 *
 * Verifies the envelope exists and belongs to the tenant (multi-tenant guard),
 * then delegates the listing to the read-only ConsentsQueryPort. Returns a
 * domain-shaped page `{ items, meta }`.
 */

import type { EnvelopesPort } from "@/domain/ports/envelopes";
import type {
  ConsentsQueryPort,
  ListByEnvelopeOutput,
  ConsentStatus,
  ConsentType,
} from "@/domain/ports/consent";
import { ensureEnvelopeAccess } from "@/use-cases/shared/guards/consent.guard";
import type {
  TenantScoped,
  EnvelopeScoped,
  WithPagination,
} from "@/use-cases/shared/types/types";

/** Parse a positive integer from env, falling back to a default. */
const envInt = (name: string, fallback: number): number => {
  const v = Number(process.env[name as keyof typeof process.env]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

/**
 * Defaults can be tuned via environment variables without changing code.
 * - CONSENTS_LIST_DEFAULT_LIMIT
 * - CONSENTS_LIST_MAX_LIMIT
 */
const DEFAULT_LIMIT = envInt("CONSENTS_LIST_DEFAULT_LIMIT", 50);
const MAX_LIMIT = envInt("CONSENTS_LIST_MAX_LIMIT", 100);

/**
 * Input for listing consents within an envelope.
 * Reuses common mixins to avoid duplication.
 */
export interface ListConsentsInput
  extends TenantScoped,
    EnvelopeScoped,
    WithPagination {
  /** Optional status filter. */
  status?: ConsentStatus; // "pending" | "granted" | "revoked" | "denied"
  /** Optional consent type filter. */
  consentType?: ConsentType; // "signature" | "view" | "delegate"
  /** Optional party filter. */
  partyId?: string;
}

/** Dependencies required by the use case. */
export interface ListConsentsContext {
  envelopes: EnvelopesPort;
  consents: ConsentsQueryPort;
}

/**
 * Lists consents for an envelope with optional filters.
 *
 * @param input - {@link ListConsentsInput} filters and pagination.
 * @param ctx - {@link ListConsentsContext} ports (envelopes + consents query).
 * @returns A promise that resolves to {@link ListByEnvelopeOutput}.
 *
 * @throws NotFoundError - If the envelope does not exist or belongs to another tenant.
 */
export async function listConsents(
  input: ListConsentsInput,
  ctx: ListConsentsContext
): Promise<ListByEnvelopeOutput> {
  const {
    tenantId,
    envelopeId,
    limit = DEFAULT_LIMIT,
    cursor,
    status,
    consentType,
    partyId,
  } = input;
  const { envelopes, consents } = ctx;

  // 1) Multi-tenant guard: must exist and belong to tenant
  await ensureEnvelopeAccess(envelopes, tenantId, envelopeId);

  // 2) Delegate listing to the query port (no tenantId needed here)
  const page = await consents.listByEnvelope({
    envelopeId,
    limit: Math.min(limit, MAX_LIMIT),
    cursor,
    status,
    consentType,
    partyId,
  });

  // 3) Return domain-shaped output (items + meta)
  return page;
}

