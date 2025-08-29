/**
 * Write-oriented party port for controllers/use-cases.
 * `listByEnvelope` is optional to avoid hard dependency when infra lacks it.
 */
import type {
  TenantId, EnvelopeId, PartyId, PartyHead, PartyPatch, PartyRole, PartyStatus, Page, PageOpts
} from "@/app/ports/shared";

export interface PartiesCommandsPort {
  create(input: {
    tenantId: TenantId;
    envelopeId: EnvelopeId;
    email: string;
    name: string;
    role: PartyRole;
    order?: number;
    metadata?: Record<string, unknown>;
    notificationPreferences?: { email: boolean; sms: boolean };
  }): Promise<{ partyId: PartyId; status?: PartyStatus }>;

  patch(input: {
    tenantId: TenantId;
    envelopeId: EnvelopeId;
    partyId: PartyId;
    patch: PartyPatch;
  }): Promise<void>;

  delete(input: { tenantId: TenantId; envelopeId: EnvelopeId; partyId: PartyId }): Promise<void>;

  listByEnvelope?(
    input: { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts
  ): Promise<Page<PartyHead>>;
}
