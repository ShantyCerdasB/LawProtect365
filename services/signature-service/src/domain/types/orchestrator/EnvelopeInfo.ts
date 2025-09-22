/**
 * @fileoverview EnvelopeInfo - Interface for envelope information in responses
 * @summary Contains envelope data for API responses
 * @description This interface defines the structure for envelope information
 * returned in API responses, including envelope status and progress.
 */

export interface EnvelopeInfo {
  /** Envelope ID */
  id: string;
  /** Envelope status */
  status: string;
  /** Signing progress percentage */
  progress: number;
}
