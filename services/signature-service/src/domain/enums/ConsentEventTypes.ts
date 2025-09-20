/**
 * @fileoverview ConsentEventTypes enum - Defines all consent event types
 * @summary Enumerates the types of consent domain events
 * @description The ConsentEventTypes enum defines all possible types of consent
 * domain events that can be published for event-driven architecture.
 */

/**
 * Consent event type enumeration
 * 
 * Defines all possible types of consent domain events that can be published
 * for event-driven architecture and cross-service communication.
 */
export enum ConsentEventTypes {
  /**
   * Consent was given
   * - Published when a signer gives consent to sign
   * - Contains consent and signer information
   */
  GIVEN = 'consent.given',

  /**
   * Consent was revoked
   * - Published when a signer revokes their consent
   * - Contains consent and signer information
   */
  REVOKED = 'consent.revoked'
}
