/**
 * @fileoverview EnvelopeProgress - Interface for envelope signing progress information
 * @summary Contains progress statistics for envelope signing
 * @description This interface defines the structure for envelope progress information,
 * including counts of signers in different states and completion percentage.
 */

export interface EnvelopeProgress {
  /** Total number of signers */
  total: number;
  /** Number of signers who have signed */
  signed: number;
  /** Number of signers pending to sign */
  pending: number;
  /** Number of signers who have declined */
  declined: number;
  /** Completion percentage (0-100) */
  percentage: number;
}
