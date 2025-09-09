/**
 * @file controllerFactory.ts
 * @summary Signature service specific controller factory helpers
 * @description Helper functions for creating signature service specific controller configurations
 */

import { createController as createGenericController } from "@lawprotect/shared-ts";
import { getContainer } from "../../core/Container";
import type { Container } from "../../infrastructure/contracts/core";
import { makeSigningCommandsPort } from "../../app/adapters/signing/makeSigningCommandsPort";

/**
 * @summary Creates a command controller (POST/PUT/PATCH/DELETE operations)
 * @description Wrapper around the generic createController that provides signature service specific configuration
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the command operation
 */
export const createController = <TInput, TOutput>(config: any) => {
  return createGenericController<TInput, TOutput>({
    ...config,
    getContainer,
  });
};

/**
 * @summary Creates base signing configuration
 * @description Helper function to create the base signing configuration shared across all signing operations
 * @param c - Container instance
 * @returns Base signing configuration
 */
const createBaseSigningConfig = (c: Container) => ({
  events: c.signing.commandsPort,
  ids: c.ids,
  time: c.time,
  rateLimit: c.signing.rateLimitService,
  signer: c.crypto.signer,
  idempotency: c.idempotency.runner,
  signingConfig: {
    defaultKeyId: c.config.kms.signerKeyId,
    allowedAlgorithms: [c.config.kms.signingAlgorithm],
  },
  uploadConfig: {
    uploadBucket: c.config.s3.evidenceBucket,
    uploadTtlSeconds: c.config.s3.presignTtlSeconds,
  },
  downloadConfig: {
    signedBucket: c.config.s3.signedBucket,
    downloadTtlSeconds: c.config.s3.presignTtlSeconds,
  },
});

/**
 * @summary Creates signing command dependencies configuration
 * @description Helper function to create standardized signing command dependencies
 * @param c - Container instance
 * @param includeS3Service - Whether to include S3 service (optional)
 * @returns Signing command dependencies configuration
 */
export const createSigningDependencies = (c: Container, includeS3Service = false) => {
  const baseConfig = createBaseSigningConfig(c);
  return includeS3Service ? { ...baseConfig, s3Service: c.signing.s3Service } : baseConfig;
};

/**
 * @summary Creates requests command dependencies configuration
 * @description Helper function to create standardized requests command dependencies
 * @param c - Container instance
 * @returns Requests command dependencies configuration
 */
export const createRequestsDependencies = (c: Container) => ({
  repositories: {
    envelopes: c.repos.envelopes,
    parties: c.repos.parties,
    inputs: c.repos.inputs
  },
  services: {
    validation: c.requests.validationService,
    audit: c.requests.auditService,
    event: c.requests.eventService,
    rateLimit: c.requests.rateLimitService
  },
  infrastructure: {
    ids: c.ids,
    s3Presigner: c.storage.presigner
  }
});

/**
 * @summary Creates consent command dependencies configuration
 * @description Helper function to create standardized consent command dependencies
 * @param c - Container instance
 * @returns Consent command dependencies configuration
 */
export const createConsentDependencies = (c: Container) => ({
  consentsRepo: Object.assign(c.repos.consents, {
    delegations: c.repos.delegations
  }),
  delegationsRepo: c.repos.delegations,
  ids: c.ids,
  globalPartiesRepo: c.consent.party,
  validationService: c.consent.validation,
  auditService: c.consent.audit,
  eventService: c.consent.events,
  idempotencyRunner: c.idempotency.runner
});

/**
 * @summary Creates signing command dependencies with S3 service
 * @description Helper function to create standardized signing command dependencies with S3 service
 * @param c - Container instance
 * @returns Signing command dependencies configuration with S3 service
 */
export const createSigningDependenciesWithS3 = (c: Container) => makeSigningCommandsPort(
  c.repos.envelopes,
  c.repos.parties,
  c.repos.documents,
  createSigningDependencies(c, true)
);

/**
 * @summary Creates standardized envelope path extraction
 * @description Helper function to extract common envelope path parameters
 * @param path - Path parameters
 * @param body - Request body
 * @returns Standardized envelope parameters
 */
export const extractEnvelopeParams = (path: any, body: any) => ({
  tenantId: path.tenantId,
  envelopeId: path.id,
  ...body
});

// Alias for backward compatibility
export const createCommandController = createController;






