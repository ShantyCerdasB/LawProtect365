/**
 * @file createHandler.ts
 * @summary Common handler factory for all microservices
 * @description Creates handlers with shared configuration and middleware for any microservice
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { HandlerConfig } from "@/shared/contracts/controllers";

/**
 * @summary Creates a handler with standard configuration
 * @description Wraps a base handler function with standard middleware and configuration
 * 
 * @param {HandlerFn} baseHandler - The base handler function
 * @param {HandlerConfig} config - Optional configuration for the handler
 * @returns {HandlerFn} Wrapped handler with standard middleware
 */
export const createHandler = (
  baseHandler: HandlerFn,
  config: HandlerConfig = {}
): HandlerFn => {
  return wrapController(baseHandler, {
    auth: config.auth ?? true,
    observability: {
      logger: () => console,
      metrics: () => ({} as any),
      tracer: () => ({} as any),
    },
    cors: corsFromEnv(),
  });
};
