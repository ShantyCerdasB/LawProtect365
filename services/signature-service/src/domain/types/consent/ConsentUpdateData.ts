/**
 * @fileoverview ConsentUpdateData - Interface for consent update operations
 * @summary Defines data structure for updating consent properties
 * @description This interface provides type-safe update specifications for consents,
 * including signature linking and metadata updates.
 */

export interface ConsentUpdateData {
  signatureId?: string;
  consentText?: string;
  ipAddress?: string;
  userAgent?: string;
}
