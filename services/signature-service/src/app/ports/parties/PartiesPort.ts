/**
 * Pre-bound Parties port (bound to a specific envelope).
 *
 * Controllers/adapters create this port by binding an `envelopeId` once.
 * Then:
 * - `getById(partyId)` resolves a single party inside that envelope.
 * - `listByEnvelope(...)` lists parties for that bound envelope (optional if the repo doesn’t support it).
 */
import type {
  PartyHead,
  TenantId,
  PartyId,
  Page,
  PageOpts,
} from "@/app/ports/shared";

export interface PartiesPort {
  /**
   * Get one party **inside the bound envelope** by its id.
   */
  getById(partyId: PartyId): Promise<PartyHead | null>;

  /**
   * List parties for the **bound envelope**.
   * Implemented only when the underlying repo exposes pagination.
   */
  listByEnvelope?(
    input: { tenantId: TenantId } & PageOpts
  ): Promise<Page<PartyHead>>;
}
