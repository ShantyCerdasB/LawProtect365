/**
 * Adapter: PartyRepositoryDdb → PartiesCommandsPort.
 * - Construye `Party` (IDs brandeados) desde inputs del port.
 * - Acepta repos con update que devuelven Promise<Party> o Promise<void>.
 * - Si falta listByEnvelope, retorna página vacía.
 */
import type { PartiesCommandsPort } from "./PartiesCommandsPort";
import type {
  TenantId, EnvelopeId, PartyId, PartyHead, PartyRole, PartyStatus, Page
} from "@/app/ports/shared";
import type { Party } from "@/domain/entities/Party";

/** Firmas mínimas del repo real (Dynamo) */
type RepoCreate = { create(entity: Party): Promise<Party> };
type RepoUpdate = {
  update(
    keys:
      | { tenantId: TenantId; envelopeId: EnvelopeId; partyId: PartyId }
      | { envelopeId: EnvelopeId; partyId: PartyId },
    patch: Partial<Party>
  ): Promise<Party | void>;
};
type RepoDelete = {
  delete(input: { tenantId: TenantId; envelopeId: EnvelopeId; partyId: PartyId }): Promise<void>;
};
type RepoList = {
  listByEnvelope(input: {
    tenantId: TenantId; envelopeId: EnvelopeId; limit?: number; cursor?: string;
  }): Promise<Page<{
    partyId: PartyId | string;
    envelopeId: EnvelopeId | string;
    email?: string;
    name?: string;
    role?: PartyRole | string;
    status?: PartyStatus | string;
    order?: number;
  }>>;
};

type PartyRepositoryLike = RepoCreate & Partial<RepoUpdate & RepoDelete & RepoList>;

export const makePartiesCommandsPort = (
  repo: PartyRepositoryLike,
  deps: { ids: { ulid(): string }; time: { now(): number } }
): PartiesCommandsPort => ({
  async create(input) {
    const nowIso = new Date(deps.time.now()).toISOString();
    const newPartyId = deps.ids.ulid() as unknown as PartyId;

    // Evita escribir `undefined` en campos string (ej. invitedAt)
    const entity: Party = {
      tenantId: input.tenantId as TenantId,
      envelopeId: input.envelopeId as EnvelopeId,
      partyId: newPartyId,

      email: input.email,
      name: input.name,
      role: input.role,
      status: "pending",

      invitedAt: nowIso, // muchos modelos lo tienen como string no opcional

      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      ...(input.notificationPreferences !== undefined
        ? { notificationPreferences: input.notificationPreferences }
        : {}),

      createdAt: nowIso,
      updatedAt: nowIso,
      sequence: 0,
      // otpState/signedAt/declinedAt: sólo si aplica (no escribimos undefined)
    };

    const saved = await repo.create(entity);
    return {
      partyId: saved.partyId as PartyId,
      status: saved.status as PartyStatus | undefined,
    };
  },

  async patch(input) {
    const update = (repo as Partial<RepoUpdate>)?.update;
    if (typeof update === "function") {
      const tried = await update(
        { tenantId: input.tenantId as TenantId, envelopeId: input.envelopeId as EnvelopeId, partyId: input.partyId as PartyId },
        input.patch as Partial<Party>
      ).catch(async () =>
        update(
          { envelopeId: input.envelopeId as EnvelopeId, partyId: input.partyId as PartyId },
          { tenantId: input.tenantId as TenantId, ...(input.patch as Partial<Party>) }
        )
      );
      void tried;
    }
  },

  async delete(input) {
    const del = (repo as Partial<RepoDelete>)?.delete;
    if (typeof del === "function") {
      await del({
        tenantId: input.tenantId as TenantId,
        envelopeId: input.envelopeId as EnvelopeId,
        partyId: input.partyId as PartyId,
      });
    }
  },

  async listByEnvelope(input) {
    const list = (repo as Partial<RepoList>)?.listByEnvelope;
    if (typeof list !== "function") return { items: [], nextCursor: undefined };

    const page = await list({
      tenantId: input.tenantId as TenantId,
      envelopeId: input.envelopeId as EnvelopeId,
      limit: input.limit,
      cursor: input.cursor,
    });

    return {
      items: page.items.map((r) => ({
        partyId: r.partyId as PartyId,
        envelopeId: r.envelopeId as EnvelopeId,
        email: r.email,
        name: r.name,
        role: r.role as PartyRole | undefined,
        status: r.status as PartyStatus | undefined,
        order: r.order,
      })) as PartyHead[],
      nextCursor: page.nextCursor,
    };
  },
});
