/**
 * @fileoverview Signature API - HTTP client functions for signature-service endpoints
 * @summary API functions for envelope and document signing operations
 * @description Provides typed HTTP functions for envelope management, document signing, and audit trail access.
 */

import type { HttpClient } from '../../../foundation/http/httpClient';
import type { ZodSchema } from 'zod';

/**
 * @description Creates a new signature envelope.
 * @param client HTTP client instance
 * @param body Envelope creation data
 * @param schema Optional Zod schema to validate the response
 * @returns Created envelope with ID and initial status
 */
export function createEnvelope<T = unknown, B = unknown>(
  client: HttpClient,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes`, body, schema);
}

/**
 * @description Retrieves envelope details by ID.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param params Query parameters for conditional data inclusion
 * @param schema Optional Zod schema to validate the response
 * @returns Envelope details with signers and status
 */
export function getEnvelope<T = unknown>(
  client: HttpClient,
  envelopeId: string,
  params?: { invitationToken?: string; includeSigners?: boolean },
  schema?: ZodSchema<T>
): Promise<T> {
  const queryParams = new URLSearchParams();
  if (params?.invitationToken) queryParams.append('invitationToken', params.invitationToken);
  if (params?.includeSigners !== undefined) queryParams.append('includeSigners', params.includeSigners.toString());
  const query = queryParams.toString();
  return client.get<T>(`/envelopes/${envelopeId}${query ? `?${query}` : ''}`, schema);
}

/**
 * @description Retrieves envelopes for the authenticated user.
 * @param client HTTP client instance
 * @param params Query parameters for filtering, pagination, and sorting
 * @param schema Optional Zod schema to validate the response
 * @returns Paginated list of user's envelopes
 */
export function getEnvelopesByUser<T = unknown>(
  client: HttpClient,
  params?: {
    status?: string;
    limit?: number;
    cursor?: string;
    includeSigners?: boolean;
  },
  schema?: ZodSchema<T>
): Promise<T> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.cursor) queryParams.append('cursor', params.cursor);
  if (params?.includeSigners !== undefined) queryParams.append('includeSigners', params.includeSigners.toString());
  const query = queryParams.toString();
  return client.get<T>(`/envelopes${query ? `?${query}` : ''}`, schema);
}

/**
 * @description Updates an existing envelope.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param body Envelope update data
 * @param schema Optional Zod schema to validate the response
 * @returns Updated envelope details
 */
export function updateEnvelope<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}`, body, schema);
}

/**
 * @description Sends an envelope to signers with optional custom messages.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param body Send configuration (message, sendToAll, signers)
 * @param schema Optional Zod schema to validate the response
 * @returns Send result with tokens and notification status
 */
export function sendEnvelope<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}/send`, body, schema);
}

/**
 * @description Cancels an envelope.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param body Optional cancellation reason
 * @param schema Optional Zod schema to validate the response
 * @returns Cancellation confirmation
 */
export function cancelEnvelope<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  body?: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}/cancel`, body, schema);
}

/**
 * @description Signs a document within an envelope.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param body Signing data (consent, signature, invitationToken if external)
 * @param schema Optional Zod schema to validate the response
 * @returns Signing result with signature details and updated envelope status
 */
export function signDocument<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}/sign`, body, schema);
}

/**
 * @description Declines signing for a specific signer.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param signerId Signer identifier
 * @param body Decline reason and optional invitation token
 * @param schema Optional Zod schema to validate the response
 * @returns Decline confirmation with updated envelope status
 */
export function declineSigner<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  signerId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}/signers/${signerId}/decline`, body, schema);
}

/**
 * @description Downloads a signed document from an envelope.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param params Query parameters for download format
 * @param schema Optional Zod schema to validate the response
 * @returns Document download URL or binary data
 */
export function downloadDocument<T = unknown>(
  client: HttpClient,
  envelopeId: string,
  params?: { invitationToken?: string; expiresIn?: number },
  schema?: ZodSchema<T>
): Promise<T> {
  const queryParams = new URLSearchParams();
  if (params?.invitationToken) queryParams.append('invitationToken', params.invitationToken);
  if (params?.expiresIn) queryParams.append('expiresIn', params.expiresIn.toString());
  const query = queryParams.toString();
  return client.get<T>(`/envelopes/${envelopeId}/download${query ? `?${query}` : ''}`, schema);
}

/**
 * @description Shares document view access (generates invitation token for external users).
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param body Share configuration (signerId, invitationToken if external)
 * @param schema Optional Zod schema to validate the response
 * @returns Share result with access URL or token
 */
export function shareDocumentView<T = unknown, B = unknown>(
  client: HttpClient,
  envelopeId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/envelopes/${envelopeId}/share-view`, body, schema);
}

/**
 * @description Retrieves the audit trail for an envelope.
 * @param client HTTP client instance
 * @param envelopeId Envelope identifier
 * @param params Query parameters for pagination and filtering
 * @param schema Optional Zod schema to validate the response
 * @returns Paginated list of audit events
 */
export function getAuditTrail<T = unknown>(
  client: HttpClient,
  envelopeId: string,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.get<T>(`/envelopes/${envelopeId}/audit-trail`, schema);
}

/**
 * @description Sends a notification (internal endpoint).
 * @param client HTTP client instance
 * @param body Notification data (recipient, type, content)
 * @param schema Optional Zod schema to validate the response
 * @returns Notification send confirmation
 */
export function sendNotification<T = unknown, B = unknown>(
  client: HttpClient,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/notifications/send`, body, schema);
}

