/**
 * @file ConsentControllerHelpers.ts
 * @summary Helper functions for consent controllers
 * @description Provides reusable patterns for consent-related controllers
 */

/**
 * Common dependencies factory for consent controllers
 */
export function createConsentDependencies(c: any) {
  return {
    consentsRepo: c.repos.consents,
    delegationsRepo: c.repos.delegations,
    ids: c.ids,
    globalPartiesRepo: c.consent.party,
    validationService: c.consent.validation,
    auditService: c.consent.audit,
    eventService: c.consent.events,
    idempotencyRunner: c.idempotency.runner
  };
}

/**
 * Common parameter extraction for consent controllers
 */
export function extractConsentParams(path: Record<string, unknown>, body: Record<string, unknown>) {
  return {
    envelopeId: path.envelopeId,
    metadata: body.metadata,
    expiresAt: body.expiresAt,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300,
  };
}
