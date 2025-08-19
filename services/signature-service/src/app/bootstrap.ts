/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
/**
 * App bootstrap: wires dependencies for handlers.
 * Keep it side-effect free; handlers import a factory from here.
 */
import { logger } from "@lawprotect/shared-ts/observability";
import type { EventBusPort } from "@lawprotect/shared-ts/events";
import type { StoragePort } from "@lawprotect/shared-ts/storage/ports";

export interface AppDeps {
  eventBus: EventBusPort;
  storage: StoragePort;
  // add more ports (dynamo repo, kms, ssm, etc.)
}

let _deps: AppDeps | null = null;

export function getDeps(): AppDeps {
  if (_deps) return _deps;
  // TODO: construct real adapters in src/infra and set here
  throw new Error("Deps not initialized. Call initDeps() in your dev runner or provision in handler.");
}

export function initDeps(d: AppDeps) {
  _deps = d;
  logger.info("signature-service deps initialized");
}
