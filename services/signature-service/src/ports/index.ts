/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
/** Hexagonal ports implemented by adapters */

export interface EnvelopeRepository {
  put(envelope: any): Promise<void>;
  get(envelopeId: string): Promise<any | null>;
  queryByTenant(tenantId: string, limit: number, cursor?: string): Promise<{ items: any[]; next?: string }>;
}

export interface SignerTokenStore {
  issue(token: string, ttlSeconds: number, payload: any): Promise<void>;
  consume(token: string): Promise<any | null>;
}
