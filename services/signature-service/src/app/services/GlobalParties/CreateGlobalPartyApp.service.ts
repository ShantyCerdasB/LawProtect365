/**
 * @file CreateGlobalPartyApp.service.ts
 * @summary Application service for creating Global Parties (contacts)
 * @description Application service for creating new Global Parties in the address book.
 * Orchestrates use cases and handles application-level concerns.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesCommandsPort, GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import { executeCreateGlobalParty } from "@/use-cases/global-parties/CreateGlobalPartyUseCase";
import { IdempotencyRunner } from "@/infra/adapters/idempotency/IdempotencyRunner";

/**
 * @description Dependencies for the CreateGlobalPartyApp service.
 */
export interface CreateGlobalPartyAppDependencies {
  globalPartiesCommands: GlobalPartiesCommandsPort;
  globalPartiesQueries: GlobalPartiesQueriesPort;
  idempotencyRunner: IdempotencyRunner;
}

/**
 * @description Input for the CreateGlobalPartyApp service.
 */
export interface CreateGlobalPartyAppInput {
  tenantId: string;
  name: string;
  email: string;
  emails?: string[];
  phone?: string;
  locale?: string;
  role: string;
  source: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
  preferences?: {
    defaultAuth?: string;
    defaultLocale?: string;
  };
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
  actor: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    locale?: string;
  };
}

/**
 * @description Result of the CreateGlobalPartyApp service.
 */
export interface CreateGlobalPartyAppResult {
  globalParty: GlobalParty;
}

/**
 * @description Options for the CreateGlobalPartyApp service.
 */
export interface CreateGlobalPartyAppOptions {
  idempotencyKey?: string;
}

/**
 * @description Creates a new Global Party (contact) in the address book.
 * 
 * @param input - The input data for creating a Global Party
 * @param deps - The dependencies for the service
 * @param opts - Optional configuration
 * @returns Promise resolving to the created Global Party
 */
export const createGlobalPartyApp = async (
  input: CreateGlobalPartyAppInput,
  deps: CreateGlobalPartyAppDependencies,
  opts?: CreateGlobalPartyAppOptions
): Promise<CreateGlobalPartyAppResult> => {
  const exec = async () => {
    const result = await executeCreateGlobalParty(input, deps);
    return result;
  };

  if (opts?.idempotencyKey) {
    return await deps.idempotencyRunner.run(opts.idempotencyKey, exec);
  }

  return await exec();
};
