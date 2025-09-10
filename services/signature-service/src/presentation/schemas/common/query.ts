/**
 * @file Query.ts
 * @summary Reusable Zod schemas for common query strings.
 */

import { ENVELOPE_STATUSES } from "@/domain/values/enums";
import { z, ISODateStringSchema, paginationQuerySchema } from "@lawprotect/shared-ts";

/**
 * Standard pagination (?limit, ?cursor).
 * You can parametrize `paginationQuerySchema(max)` if needed.
 */
export const PaginationQuery = paginationQuerySchema(100);
export type PaginationQuery = z.infer<typeof PaginationQuery>;

/**
 * Envelope list filters. Keep statuses aligned with your domain.
 * If your domain has a canonical enum, import it instead.
 */
export const EnvelopeStatus = z.enum(ENVELOPE_STATUSES);

export const ListEnvelopesQuery = z
  .object({
    status: z.array(EnvelopeStatus).optional(),     // ?status=draft&status=sent
    from: ISODateStringSchema.optional(),                 // ISO lower bound
    to: ISODateStringSchema.optional(),                   // ISO upper bound
  })
  .and(PaginationQuery);
export type ListEnvelopesQuery = z.infer<typeof ListEnvelopesQuery>;

/** Audit trail format/localization. */
export const AuditTrailQuery = z.object({
  format: z.enum(["json", "pdf"]).default("json"),
  locale: z.string().min(2).max(10).optional()});
export type AuditTrailQuery = z.infer<typeof AuditTrailQuery>;

/** Page preview rendering hints for thumbnails. */
export const PageRenderQuery = z.object({
  w: z.coerce.number().int().positive().max(4000).optional(),
  h: z.coerce.number().int().positive().max(4000).optional(),
  quality: z.coerce.number().int().min(1).max(100).optional()});
export type PageRenderQuery = z.infer<typeof PageRenderQuery>;

