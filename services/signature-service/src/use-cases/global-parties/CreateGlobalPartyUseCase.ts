/**
 * @file CreateGlobalPartyUseCase.ts
 * @summary Use case for creating a Global Party (contact)
 * @description Use case for creating a new Global Party in the address book.
 * Handles validation, business rules, and persistence.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesCommandsPort, GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import type { CreateGlobalPartyCommand, CreateGlobalPartyResult } from "@/app/ports/global-parties";
import { badRequest, conflict } from "@/shared/errors";
import { createGlobalPartyStats } from "@/domain/value-objects/global-party/GlobalPartyStats";
import { createGlobalPartyTags } from "@/domain/value-objects/global-party/GlobalPartyTags";

/**
 * @description Dependencies for the CreateGlobalParty use case.
 */
export interface CreateGlobalPartyUseCaseDeps {
  globalPartiesCommands: GlobalPartiesCommandsPort;
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * @description Input for the CreateGlobalParty use case.
 */
export interface CreateGlobalPartyUseCaseInput {
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
 * @description Result of the CreateGlobalParty use case.
 */
export interface CreateGlobalPartyUseCaseResult {
  globalParty: GlobalParty;
}

/**
 * @description Creates a new Global Party (contact) in the address book.
 * 
 * @param input - The input data for creating a Global Party
 * @param deps - The dependencies for the use case
 * @returns Promise resolving to the created Global Party
 * @throws {BadRequestError} When input validation fails
 * @throws {ConflictError} When a Global Party with the same email already exists
 */
export const executeCreateGlobalParty = async (
  input: CreateGlobalPartyUseCaseInput,
  deps: CreateGlobalPartyUseCaseDeps
): Promise<CreateGlobalPartyUseCaseResult> => {
  // 1. Validate input
  if (!input.name.trim()) {
    throw badRequest("Name is required");
  }

  if (!input.email.trim()) {
    throw badRequest("Email is required");
  }

  if (!input.role) {
    throw badRequest("Role is required");
  }

  if (!input.source) {
    throw badRequest("Source is required");
  }

  // 2. Check if Global Party with same email already exists
  const existingResult = await deps.globalPartiesQueries.searchByEmail({
    tenantId: input.tenantId,
    email: input.email,
    limit: 1,
  });

  if (existingResult.globalParties.length > 0) {
    throw conflict(`Global Party with email ${input.email} already exists`);
  }

  // 3. Prepare command
  const command: CreateGlobalPartyCommand = {
    tenantId: input.tenantId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    emails: input.emails?.map(email => email.trim().toLowerCase()),
    phone: input.phone?.trim(),
    locale: input.locale?.trim(),
    role: input.role as any,
    source: input.source as any,
    tags: input.tags ? createGlobalPartyTags(input.tags) : undefined,
    attributes: input.attributes,
    preferences: {
      defaultAuth: input.preferences?.defaultAuth || "otpViaEmail",
      defaultLocale: input.preferences?.defaultLocale || input.locale,
    },
    notificationPreferences: {
      email: input.notificationPreferences?.email ?? true,
      sms: input.notificationPreferences?.sms ?? false,
    },
    actor: input.actor,
  };

  // 4. Execute command
  const result: CreateGlobalPartyResult = await deps.globalPartiesCommands.create(command);

  return {
    globalParty: result.globalParty,
  };
};

