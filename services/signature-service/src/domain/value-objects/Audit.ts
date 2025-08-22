/**
 * @file Audit.ts
 * @summary Value objects and schema for immutable audit events.
 *
 * @description
 * Defines the `AuditEvent` payload stored append-only to the audit trail.
 * Events are chained via hashes and time-ordered for tamper-evidence.
 */

import { z, Ulid, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";
import { TenantIdSchema, EnvelopeIdSchema } from "./Ids";

/** Branded identifier for audit events. */
export type AuditEventId = Brand<string, "AuditEventId">;

/** Validator for `AuditEventId` (ULID → brand). */
export const AuditEventIdSchema = Ulid.transform((v) => v as AuditEventId);

/**
 * Minimal immutable audit event persisted in the store.
 * Adapters may enrich with chain-link fields (`prevHash`, `hash`).
 */
export const AuditEventSchema = z.object({
  id: AuditEventIdSchema,
  tenantId: TenantIdSchema,
  envelopeId: EnvelopeIdSchema,
  type: TrimmedString, // e.g., "envelope.created"
  occurredAt: z.string().datetime({ offset: true }),

  actor: z
    .object({
      userId: TrimmedString.optional(),
      email: TrimmedString.optional(),
      ip: TrimmedString.optional(),
      userAgent: TrimmedString.optional(),
      role: TrimmedString.optional(),
      locale: TrimmedString.optional(),
    })
    .optional(),

  metadata: z.record(z.any()).optional(),

  /** Hash-chain (previous link). */
  prevHash: TrimmedString.optional(),
  /** Event payload hash (current link). */
  hash: TrimmedString.optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
