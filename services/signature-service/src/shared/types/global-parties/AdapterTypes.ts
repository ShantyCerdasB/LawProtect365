/**
 * @file AdapterTypes.ts
 * @summary Types for Global Parties adapters
 * @description Defines dependency types and other types used by adapters
 */

import type { GlobalPartiesRepository } from "../../../shared/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { 
  GlobalPartiesValidationService,
  GlobalPartiesAuditService,
  GlobalPartiesEventService
} from "./ServiceInterfaces";

/**
 * @description Dependencies for the Global Parties Commands adapter.
 */
export type MakeGlobalPartiesCommandsPortDeps = {
  globalParties: GlobalPartiesRepository;
  ids: { ulid(): string };
  // Optional services - PATTERN REUTILIZABLE
  validationService?: GlobalPartiesValidationService;
  auditService?: GlobalPartiesAuditService;
  eventService?: GlobalPartiesEventService;
};

/**
 * @description Dependencies for the Global Parties Queries adapter.
 */
export type MakeGlobalPartiesQueriesPortDeps = {
  globalParties: GlobalPartiesRepository;
};
