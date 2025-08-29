/**
 * Write-oriented envelope port for controllers/use-cases.
 * Keeps the app layer independent from infra repository specifics.
 */
import type { TenantId, EnvelopeId, UserId, EnvelopePatch } from "@/app/ports/shared";

/**
 * Commands available for mutating envelopes.
 */
export interface EnvelopesCommandsPort {
  /**
   * Create a new envelope.
   */
  create(input: {
    tenantId: TenantId;
    ownerId: UserId;
    title: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ envelopeId: EnvelopeId }>;

  /**
   * Partially update an existing envelope.
   */
  patch(input: {
    tenantId: TenantId;
    envelopeId: EnvelopeId;
    patch: EnvelopePatch;
  }): Promise<void>;

  /**
   * Delete an envelope.
   */
  delete(input: {
    tenantId: TenantId;
    envelopeId: EnvelopeId;
  }): Promise<void>;
}
