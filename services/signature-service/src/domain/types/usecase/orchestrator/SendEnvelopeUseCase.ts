/**
 * @fileoverview SendEnvelopeUseCase Types - Input and result types for SendEnvelopeUseCase
 * @summary Type definitions for envelope sending operations
 * @description This module contains the input and result type definitions for the
 * SendEnvelopeUseCase, including request parameters, response structure, and
 * token information for envelope sending operations in signature envelopes.
 */

import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Input parameters for sending an envelope
 * @param envelopeId - The unique identifier of the envelope
 * @param userId - The user identifier sending the envelope
 * @param securityContext - Security context for audit tracking
 * @param options - Optional configuration for sending
 */
export interface SendEnvelopeInput {
  envelopeId: EnvelopeId;
  userId: string;
  securityContext: NetworkSecurityContext;
  options?: {
    message?: string;
    sendToAll?: boolean;
    signers?: Array<{ signerId: string; message?: string }>;
  };
}

/**
 * Token result structure for individual signers
 * @param signerId - The signer identifier
 * @param email - Optional email address of the signer
 * @param token - The generated invitation token
 * @param expiresAt - Token expiration date
 */
export interface SendEnvelopeTokenResult {
  signerId: string;
  email?: string;
  token: string;
  expiresAt: Date;
}

/**
 * Result structure for successful envelope sending operation
 * @param success - Whether the operation was successful
 * @param message - Success message
 * @param envelopeId - The envelope identifier
 * @param status - The updated envelope status
 * @param tokensGenerated - Number of tokens generated
 * @param signersNotified - Number of signers notified
 * @param tokens - Array of token results for each signer
 */
export interface SendEnvelopeResult {
  success: boolean;
  message: string;
  envelopeId: string;
  status: string;
  tokensGenerated: number;
  signersNotified: number;
  tokens: SendEnvelopeTokenResult[];
}
