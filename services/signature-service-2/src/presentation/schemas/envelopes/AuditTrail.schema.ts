/**
 * @file AuditTrail.schema.ts
 * @summary Query and response schemas for audit trail retrieval.
 */

import { z } from "@lawprotect/shared-ts";
import { AuditTrailQuery } from "../common/index";

/** Single audit entry. */
export const AuditEntry = z.object({
  at: z.string().datetime(),
  actor: z.string(),
  action: z.string()});
export type AuditEntry = z.infer<typeof AuditEntry>;

/** Response containing audit trail entries. */
export const AuditTrailResponse = z.object({
  envelopeId: z.string(),
  entries: z.array(AuditEntry)});
export type AuditTrailResponse = z.infer<typeof AuditTrailResponse>;

/** Query params for audit trail retrieval. */
export { AuditTrailQuery };

