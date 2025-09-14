/**
 * @file AdapterDependencies.ts
 * @summary Dependencies interfaces for consent adapters
 * @description Defines the dependency contracts for consent adapter implementations
 */

import type { ConsentRepository } from "../../../domain/contracts/repositories/consent";
import type { DelegationRepository } from "../../../domain/contracts/repositories/delegation";
import type { 
  ConsentRepoRow,
  ConsentRepoCreateInput,
  ConsentRepoKey,
  ConsentRepoUpdateInput,
  ConsentRepoListInput,
  ConsentRepoListOutput
} from "./ConsentTypes";

/**
 * @summary Dependencies for ConsentQueriesPort adapter
 * @description Dependencies required by the ConsentQueriesPort adapter implementation
 */
export interface ConsentQueriesPortDependencies {
  /** Consent repository for data access */
  readonly consentRepo: ConsentRepository;
}

/**
 * @summary Dependencies for ConsentCommandsPort adapter
 * @description Dependencies required by the ConsentCommandsPort adapter implementation
 */
export interface ConsentCommandsPortDependencies {
  /** Consent repository for data access */
  readonly consentRepo: ConsentRepository;
}

/**
 * @summary Minimal repository interface for query operations
 * @description Repository methods needed for consent query operations
 */
export type ConsentQueryRepo = {
  listByEnvelope(input: ConsentRepoListInput): Promise<ConsentRepoListOutput>;
  getById(keys: { envelopeId: string; consentId: string }): Promise<ConsentRepoRow | null>;
};

/**
 * @summary Minimal repository interface for command operations
 * @description Repository methods needed for consent command operations
 */
export type ConsentCommandRepo = {
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;
  delete(keys: ConsentRepoKey): Promise<void>;
  /** Delegation repository for delegation operations */
  readonly delegations: DelegationRepository;
};

/**
 * @summary ID generation service interface
 * @description Service for generating unique identifiers
 */
export type Ids = { ulid(): string };

