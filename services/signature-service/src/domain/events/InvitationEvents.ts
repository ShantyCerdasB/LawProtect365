/**
 * @file InvitationEvents.ts
 * @summary Event types for invitation management
 * @description Defines event structures for invitation-related operations
 */

/**
 * @summary Event published when an invitation is created
 * @description This event is published to EventBridge when a new invitation is created
 */
export interface InvitationCreatedEvent {
  source: 'signature-service';
  detailType: 'invitation.created';
  detail: {
    /** Unique identifier of the invitation */
    invitationId: string;
    
    /** ID of the envelope the invitation is for */
    envelopeId: string;
    
    /** Email address of the invited user */
    email: string;
    
    /** Optional name of the invited user */
    name?: string;
    
    /** Role assigned to the invited user */
    role: 'signer' | 'viewer';
    
    /** Link to access the invitation */
    invitationLink: string;
    
    /** Title of the envelope */
    envelopeTitle: string;
    
    /** When the invitation was created */
    createdAt: string;
    
    /** When the invitation expires */
    expiresAt: string;
  };
}

/**
 * @summary Event published when an invitation is used
 * @description This event is published to EventBridge when an invitation is used for signing
 */
export interface InvitationUsedEvent {
  source: 'signature-service';
  detailType: 'invitation.used';
  detail: {
    /** Unique identifier of the invitation */
    invitationId: string;
    
    /** ID of the envelope the invitation was for */
    envelopeId: string;
    
    /** Email address of the user who used the invitation */
    email: string;
    
    /** When the invitation was used */
    usedAt: string;
    
    /** IP address of the user when invitation was used */
    ipAddress: string;
    
    /** User agent of the browser when invitation was used */
    userAgent: string;
  };
}

/**
 * @summary Event published when invitation consent is recorded
 * @description This event is published to EventBridge when a user records consent for an invitation
 */
export interface InvitationConsentRecordedEvent {
  source: 'signature-service';
  detailType: 'invitation.consent.recorded';
  detail: {
    /** Unique identifier of the consent record */
    consentId: string;
    
    /** ID of the envelope the consent is for */
    envelopeId: string;
    
    /** Token of the invitation the consent is for */
    invitationToken: string;
    
    /** Email address of the user who recorded consent */
    email: string;
    
    /** IP address of the user when consent was recorded */
    ipAddress: string;
    
    /** User agent of the browser when consent was recorded */
    userAgent: string;
    
    /** When the consent was recorded */
    timestamp: string;
  };
}

/**
 * @summary Event published when an invitation expires
 * @description This event is published to EventBridge when an invitation expires
 */
export interface InvitationExpiredEvent {
  source: 'signature-service';
  detailType: 'invitation.expired';
  detail: {
    /** Unique identifier of the invitation */
    invitationId: string;
    
    /** ID of the envelope the invitation was for */
    envelopeId: string;
    
    /** Email address of the invited user */
    email: string;
    
    /** When the invitation expired */
    expiredAt: string;
  };
}

/**
 * @summary Union type of all invitation events
 * @description All possible invitation-related events
 */
export type InvitationEvent = 
  | InvitationCreatedEvent
  | InvitationUsedEvent
  | InvitationConsentRecordedEvent
  | InvitationExpiredEvent;
