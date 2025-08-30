
/**
 * @file bootstrap.ts
 * @summary Thin app bootstrap that exposes the DI container to handlers.
 *
 * @description
 * - Uses the existing infra Container (singleton).
 * - Ensures one-time initialization on cold start.
 * - Provides a stable surface for handlers/tests.
 */

import { getContainer, type Container } from "@/core/Container";
import { corsFromEnv } from "@/presentation/middleware/http";
import { logger } from "@lawprotect/shared-ts";

/**
 * @description Application interface containing the dependency injection container and essential services.
 * Provides access to container, services, configuration, and CORS settings.
 */
export interface App {
  /** Dependency injection container instance */
  container: Container;
  /** Services from the container */
  services: Container["services"];
  /** Application configuration */
  config: Container["config"];
  /** CORS configuration derived from environment */
  cors: ReturnType<typeof corsFromEnv>;
}

/** Singleton instance of the application */
let appSingleton: App | null = null;

/**
 * @description Initializes the application singleton if not already initialized.
 * This function is idempotent and safe to call multiple times from handlers or tests.
 * 
 * @returns {App} The initialized application instance containing container, services, config, and CORS settings
 */
export function initApp(): App {
  if (appSingleton) return appSingleton;

  const container = getContainer();
  appSingleton = {
    container,
    services: container.services,
    config: container.config,
    cors: corsFromEnv(),
  };

  logger.info("signature-service bootstrapped", {
    service: appSingleton.config.serviceName,
    env: appSingleton.config.env,
  });

  return appSingleton;
}

/**
 * @description Accessor function used by controllers to get the application instance.
 * Ensures the application is initialized before returning the instance.
 * 
 * @returns {App} The application instance
 */
export function getApp(): App {
  return initApp();
}
