/**
 * @file EnvelopesPort.ts
 * @summary Domain port for envelope reads used by rules/guards.
 */

export interface EnvelopeHead {
  envelopeId: string;
  tenantId: string;
  status: string; // keep as string unless you have an enum VO
}

export interface EnvelopesPort {
  getById(id: string): Promise<EnvelopeHead | null>;
}
