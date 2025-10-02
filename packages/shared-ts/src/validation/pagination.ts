import { z } from "zod";
import type { PaginationParams } from "../types/pagination.js";
import type { ApiEvent } from "../http/httpTypes.js";

/**
 * Schema builder for standard pagination query (?limit, ?cursor).
 * @param maxDefault Maximum allowed limit (default 100).
 */
export const paginationQuerySchema = (maxDefault = 100) =>
  z.object({
    limit: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().int().positive().max(maxDefault))
      .default(Math.min(50, maxDefault)),
    cursor: z.string().min(1).optional()
  });

/**
 * Parses and validates pagination params from an API event.
 * @param evt API Gateway event.
 * @param maxDefault Maximum allowed limit (default 100).
 */
export const parsePaginationQuery = (evt: ApiEvent, maxDefault = 100): PaginationParams => {
  const query = Object.fromEntries(Object.entries(evt.queryStringParameters ?? {}));
  const parsed = paginationQuerySchema(maxDefault).safeParse(query);
  if (!parsed.success) {
    const fallback = { limit: Math.min(50, maxDefault) } as PaginationParams;
    return fallback;
  }
  return parsed.data as PaginationParams;
};
