/**
 * @file AdapterDependencies.ts
 * @summary Dependencies interfaces for audit adapters
 * @description Defines the dependency contracts for audit adapter implementations
 */

import type { AuditRepository } from "../../../domain/contracts/repositories/audit";

/**
 * @summary Dependencies for AuditQueriesPort adapter
 * @description Dependencies required by the AuditQueriesPort adapter implementation
 */
export interface AuditQueriesPortDependencies {
  /** Audit repository for data access */
  readonly auditRepo: AuditRepository;
}

/**
 * @summary Dependencies for AuditCommandsPort adapter
 * @description Dependencies required by the AuditCommandsPort adapter implementation
 */
export interface AuditCommandsPortDependencies {
  /** Audit repository for data access */
  readonly auditRepo: AuditRepository;
}






