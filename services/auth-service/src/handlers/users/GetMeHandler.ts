/**
 * @fileoverview GetMeHandler - Handler for GET /me endpoint
 * @summary Handles user profile retrieval with conditional data inclusion
 * @description This handler processes GET /me requests to retrieve the authenticated
 * user's profile information with optional data inclusion based on query parameters.
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { GetMeQuerySchema } from '../../domain/schemas/GetMeSchema';
import { GetMeUseCase } from '../../application/GetMeUseCase';

/**
 * GetMeHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler retrieves the authenticated user's profile information
 * with conditional data inclusion based on query parameters. It supports including
 * OAuth providers, personal information, and JWT claims based on include flags.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Request validation: Validates query parameters using GetMeQuerySchema
 * - Service orchestration: Coordinates between domain services using GetMeUseCase
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates query parameters and authentication
 * 2. User Resolution - Resolves user by Cognito sub from JWT token
 * 3. Conditional Data - Fetches additional data based on include flags
 * 4. Response Assembly - Returns complete user profile with conditional fields
 *
 * @responsibilities
 * - User Profile Retrieval: Gets authenticated user's profile information
 * - Conditional Data Inclusion: Includes additional data based on query parameters
 * - Response Formatting: Transforms domain entities to API response format
 * - Header Management: Adds special headers for UI hints (e.g., PENDING_VERIFICATION)
 *
 * @exclusions
 * - User Authentication: Handled by middleware pipeline
 * - Permission Validation: Handled by middleware pipeline
 * - Data Validation: Handled by domain rules and value objects
 */
export const getMeHandler = ControllerFactory.createQuery({
  // Validation schemas
  querySchema: GetMeQuerySchema,
  
  // Service configuration
  appServiceClass: class {
    private readonly getMeUseCase: GetMeUseCase;
    
    constructor() {
      // Create GetMeUseCase using CompositionRoot pattern
      this.getMeUseCase = CompositionRoot.createGetMeUseCase();
    }
    
    /**
     * Executes the GetMe use case
     * @param params - Extracted parameters from request
     * @returns Promise resolving to user profile response
     */
    async execute(params: any) {
      return await this.getMeUseCase.execute({
        cognitoSub: params.cognitoSub,
        includeFlags: params.includeFlags
      });
    }
  },
  
  // Parameter extraction
  extractParams: (_path: any, _body: any, query: any, context: any) => ({
    cognitoSub: context.auth.cognitoSub, // From JWT token
    includeFlags: query.include || ''
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    return {
      user: result.user,
      headers: result.headers
    };
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: undefined, // Any authenticated user
  includeSecurityContext: true
});
