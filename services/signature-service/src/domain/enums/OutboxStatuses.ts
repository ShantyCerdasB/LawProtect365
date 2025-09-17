/**
 * @fileoverview OutboxStatuses enum - Status values for outbox records
 * @summary Enum for outbox record statuses
 * @description The OutboxStatuses enum defines the possible status values
 * for outbox records in the reliable event delivery pattern.
 */

/**
 * Outbox record statuses
 * 
 * Defines the possible status values for outbox records in the
 * reliable event delivery pattern.
 */
export enum OUTBOX_STATUSES {
  /** Event is pending processing */
  PENDING = 'PENDING',
  
  /** Event has been processed successfully */
  PROCESSED = 'PROCESSED',
  
  /** Event processing failed */
  FAILED = 'FAILED'
}

