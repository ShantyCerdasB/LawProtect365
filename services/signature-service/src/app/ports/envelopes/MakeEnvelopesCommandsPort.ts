/**
 * Adapter: Envelope repo → EnvelopesCommandsPort.
 * Minimal mapping that keeps the app layer independent of infra details.
 */
import type { EnvelopesCommandsPort } from "./EnvelopesCommandPort";
import type { TenantId, EnvelopeId, UserId, EnvelopePatch } from "@/app/ports/shared";

type EnvelopeCreateRepo = {
  create(input: {
    tenantId: TenantId;
    ownerId: UserId;
    title: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ envelopeId: EnvelopeId }>;
};

type EnvelopePatchRepo = {
  update(id: EnvelopeId, patch: EnvelopePatch & { tenantId: TenantId }): Promise<void>;
};

type EnvelopeDeleteRepo = {
  delete(input: { tenantId: TenantId; envelopeId: EnvelopeId }): Promise<void>;
};

type EnvelopeRepoLike = EnvelopeCreateRepo & EnvelopePatchRepo & EnvelopeDeleteRepo;

export const makeEnvelopesCommandsPort = (repo: EnvelopeRepoLike): EnvelopesCommandsPort => ({
  async create(input) {
    return repo.create(input);
  },

  async patch(input) {
    await repo.update(input.envelopeId, { tenantId: input.tenantId, ...input.patch });
  },

  async delete(input) {
    await repo.delete(input);
  },
});
