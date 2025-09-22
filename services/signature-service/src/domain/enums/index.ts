/**
 * @fileoverview Enums barrel export - Exports all domain enums
 * @summary Centralized exports for all domain enums
 * @description This barrel file exports all domain enums for easy importing
 * throughout the application.
 */

// Local enums
export { AuditEventType } from './AuditEventType';
export { ImmutableEnvelopeFields, IMMUTABLE_ENVELOPE_FIELDS } from './ImmutableEnvelopeFields';

// Prisma enums - Use @prisma/client for: EnvelopeStatus, SignerStatus, SigningOrderType, 
// UserRole, InvitationTokenStatus, DocumentOriginType, OAuthProvider