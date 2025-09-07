/**
 * @file controllerFactory.ts
 * @summary Universal controller factory using shared-ts middleware system
 * @description Factory for creating standardized controllers (POST/PUT/PATCH/DELETE operations)
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { validateRequest, ok, created, noContent } from "@lawprotect/shared-ts";
import { tenantFromCtx, actorFromCtx } from "../../presentation/middleware/auth";
import { getContainer } from "../../core/Container";
import type { CommandControllerConfig } from "../contracts/controllers";
import { RESPONSE_TYPES } from "../../domain/values/enums";
import type { Container } from "../contracts";

/**
 * @summary Creates a command controller (POST/PUT/PATCH/DELETE operations)
 * @description Universal factory function that creates standardized command controllers
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the command operation
 */
export const createController = <TInput, TOutput>(
  config: CommandControllerConfig<TInput, TOutput>
): HandlerFn => {
  return async (evt) => {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (config.bodySchema) validationSchemas.body = config.bodySchema;
    
    const validated = validateRequest(evt, validationSchemas);
    const tenantId = tenantFromCtx(evt);
    const actor = config.includeActor ? actorFromCtx(evt) : undefined;
    
    const c = getContainer();
    const dependencies = config.createDependencies(c);
    const appService = new config.appServiceClass(dependencies);
    
    const params = config.extractParams(validated.path, validated.body);
    const result = await appService.execute({ tenantId, actor, ...params });
    
    const responseData = config.transformResult ? config.transformResult(result) : result;
    
    switch (config.responseType) {
      case RESPONSE_TYPES[1]: // 'created'
        return created({ data: responseData });
      case RESPONSE_TYPES[2]: // 'noContent'
        return noContent();
      default: // 'ok'
        return ok({ data: responseData });
    }
  };
};

/**
 * @summary Creates signing command dependencies configuration
 * @description Helper function to create standardized signing command dependencies
 * @param c - Container instance
 * @param includeS3Service - Whether to include S3 service (optional)
 * @returns Signing command dependencies configuration
 */
export const createSigningDependencies = (c: Container, includeS3Service = false) => {
  const baseConfig = {
    events: c.signing.commandsPort, // Use the correct event adapter
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
  };

  if (includeS3Service) {
    return { ...baseConfig, s3Service: c.signing.s3Service };
  }

  return baseConfig;
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
