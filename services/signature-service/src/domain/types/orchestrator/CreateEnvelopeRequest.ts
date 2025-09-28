/**
 * @fileoverview CreateEnvelopeRequest - Request interface for envelope creation operations
 * @summary Contains all data required for creating an envelope with signers
 * @description This interface defines the structure for envelope creation requests,
 * including envelope data, signers data, user information, and security context.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { CreateEnvelopeData } from '../envelope/CreateEnvelopeData';

export interface CreateEnvelopeRequest {
  /** Envelope creation data */
  envelopeData: CreateEnvelopeData;
  /** User ID creating the envelope */
  userId: string;
  /** Security context for authorization */
  securityContext: NetworkSecurityContext;
  /** Optional actor email for audit purposes */
  actorEmail?: string;
}
