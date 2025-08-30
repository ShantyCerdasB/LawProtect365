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

/** High-level application services (e.g., envelopes). */
export const services = c.services;

/** Direct repository and adapter handles (optional convenience). */
export const envelopeRepository = c.repos.envelopes;
export const documentRepository = c.repos.documents;
export const eventPublisher = c.events.publisher;
export const kmsSigner = c.crypto.signer;
export const evidenceStorage = c.storage.evidence;
export const configProvider = c.configProvider;
