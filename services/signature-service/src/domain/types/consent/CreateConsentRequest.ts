/**
 * @fileoverview CreateConsentRequest - Interface for consent creation
 * @summary Defines data structure for creating new consents
 * @description This interface provides type-safe creation specifications for consents,
 * including all required fields for legal compliance and audit trail.
 */

import { ConsentId } from '../../value-objects/ConsentId';
import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';

export interface CreateConsentRequest {
  id: ConsentId;
  envelopeId: EnvelopeId;
  signerId: SignerId;
  signatureId?: SignerId;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentText: string;
  ipAddress: string;
  userAgent: string;
  userEmail?: string;
  country?: string;
  invitationToken?: string; // For external users
}
