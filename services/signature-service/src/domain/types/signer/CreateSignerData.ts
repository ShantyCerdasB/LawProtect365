/**
 * @fileoverview CreateSignerData - Interface for creating new signers
 * @summary Defines data structure for creating new envelope signers
 * @description This interface provides type-safe creation specifications for signers,
 * including all required fields for signer management and invitation handling.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';

export interface CreateSignerData {
  envelopeId: EnvelopeId;
  userId?: string;
  email?: string;
  fullName?: string;
  isExternal: boolean;
  participantRole: string;
  order?: number;
  invitedByUserId?: string;
}
