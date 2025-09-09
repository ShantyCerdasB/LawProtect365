/**
 * @file ConsentCommandService.ts
 * @summary Simple command service wrapper for consent adapters
 * @description Acts as a bridge between controllers and consent command adapters
 */

import type { ConsentCommandsPort } from "../../../app/ports/consent/ConsentCommandsPort";
import type { CreateConsentAppInput, CreateConsentAppResult, UpdateConsentAppInput, UpdateConsentAppResult, DeleteConsentAppInput, SubmitConsentAppInput, SubmitConsentAppResult, DelegateConsentAppInput, DelegateConsentAppResult } from "../../../domain/types/consent/AppServiceInputs";
import type { ActorContext } from "@lawprotect/shared-ts";
import { BadRequestError, assertTenantBoundary } from "@lawprotect/shared-ts";

/**
 * @summary Simple command service for consent operations
 * @description Wrapper around consent command adapter to match factory interface
 */
export class ConsentCommandService {
  constructor(private readonly consentCommands: ConsentCommandsPort) {}

  /**
   * @summary Execute consent command operation
   * @description Routes to appropriate adapter method based on input type
   * @param input - The consent command input
   * @param actorContext - Optional actor context for audit purposes
   */
  async execute(
    input: CreateConsentAppInput | UpdateConsentAppInput | DeleteConsentAppInput | SubmitConsentAppInput | DelegateConsentAppInput,
    actorContext?: ActorContext
  ): Promise<CreateConsentAppResult | UpdateConsentAppResult | void | SubmitConsentAppResult | DelegateConsentAppResult> {
    // Apply generic rules
    assertTenantBoundary(input.tenantId, input.tenantId);

    if ('type' in input && 'status' in input) {
      // CreateConsentAppInput
      return this.consentCommands.create(input, actorContext);
    } else if ('status' in input || 'metadata' in input || 'expiresAt' in input) {
      // UpdateConsentAppInput
      return this.consentCommands.update(input, actorContext);
    } else if ('delegateEmail' in input) {
      // DelegateConsentAppInput - Pass actor context for audit
      return this.consentCommands.delegate(input, actorContext);
    } else if ('consentId' in input && !('delegateEmail' in input)) {
      if ('envelopeId' in input && Object.keys(input).length === 3) {
        // DeleteConsentAppInput
        return this.consentCommands.delete(input, actorContext);
      } else {
        // SubmitConsentAppInput
        return this.consentCommands.submit(input, actorContext);
      }
    }
    
    throw new BadRequestError('Invalid input type for consent command service', undefined, { input });
  }
};
