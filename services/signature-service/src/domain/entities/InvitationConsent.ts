/**
 * @file InvitationConsent.ts
 * @summary Domain entity for invitation consent management
 * @description Defines the InvitationConsent entity for managing consent recording in invitation flow
 */

import { InvitationConsentStatus } from "../values/enums";

/**
 * @summary Invitation consent domain entity
 * @description Represents consent recorded by a user when accessing an invitation
 */
export interface InvitationConsent {
  /** Unique identifier for the consent record */
  consentId: string;
  
  /** ID of the envelope this consent is for */
  envelopeId: string;
  
  /** Token of the invitation this consent is for */
  invitationToken: string;
  
  /** Email address of the user who recorded consent */
  email: string;
  
  /** IP address of the user when consent was recorded */
  ipAddress: string;
  
  /** User agent of the browser when consent was recorded */
  userAgent: string;
  
  /** When the consent was recorded */
  timestamp: Date;
  
  /** Status of the consent (always 'recorded' for invitation flow) */
  status: InvitationConsentStatus;
}

/**
 * @summary Invitation consent creation input
 * @description Input for creating a new consent record
 */
export interface CreateInvitationConsentInput {
  envelopeId: string;
  invitationToken: string;
  email: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * @summary Invitation consent query input
 * @description Input for querying consent records
 */
export interface InvitationConsentQueryInput {
  envelopeId?: string;
  invitationToken?: string;
  email?: string;
}
