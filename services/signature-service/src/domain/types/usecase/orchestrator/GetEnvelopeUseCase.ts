/**
 * @fileoverview GetEnvelopeUseCase Types - Input and result types for GetEnvelopeUseCase
 * @summary Type definitions for envelope retrieval operations
 * @description This module contains the input and result type definitions for the
 * GetEnvelopeUseCase, including request parameters, response structure, and
 * access type information for envelope retrieval operations in signature envelopes.
 */

import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { SignatureEnvelope } from '../../../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../entities/EnvelopeSigner';
import { AccessType } from '../../../enums/AccessType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Input parameters for retrieving an envelope
 * @param envelopeId - The unique identifier of the envelope
 * @param userId - Optional user identifier for owner access
 * @param invitationToken - Optional invitation token for external access
 * @param securityContext - Optional security context for audit tracking
 */
export interface GetEnvelopeInput {
  envelopeId: EnvelopeId;
  userId?: string;
  invitationToken?: string;
  securityContext?: NetworkSecurityContext;
}

/**
 * Result structure for successful envelope retrieval operation
 * @param envelope - The retrieved envelope entity
 * @param signers - Array of signers associated with the envelope
 * @param accessType - The type of access used (owner or external)
 */
export interface GetEnvelopeResult {
  envelope: SignatureEnvelope;
  signers: EnvelopeSigner[];
  accessType: AccessType;
}
