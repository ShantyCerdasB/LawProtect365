/**
 * @file Services.ts
 * @summary Convenience exports for pre-wired services and key adapters.
 *
 * @description
 * Exposes the application services constructed by the DI container along with
 * commonly used adapters for cases where direct access is desirable outside
 * the controller path (e.g., scheduled tasks).
 */

import { getContainer } from "./Container";

const c = getContainer();

/** High-level application services are now available through the container directly */

/** Direct repository and adapter handles (optional convenience). */
export const envelopeRepository = c.repos.envelopes;
export const documentRepository = c.repos.documents;
export const auditRepository = c.repos.audit;

/** Consent services for direct access */
export const consentValidationService = c.consent.validation;
export const consentAuditService = c.consent.audit;
export const consentEventService = c.consent.events;
export const globalPartyRepository = c.consent.party;

export const eventPublisher = c.events.eventPublisher;
export const kmsSigner = c.crypto.signer;
export const evidenceStorage = c.storage.evidence;
export const configProvider = c.configProvider;
