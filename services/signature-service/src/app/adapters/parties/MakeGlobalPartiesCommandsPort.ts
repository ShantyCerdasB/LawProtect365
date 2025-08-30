/**
 * @file MakeGlobalPartiesCommandsPort.ts
 * @summary Adapter factory for global parties commands port
 * @description Creates and configures the global parties commands port implementation
 * that handles write operations for global parties (address book).
 * 
 * This adapter delegates to use cases to maintain separation of concerns
 * and ensure business logic is properly applied.
 */

import type { GlobalPartiesCommandsPort } from "../../ports/parties/GlobalPartiesCommandsPort";
import type { CreateGlobalPartyUseCase } from "../../../use-cases/parties/CreateGlobalPartyUseCase";
import type { UpdateGlobalPartyUseCase } from "../../../use-cases/parties/UpdateGlobalPartyUseCase";
import type { DeleteGlobalPartyUseCase } from "../../../use-cases/parties/DeleteGlobalPartyUseCase";
import type { DelegateGlobalPartyUseCase } from "../../../use-cases/parties/DelegateGlobalPartyUseCase";
import type { UpdateDelegationUseCase } from "../../../use-cases/parties/UpdateDelegationUseCase";
import type { DeleteDelegationUseCase } from "../../../use-cases/parties/DeleteDelegationUseCase";

/**
 * Dependencies required to create the global parties commands port
 * @interface MakeGlobalPartiesCommandsPortDeps
 * @description External dependencies needed for the adapter creation
 */
export interface MakeGlobalPartiesCommandsPortDeps {
  /** Use case for creating global parties */
  createGlobalPartyUseCase: CreateGlobalPartyUseCase;
  /** Use case for updating global parties */
  updateGlobalPartyUseCase: UpdateGlobalPartyUseCase;
  /** Use case for deleting global parties */
  deleteGlobalPartyUseCase: DeleteGlobalPartyUseCase;
  /** Use case for delegating global parties */
  delegateGlobalPartyUseCase: DelegateGlobalPartyUseCase;
  /** Use case for updating delegations */
  updateDelegationUseCase: UpdateDelegationUseCase;
  /** Use case for deleting delegations */
  deleteDelegationUseCase: DeleteDelegationUseCase;
}

/**
 * Creates a global parties commands port implementation
 * @param deps - Dependencies required for creating the port
 * @returns Configured global parties commands port
 */
export function makeGlobalPartiesCommandsPort(
  deps: MakeGlobalPartiesCommandsPortDeps
): GlobalPartiesCommandsPort {
  return {
    async create(input) {
      const result = await deps.createGlobalPartyUseCase.execute({
        tenantId: input.tenantId,
        email: input.email,
        name: input.name,
        phone: input.phone,
        role: input.role,
        source: input.source,
        metadata: input.metadata,
        notificationPreferences: input.notificationPreferences,
      });

      return {
        partyId: result.partyId as any,
        party: result.party as any,
      };
    },

    async update(input) {
      const result = await deps.updateGlobalPartyUseCase.execute({
        tenantId: input.tenantId,
        partyId: input.partyId,
        updates: input.updates,
      });

      return {
        party: result.party as any,
      };
    },

    async delete(input) {
      await deps.deleteGlobalPartyUseCase.execute({
        tenantId: input.tenantId,
        partyId: input.partyId,
      });
    },

    async createDelegation(input) {
      const result = await deps.delegateGlobalPartyUseCase.execute({
        tenantId: input.tenantId,
        originalPartyId: input.originalPartyId,
        delegateEmail: input.delegateEmail,
        delegateName: input.delegateName,
        reason: input.reason,
        type: input.type,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
      });

      return {
        delegationId: result.delegationId,
        delegation: result.delegation as any,
        delegateParty: result.delegateParty as any,
      };
    },

    async updateDelegation(input) {
      const result = await deps.updateDelegationUseCase.execute({
        tenantId: input.tenantId,
        delegationId: input.delegationId,
        updates: input.updates,
      });

      return {
        delegation: result.delegation as any,
      };
    },

    async deleteDelegation(input) {
      await deps.deleteDelegationUseCase.execute({
        tenantId: input.tenantId,
        delegationId: input.delegationId,
      });
    },
  };
}
