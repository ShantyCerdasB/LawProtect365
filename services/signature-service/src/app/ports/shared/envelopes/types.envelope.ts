/**
 * @file types.envelope.ts
 * @summary Envelope-specific types shared across envelope ports
 * @description Defines envelope-related interfaces used by envelope port implementations
 */

import type { EnvelopeId, TenantId, EnvelopeStatus } from "../common";

/**
 * Minimal envelope head used across app flows
 */
export type EnvelopeHead = {
  /** The unique identifier of the envelope */
  envelopeId: EnvelopeId;
  /** The tenant ID that owns the envelope */
  tenantId: TenantId;
  /** The current status of the envelope */
  status: EnvelopeStatus;
  /** The title/name of the envelope (optional) */
  title?: string;
  /** ISO timestamp when the envelope was created (optional) */
  createdAt?: string;
  /** ISO timestamp when the envelope was last updated (optional) */
  updatedAt?: string;
};

/**
 * Common patch shape for envelope updates
 */
export type EnvelopePatch = {
  /** The new title for the envelope (optional) */
  title?: string;
  /** The new status for the envelope (optional) */
  status?: EnvelopeStatus;
  /** Additional metadata for the envelope (optional) */
  metadata?: Record<string, unknown>;
};
