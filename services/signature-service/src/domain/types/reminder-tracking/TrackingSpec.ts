/**
 * @fileoverview TrackingSpec - Interface for reminder tracking query specifications
 * @summary Defines query criteria for reminder tracking searches
 * @description This interface provides type-safe query specifications for filtering
 * reminder tracking records by various criteria including signer, envelope, and date ranges.
 */

export interface TrackingSpec {
  signerId?: string;
  envelopeId?: string;
  minReminderCount?: number;
  maxReminderCount?: number;
  createdBefore?: Date;
  createdAfter?: Date;
  updatedBefore?: Date;
  updatedAfter?: Date;
}
