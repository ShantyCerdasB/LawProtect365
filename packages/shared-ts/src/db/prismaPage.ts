/**
 * @fileoverview Prisma pagination utilities
 * @summary Provides utilities for Prisma-based cursor pagination
 * @description This module provides utilities for implementing cursor-based pagination
 * with Prisma ORM, including configuration and execution of paginated queries.
 */

import { pageFromRows, cursorFromRecord } from './pagination.js';

/**
 * Configuration for pagination
 */
export type PagingCfg = {
  orderBy: Array<Record<string, 'asc' | 'desc'>>;
  cursorFields: string[];
  normalizeCursor?: (decoded: any) => Record<string, any> | undefined;
};

/**
 * Executes a paginated query using Prisma with cursor-based pagination
 * @param model - The Prisma model to query
 * @param where - The where clause for filtering
 * @param limit - The maximum number of results to return
 * @param cursor - The decoded cursor (not string)
 * @param cfg - The pagination configuration
 * @returns Promise with rows and next cursor
 */
export async function listPage<T>(
  model: { findMany: Function },
  where: Record<string, any>,
  limit: number,
  cursor: string | number | undefined,          // decoded cursor (not string)
  cfg: PagingCfg
): Promise<{ rows: T[]; nextCursor?: string }> {
  const prismaCursor = cfg.normalizeCursor ? cfg.normalizeCursor(cursor) : cursor;

  const rows = await model.findMany({
    where,
    take: limit + 1,
    ...(prismaCursor && { cursor: prismaCursor, skip: 1 }),
    orderBy: cfg.orderBy
  });

  const page = pageFromRows(rows, limit, (r: any) => cursorFromRecord(r, cfg.cursorFields));
  return { rows: page.items, nextCursor: page.nextCursor };
}
