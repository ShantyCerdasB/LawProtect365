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
import { TenantIdSchema, EnvelopeIdSchema } from "../ids";

/** @description Branded identifier for audit events */
export type AuditEventId = Brand<string, "AuditEventId">;

/** @description Validator for `AuditEventId` (ULID ? brand) */
export const AuditEventIdSchema = Ulid.transform((v) => v as AuditEventId);

/**
 * @description Minimal immutable audit event persisted in the store.
 * Adapters may enrich with chain-link fields (`prevHash`, `hash`).
 * Contains all necessary information for audit trail tracking and tamper detection.
 */
export const AuditEventSchema = z.object({
  /** Unique audit event identifier */
  id: AuditEventIdSchema,
  /** Tenant identifier */
  tenantId: TenantIdSchema,
  /** Envelope identifier */
  envelopeId: EnvelopeIdSchema,
  /** Event type (e.g., "envelope.created") */
  type: TrimmedString,
  /** Event occurrence timestamp (ISO datetime with offset) */
  occurredAt: z.string().datetime({ offset: true }),

  /** Actor information for attribution */
  actor: z
    .object({
      /** User identifier */
      userId: TrimmedString.optional(),
      /** User email address */
      email: TrimmedString.optional(),
      /** Client IP address */
      ip: TrimmedString.optional(),
      /** User agent string */
      userAgent: TrimmedString.optional(),
      /** User role */
      role: TrimmedString.optional(),
      /** User locale preference */
      locale: TrimmedString.optional(),
    })
    .optional(),

  /** Optional metadata for additional context */
  metadata: z.record(z.any()).optional(),

  /** Hash-chain (previous link) for tamper detection */
  prevHash: TrimmedString.optional(),
  /** Event payload hash (current link) for integrity verification */
  hash: TrimmedString.optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;



