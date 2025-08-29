/**
 * Application service: AddParty
 * - Orquesta validaciones livianas a nivel app
 * - Delega la persistencia al PartiesCommandsPort
 * - IDs y enums de dominio (brandeados)
 */
import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { PartyRole } from "@/domain/values/enums";
import type { PartiesCommandsPort } from "@/app/ports/parties/PartiesCommandsPort";

export const addPartyApp = async (
  input: {
    tenantId: TenantId;
    envelopeId: EnvelopeId;
    email: string;
    name: string;
    role: PartyRole; // "signer" | "approver" | "viewer"
    order?: number;
    metadata?: Record<string, unknown>;
    notificationPreferences?: { email: boolean; sms: boolean };
    actor?: { userId?: string; email?: string; ip?: string; userAgent?: string; locale?: string };
  },
  deps: {
    envelopes: unknown; 
    partiesCommands: PartiesCommandsPort;
    ids: { ulid(): string };
  }
): Promise<{ partyId: string }> => {
  // (Reglas app como: normalizar nombre, etc., si las necesitas)
  const created = await deps.partiesCommands.create({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    email: input.email,
    name: input.name,
    role: input.role,
    order: input.order,
    metadata: input.metadata,
    notificationPreferences: input.notificationPreferences,
  });

  return { partyId: (created.partyId as unknown as string) };
};
