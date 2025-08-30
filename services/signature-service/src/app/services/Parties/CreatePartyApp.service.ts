/**
 * @file CreatePartyApp.service.ts
 * @summary Application service for creating Parties in envelopes
 * @description Application service for creating new Parties within envelopes.
 * Orchestrates use cases and handles application-level concerns.
 */

import type { Party } from "@/domain/entities/Party";
import type { PartiesCommandsPort, PartiesQueriesPort } from "@/app/ports/parties";
import { executeCreateParty } from "@/use-cases/parties/CreatePartyUseCase";
import { IdempotencyRunner } from "@/infra/adapters/idempotency/IdempotencyRunner";

/**
 * @description Dependencies for the CreatePartyApp service.
 */
export interface CreatePartyAppDependencies {
  partiesCommands: PartiesCommandsPort;
  partiesQueries: PartiesQueriesPort;
  idempotencyRunner: IdempotencyRunner;
}

/**
 * @description Input for the CreatePartyApp service.
 */
export interface CreatePartyAppInput {
  tenantId: string;
  envelopeId: string;
  name: string;
  email: string;
  role: string;
  sequence?: number;
  phone?: string;
  locale?: string;
  auth?: {
    methods: string[];
  };
  globalPartyId?: string;
  actor: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    locale?: string;
  };
}

/**
 * @description Result of the CreatePartyApp service.
 */
export interface CreatePartyAppResult {
  party: Party;
}

/**
 * @description Options for the CreatePartyApp service.
 */
export interface CreatePartyAppOptions {
  idempotencyKey?: string;
}

/**
 * @description Creates a new Party within an envelope.
 * 
 * @param input - The input data for creating a Party
 * @param deps - The dependencies for the service
 * @param opts - Optional configuration
 * @returns Promise resolving to the created Party
 */
export const createPartyApp = async (
  input: CreatePartyAppInput,
  deps: CreatePartyAppDependencies,
  opts?: CreatePartyAppOptions
): Promise<CreatePartyAppResult> => {
  const exec = async () => {
    const result = await executeCreateParty(input, deps);
    return result;
  };

  if (opts?.idempotencyKey) {
    return await deps.idempotencyRunner.run(opts.idempotencyKey, exec);
  }

  return await exec();
};
