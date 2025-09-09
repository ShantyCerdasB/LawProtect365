/**
 * @file MakeGlobalPartiesCommandsPort.ts
 * @summary Adapter factory for Global Parties Commands Port
 * @description Creates GlobalPartiesCommandsPort implementation using DynamoDB repository.
 * Handles create, update, and delete operations for Global Parties (contacts).
 */

import type { 
  GlobalPartiesCommandsPort,
  CreateGlobalPartyCommand, 
  CreateGlobalPartyResult,
  UpdateGlobalPartyCommand,
  UpdateGlobalPartyResult,
  DeleteGlobalPartyCommand,
  DeleteGlobalPartyResult
} from "../../ports/global-parties";
import type { GlobalPartiesRepository } from "../../../domain/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { 
  GlobalPartyExtended,
} from "../../../domain/types/global-parties";
import type { PartyId } from "@/domain/value-objects/ids";
import { 
  GLOBAL_PARTY_STATUSES, 
  PARTY_ROLES, 
  PARTY_SOURCES,
  AUTH_METHODS,
  GlobalPartyUpdatableField
} from "../../../domain/values/enums";
import { nowIso, NotFoundError } from "@lawprotect/shared-ts";
import type { 
  GlobalPartiesValidationService,
  GlobalPartiesAuditService,
  GlobalPartiesEventService
} from "../../../domain/types/global-parties/ServiceInterfaces";

/**
 * @description Creates default Global Party statistics
 */
const createDefaultGlobalPartyStats = () => ({
  signedCount: 0,
  totalEnvelopes: 0,
});

/**
 * @description Creates normalized Global Party tags
 */
const createNormalizedTags = (tags: string[]): string[] => {
  const normalized = tags.map(tag => tag.trim().toLowerCase());
  const uniqueTags = new Set(normalized);
  return Array.from(uniqueTags);
};

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
 * @description Creates GlobalPartiesCommandsPort implementation.
 * 
 * @param deps - Dependencies for the adapter
 * @returns GlobalPartiesCommandsPort implementation
 */
export const makeGlobalPartiesCommandsPort = (
  deps: MakeGlobalPartiesCommandsPortDeps
): GlobalPartiesCommandsPort => {
  return {
    async create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult> {
      // 1. VALIDATION (opcional) - PATRÓN REUTILIZABLE
      if (deps.validationService) {
        deps.validationService.validateCreate(command);
      }

      const now = nowIso();
      const globalPartyId = deps.ids.ulid();

      const globalParty: GlobalPartyExtended = {
        partyId: globalPartyId as PartyId,
        tenantId: command.tenantId,
        name: command.name,
        email: command.email,
        emails: command.emails,
        phone: command.phone,
        locale: command.locale,
        role: command.role || PARTY_ROLES[0], // Default to first role
        source: command.source || PARTY_SOURCES[0], // Default to first source
        status: GLOBAL_PARTY_STATUSES[0], // 'active'
        tags: command.tags ? createNormalizedTags(command.tags) : undefined,
        attributes: command.attributes,
        preferences: {
          defaultAuth: command.preferences?.defaultAuth ?? AUTH_METHODS[0],
          defaultLocale: command.preferences?.defaultLocale || command.locale,
        },
        notificationPreferences: { 
          email: command.notificationPreferences?.email ?? true, 
          sms: command.notificationPreferences?.sms ?? false 
        },
        stats: createDefaultGlobalPartyStats(),
        createdAt: now,
        updatedAt: now,
      };

      await deps.globalParties.create({
        partyId: globalParty.partyId,
        tenantId: globalParty.tenantId,
        name: globalParty.name,
        email: globalParty.email,
        emails: globalParty.emails,
        phone: globalParty.phone,
        locale: globalParty.locale,
        role: globalParty.role,
        source: globalParty.source,
        status: globalParty.status,
        tags: globalParty.tags,
        metadata: globalParty.metadata,
        attributes: globalParty.attributes,
        preferences: globalParty.preferences,
        notificationPreferences: globalParty.notificationPreferences,
        stats: globalParty.stats,
      });

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (deps.auditService) {
        deps.auditService.logCreate(globalParty.partyId, command.tenantId, command.actor);
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (deps.eventService) {
        deps.eventService.publishCreated(globalParty.partyId, command.tenantId, command.actor);
      }

      return { globalParty };
    },

    async update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult> {
      // 1. VALIDATION (opcional) - PATRÓN REUTILIZABLE
      if (deps.validationService) {
        deps.validationService.validateUpdate(command);
      }

      const existing = await deps.globalParties.getById(command.tenantId, command.partyId);
      if (!existing) {
        throw new NotFoundError(`Global Party with ID ${command.partyId} not found`);
      }

      const now = nowIso();
      const updatedGlobalParty: GlobalPartyExtended = {
        ...existing,
        ...command.updates,
        tags: command.updates.tags ? createNormalizedTags(command.updates.tags) : existing.tags,
        preferences: command.updates.preferences ? {
          defaultAuth: command.updates.preferences.defaultAuth ?? existing.preferences.defaultAuth,
          defaultLocale: command.updates.preferences.defaultLocale ?? existing.preferences.defaultLocale,
        } : existing.preferences,
        notificationPreferences: command.updates.notificationPreferences ? {
          email: command.updates.notificationPreferences.email ?? existing.notificationPreferences.email,
          sms: command.updates.notificationPreferences.sms ?? existing.notificationPreferences.sms,
        } : existing.notificationPreferences,
        stats: command.updates.stats ? {
          signedCount: command.updates.stats.signedCount ?? existing.stats.signedCount,
          totalEnvelopes: command.updates.stats.totalEnvelopes ?? existing.stats.totalEnvelopes,
        } : existing.stats,
        updatedAt: now,
      };

      // Create compatible updates object using enums
      const compatibleUpdates: Partial<Pick<GlobalPartyExtended, 
        GlobalPartyUpdatableField
      >> = {
        ...command.updates,
        tags: command.updates.tags ? createNormalizedTags(command.updates.tags) : undefined,
        role: command.updates.role || existing.role,
        source: command.updates.source || existing.source,
        status: command.updates.status || existing.status,
        preferences: command.updates.preferences ? {
          defaultAuth: command.updates.preferences.defaultAuth ?? existing.preferences.defaultAuth,
          defaultLocale: command.updates.preferences.defaultLocale ?? existing.preferences.defaultLocale,
        } : undefined,
        notificationPreferences: command.updates.notificationPreferences ? {
          email: command.updates.notificationPreferences.email ?? existing.notificationPreferences.email,
          sms: command.updates.notificationPreferences.sms ?? existing.notificationPreferences.sms,
        } : undefined,
        stats: command.updates.stats ? {
          signedCount: command.updates.stats.signedCount ?? existing.stats.signedCount,
          totalEnvelopes: command.updates.stats.totalEnvelopes ?? existing.stats.totalEnvelopes,
        } : undefined,
      };

      await deps.globalParties.update({
        tenantId: command.tenantId,
        partyId: command.partyId,
        updates: compatibleUpdates,
      });

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (deps.auditService) {
        deps.auditService.logUpdate(updatedGlobalParty.partyId, command.tenantId, command.actor);
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (deps.eventService) {
        deps.eventService.publishUpdated(updatedGlobalParty.partyId, command.tenantId, command.actor);
      }

      return { globalParty: updatedGlobalParty };
    },

    async delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult> {
      // 1. VALIDATION (opcional) - PATRÓN REUTILIZABLE
      if (deps.validationService) {
        deps.validationService.validateDelete(command);
      }

      const existing = await deps.globalParties.getById(command.tenantId, command.partyId);
      if (!existing) {
        throw new NotFoundError(`Global Party with ID ${command.partyId} not found`);
      }

      // Soft delete by updating status
      const now = nowIso();
      const deletedGlobalParty: GlobalPartyExtended = {
        ...existing,
        status: GLOBAL_PARTY_STATUSES[2], // 'deleted'
        updatedAt: now,
      };

      await deps.globalParties.update({
        tenantId: command.tenantId,
        partyId: command.partyId,
        updates: { status: GLOBAL_PARTY_STATUSES[2] }, // 'deleted'
      });

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (deps.auditService) {
        deps.auditService.logDelete(deletedGlobalParty.partyId, command.tenantId, command.actor);
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (deps.eventService) {
        deps.eventService.publishDeleted(deletedGlobalParty.partyId, command.tenantId, command.actor);
      }

      return { deleted: true };
    },
  };
};






