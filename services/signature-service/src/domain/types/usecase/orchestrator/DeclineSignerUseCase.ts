/**
 * @fileoverview DeclineSignerUseCase Types - Input and result types for DeclineSignerUseCase
 * @summary Type definitions for signer decline operations
 * @description This module contains the input and result type definitions for the
 * DeclineSignerUseCase, including request parameters, response structure, and
 * decline information for signer decline operations in signature envelopes.
 */

import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { SignerId } from '../../../value-objects/SignerId';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Input parameters for declining a signer in an envelope
 * @param envelopeId - The unique identifier of the envelope
 * @param signerId - The unique identifier of the signer to decline
 * @param request - The decline request containing reason and optional invitation token
 * @param securityContext - Network security context for the request
 */
export interface DeclineSignerInput {
  envelopeId: EnvelopeId;
  signerId: SignerId;
  request: {
    reason: string;
    invitationToken?: string;
  };
  securityContext: NetworkSecurityContext;
}

/**
 * Result structure for successful signer decline operation
 * @param success - Indicates if the decline operation was successful
 * @param message - Human-readable message about the operation result
 * @param envelope - Updated envelope information with ID and status
 * @param declineInfo - Details about the decline operation including signer, reason, and timestamp
 */
export interface DeclineSignerResult {
  success: boolean;
  message: string;
  envelope: { 
    id: string; 
    status: string; 
  };
  declineInfo: { 
    signerId: string; 
    reason: string; 
    declinedAt: string; 
  };
}
