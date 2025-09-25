/**
 * @fileoverview ControllerFactory - Enhanced controller factory
 * @summary Universal controller factory with middleware composition
 * @description Provides a unified factory for creating controllers with
 * configurable middleware pipelines, validation, and error handling.
 */

import type { HandlerFn, ApiEvent } from "../../http/httpTypes.js";
import { compose } from "../../http/middleware.js";
import { withRequestContext } from "../../http/withRequestContext.js";
import { withObservability } from "../../http/withObservability.js";
import { withControllerLogging } from "../../http/withControllerLogging.js";
import { withJwtAuth, withRoleValidation } from "../../middleware/auth/index.js";
import { withSecurityContext } from "../../middleware/security/index.js";
import { validateRequest } from "../../validation/requests.js";
import { ok, created, noContent } from "../../http/responses.js";
import { mapError } from "../../errors/mapError.js";
import type { UserRole, JwtVerifyOptions } from "../../types/auth.js";
import type { ObservabilityFactories } from "../../http/withObservability.js";

/**
 * Enhanced controller configuration
 */
export interface ControllerConfig<TInput = any, TOutput = any> {
  /** Path schema for validation */
  pathSchema?: any;
  /** Body schema for validation (for POST/PUT/PATCH) */
  bodySchema?: any;
  /** Query schema for validation (for GET requests) */
  querySchema?: any;
  
  /** App service class to instantiate */
  appServiceClass: new (dependencies?: any) => any;
  /** Function to create dependencies from container (optional for direct instantiation) */
  createDependencies?: (container: any) => any;
  /** Function to get container instance (optional for direct instantiation) */
  getContainer?: () => any;
  
  /** Function to extract parameters from validated request */
  extractParams: (path?: any, body?: any, query?: any, context?: any) => TInput;
  /** Function to transform result for response (optional) */
  transformResult?: (result: any) => TOutput;
  /** Type of HTTP response */
  responseType: "ok" | "created" | "noContent";
  
  /** Whether authentication is required */
  requireAuth?: boolean;
  /** JWT verification options */
  authOptions?: JwtVerifyOptions;
  /** Required roles for authorization */
  requiredRoles?: UserRole[];
  /** Whether to include security context */
  includeSecurityContext?: boolean;
  
  /** Method name to call on the service (defaults to 'execute') */
  methodName?: string;
  
  /** Observability factories for logging/metrics/tracing */
  observability?: ObservabilityFactories;
}

/**
 * Enhanced controller factory
 * 
 * Creates controllers with configurable middleware pipelines including:
 * - Request context and observability
 * - JWT authentication (optional)
 * - Role-based authorization (optional)
 * - Security context creation
 * - Request validation
 * - Error handling
 * - Response formatting
 */
export class ControllerFactory {
  /**
   * Creates a command controller (POST/PUT/PATCH/DELETE operations)
   */
  static createCommand<TInput, TOutput>(
    config: ControllerConfig<TInput, TOutput>
  ): HandlerFn {
    return this.createController(config, { includeBody: true });
  }

  /**
   * Creates a query controller (GET operations)
   */
  static createQuery<TInput, TOutput>(
    config: ControllerConfig<TInput, TOutput>
  ): HandlerFn {
    return this.createController(config, { includeBody: false });
  }

  /**
   * Creates a controller with the specified configuration
   */
  private static createController<TInput, TOutput>(
    config: ControllerConfig<TInput, TOutput>,
    options: { includeBody: boolean }
  ): HandlerFn {
    return compose(
      async (evt) => {
        try {
          const validated = this.validateRequest(evt, config, options);
          const { auth, securityContext } = this.extractContext(evt);
          const appService = this.createServiceInstance(config);
          const params = this.extractParameters(config, validated, auth, securityContext, evt, options);
          const result = await this.executeServiceMethod(appService, config, params);
          const responseData = await this.transformResult(config, result);
          return this.createResponse(config, responseData);
        } catch (error) {
          return mapError(error);
        }
      },
      this.createMiddlewareConfig(config)
    );
  }

  /**
   * Validates the request based on configuration
   */
  private static validateRequest(evt: any, config: ControllerConfig, options: { includeBody: boolean }) {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (options.includeBody && config.bodySchema) validationSchemas.body = config.bodySchema;
    if (!options.includeBody && config.querySchema) validationSchemas.query = config.querySchema;
    
    return validateRequest(evt, validationSchemas);
  }

  /**
   * Extracts authentication and security context from event
   */
  private static extractContext(evt: ApiEvent) {
    return {
      auth: evt.auth,
      securityContext: evt.securityContext
    };
  }

  /**
   * Creates service instance with dependency injection
   */
  private static createServiceInstance(config: ControllerConfig) {
    if (config.getContainer && config.createDependencies) {
      const container = config.getContainer();
      const dependencies = config.createDependencies(container);
      return new config.appServiceClass(dependencies);
    } else {
      return new config.appServiceClass();
    }
  }

  /**
   * Extracts parameters for service method
   */
  private static extractParameters(
    config: ControllerConfig,
    validated: any,
    auth: any,
    securityContext: any,
    evt: any,
    options: { includeBody: boolean }
  ) {
    return config.extractParams(
      validated.path,
      options.includeBody ? validated.body : undefined,
      validated.query,
      { auth, securityContext, requestContext: evt.requestContext }
    );
  }

  /**
   * Executes the service method
   */
  private static async executeServiceMethod(appService: any, config: ControllerConfig, params: any) {
    const methodName = config.methodName || 'execute';
    return await appService[methodName](params);
  }

  /**
   * Transforms the result if needed
   */
  private static async transformResult(config: ControllerConfig, result: any) {
    return config.transformResult ? await config.transformResult(result) : result;
  }

  /**
   * Creates the appropriate HTTP response
   */
  private static createResponse(config: ControllerConfig, responseData: any) {
    switch (config.responseType) {
      case 'created':
        return created({ data: responseData });
      case 'noContent':
        return noContent();
      default: // 'ok'
        return ok({ data: responseData });
    }
  }

  /**
   * Creates middleware configuration
   */
  private static createMiddlewareConfig(config: ControllerConfig) {
    return {
      before: [
        // Request context and observability
        withRequestContext(),
        ...(config.observability ? [withObservability(config.observability)] : []),
        
        // Authentication (if required)
        ...(config.requireAuth ? [withJwtAuth(config.authOptions)] : []),
        
        // Authorization (if roles specified)
        ...(config.requiredRoles ? [withRoleValidation(config.requiredRoles)] : []),
        
        // Security context (if enabled)
        ...(config.includeSecurityContext ? [withSecurityContext()] : [])
      ],
      after: [
        // Controller logging
        withControllerLogging().after
      ],
        onError: [
          // Error handling
          async (evt: any, error: any) => mapError(error)
        ]
    };
  }

  /**
   * Creates a simple controller with minimal middleware
   */
  static createSimple<TInput, TOutput>(
    config: Omit<ControllerConfig<TInput, TOutput>, 'requireAuth' | 'requiredRoles' | 'includeSecurityContext'>
  ): HandlerFn {
    return compose(
      async (evt) => {
        try {
          // Validate request
          const validationSchemas: any = {};
          if (config.pathSchema) validationSchemas.path = config.pathSchema;
          if (config.bodySchema) validationSchemas.body = config.bodySchema;
          if (config.querySchema) validationSchemas.query = config.querySchema;
          
          const validated = validateRequest(evt, validationSchemas);
          
          // Create service instance
          let appService;
          if (config.getContainer && config.createDependencies) {
            // Use container-based dependency injection
            const container = config.getContainer();
            const dependencies = config.createDependencies(container);
            appService = new config.appServiceClass(dependencies);
          } else {
            // Use direct instantiation (no container)
            appService = new config.appServiceClass();
          }
          
          // Extract parameters
          const params = config.extractParams(
            validated.path, 
            validated.body, 
            validated.query,
            { requestContext: evt.requestContext }
          );
          
          // Execute service method
          const methodName = config.methodName || 'execute';
          const result = await appService[methodName](params);
          
          // Transform result if needed
          const responseData = config.transformResult ? await config.transformResult(result) : result;
          
          // Return appropriate response
          switch (config.responseType) {
            case 'created':
              return created({ data: responseData });
            case 'noContent':
              return noContent();
            default: // 'ok'
              return ok({ data: responseData });
          }
        } catch (error) {
          return mapError(error);
        }
      },
      {
        before: [
          withRequestContext(),
          ...(config.observability ? [withObservability(config.observability)] : [])
        ],
        after: [
          withControllerLogging().after
        ],
        onError: [
          async (evt, error) => mapError(error)
        ]
      }
    );
  }
}
