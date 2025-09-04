/**
 * @file EnvelopesTypes.ts
 * @summary Domain types and mapping functions for envelopes
 * @description Centralized types and utilities for envelope operations
 */

import type { EnvelopeId } from "../../../domain/value-objects";

/**
 * @summary Cursor payload for envelope listing operations
 * @description Used for pagination in tenant-scoped envelope queries
 */
export type EnvelopeListCursorPayload = { 
  createdAt: string; 
  envelopeId: EnvelopeId 
};

/**
 * @summary Mapping function to create cursor from envelope
 * @description Converts envelope entity to cursor payload for pagination
 */
export const toEnvelopeCursor = (envelope: { createdAt: string; envelopeId: EnvelopeId }): EnvelopeListCursorPayload => ({
  createdAt: envelope.createdAt,
  envelopeId: envelope.envelopeId  as EnvelopeId,
});
