/**
 * @file controllerFactory.ts
 * @summary Signature service specific controller factory helpers
 * @description Helper functions for creating signature service specific controller configurations
 */

import { createController as createGenericController, withAuth, mapError } from "@lawprotect/shared-ts";
import { getContainer } from "../../core/Container";
import type { Container } from "../../infrastructure/contracts/core";
import { createConsentDependencies } from "./helpers/ConsentControllerHelpers";

/**
 * @summary Creates a command controller (POST/PUT/PATCH/DELETE operations)
 * @description Wrapper around the generic createController that provides signature service specific configuration
 * with unified JWT authentication and role validation middleware
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the command operation
 */
export const createController = <TInput, TOutput>(config: any) => {
  const baseController = createGenericController<TInput, TOutput>({
    ...config,
    getContainer});
  
  // Apply JWT authentication middleware with production configuration
  const jwtOptions = {
    issuer: process.env.JWT_ISSUER || 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    audience: process.env.JWT_AUDIENCE || 'test-client-id',
    jwksUri: process.env.JWKS_URI || 'http://localhost:3000/.well-known/jwks.json',
    clockToleranceSec: 60
  };
  
  // Apply unified authentication and authorization middleware
  const authController = withAuth(baseController, jwtOptions);
  
  // Then wrap with error handling using shared-ts mapError
  const wrappedController = async (evt: any) => {
    try {
      return await authController(evt);
    } catch (error: any) {
      return mapError(error);
    }
  };
  
  return wrappedController;
};

/**
 * @summary Creates base signing configuration
 * @description Helper function to create the base signing configuration shared across all signing operations
 * @param c - Container instance
 * @returns Base signing configuration
 */

/**
 * @summary Creates signing command dependencies configuration
 * @description Helper function to create standardized signing command dependencies
 * @param c - Container instance
 * @param includeS3Service - Whether to include S3 service (optional)
 * @returns Signing command dependencies configuration
 */
export const createSigningDependencies = (c: Container) => c.signing.commandsPort;

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
    // inputs: c.repos.inputs, // Moved to Documents Service
    invitationTokens: c.repos.invitationTokens
  },
  services: {
    // validation: c.requests.validationService, // inputs moved to Documents Service
    audit: c.requests.auditService,
    event: c.requests.eventService,
    rateLimit: c.requests.rateLimitService
  },
  infrastructure: {
    ids: c.ids,
    s3Presigner: c.storage.presigner
  }
});

// Re-export createConsentDependencies from helpers
export { createConsentDependencies };

// Alias for backward compatibility
export const createSigningDependenciesWithS3 = createSigningDependencies;

/**
 * @summary Creates standardized envelope path extraction
 * @description Helper function to extract common envelope path parameters
 * @param path - Path parameters
 * @param body - Request body
 * @returns Standardized envelope parameters
 */
export const extractEnvelopeParams = (path: Record<string, unknown>, body: Record<string, unknown>) => ({
  envelopeId: path.id,
  ...body
});

// Alias for backward compatibility
export const createCommandController = createController;