import type { CursorPage } from "@lawprotect/shared-ts";
import type { PaginationCursor, TenantId, EnvelopeId } from "../value-objects";
import type { AuditEvent } from "../value-objects/Audit";

export interface ListByEnvelopeInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  limit: number;
  cursor?: PaginationCursor;
}

export interface AuditRepository {
  getById(id: AuditEvent["id"]): Promise<AuditEvent | null>;
  listByEnvelope(input: ListByEnvelopeInput): Promise<CursorPage<AuditEvent>>;
  record(candidate: Omit<AuditEvent, "id" | "hash"> & { hash?: string }): Promise<AuditEvent>;
}
