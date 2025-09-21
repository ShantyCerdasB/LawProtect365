/**
 * @fileoverview ConsentData - Interface for signer consent information
 * @summary Defines data structure for signer consent operations
 * @description This interface provides type-safe specifications for signer consent,
 * including consent text and audit information.
 */

export interface ConsentData {
  consentText: string;
  ipAddress: string;
  userAgent: string;
}
