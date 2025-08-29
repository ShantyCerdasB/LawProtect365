/**
 * @file PartyStatus.service.ts
 * @summary Domain helpers to evaluate aggregate party status for an envelope.
 *
 * @description
 * Centralizes checks that consider multiple parties within an envelope.
 * Works with repositories that expose cursor-based pagination and remains
 * framework-agnostic.
 */

import type { Party } from "@/domain/entities/Party";

/**
 * Single page of parties returned by a paginated repository.
 */
export interface PartyListPage {
  /** Parties in the current page. */
  items: Party[];
  /** Opaque cursor to fetch the next page, if any. */
  nextCursor?: string;
}

/**
 * Minimal cursor-based listing contract for parties.
 * Implement this on your parties repository when pagination is available.
 */
export interface PartyListRepo {
  /**
   * Lists parties for an envelope using cursor-based pagination.
   *
   * @param spec   Listing specification; must include the `envelopeId`.
   * @param limit  Maximum number of items to return for this page.
   * @param cursor Opaque cursor obtained from a previous page (optional).
   * @returns A page of parties and, if present, a cursor for the next page.
   */
  list(
    spec: { envelopeId: string; [k: string]: unknown },
    limit: number,
    cursor?: string
  ): Promise<PartyListPage>;
}

/**
 * Returns `true` when every party in the envelope (excluding `excludePartyId`)
 * has status `declined`. The evaluation short-circuits on the first
 * non-declined party to minimize reads.
 *
 * @param repo            Parties repository with paginated listing.
 * @param envelopeId      Envelope identifier to scan.
 * @param excludePartyId  Party ID to ignore (typically the one just updated).
 * @param pageSize        Page size used when fetching parties. Defaults to 200.
 * @returns `true` if all parties (excluding `excludePartyId`) are `declined`.
 *
 * @remarks
 * Any errors thrown by the repository are propagated to the caller.
 */
export async function areAllPartiesDeclined(
  repo: PartyListRepo,
  envelopeId: string,
  excludePartyId: string,
  pageSize = 200
): Promise<boolean> {
  let cursor: string | undefined;

  do {
    const page = await repo.list({ envelopeId }, pageSize, cursor);
    const items = page.items ?? [];

    // Fast fail if any party (other than the excluded one) is not declined.
    const foundNotDeclined = items.some(
      (p) => p.partyId !== excludePartyId && p.status !== "declined"
    );
    if (foundNotDeclined) return false;

    cursor = page.nextCursor;
  } while (cursor);

  return true;
}
