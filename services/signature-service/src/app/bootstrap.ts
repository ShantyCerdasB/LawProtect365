
/**
 * @file bootstrap.ts
 * @summary Thin app bootstrap that exposes the DI container to handlers.
 *
 * @description
 * - Uses the existing infra Container (singleton).
 * - Ensures one-time initialization on cold start.
 * - Provides a stable surface for handlers/tests.
 */

import { getContainer, type Container } from "@/infra/Container";
import { corsFromEnv } from "@/middleware/http";
import { logger } from "@lawprotect/shared-ts";

export interface App {
  container: Container;
  services: Container["services"];
  config: Container["config"];
  cors: ReturnType<typeof corsFromEnv>;
}

let appSingleton: App | null = null;

/** Idempotent init; safe to call from handlers/tests. */
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

/** Accessor used by controllers. */
export function getApp(): App {
  return initApp();
}
