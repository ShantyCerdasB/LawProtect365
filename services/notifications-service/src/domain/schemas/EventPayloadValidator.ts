/**
 * @fileoverview EventPayloadValidator - Centralized validator for event payloads
 * @summary Provides validation for event payloads based on event type and source
 * @description This module provides a centralized way to validate event payloads
 * using specific schemas for each event type. It maps event types to their corresponding
 * validation schemas and provides a unified validation interface.
 */

import { z } from '@lawprotect/shared-ts';
import { EventSource } from '../enums/EventSource';
import { SignatureServiceEventType } from '../enums/SignatureServiceEventType';
import { AuthServiceEventType } from '../enums/AuthServiceEventType';
import {
  EnvelopeInvitationEventSchema,
  DocumentViewInvitationEventSchema,
  SignerDeclinedEventSchema,
  EnvelopeCancelledEventSchema,
  ReminderNotificationEventSchema,
} from './SignatureServiceEventSchemas';
import {
  UserRegisteredEventSchema,
  UserUpdatedEventSchema,
  UserRoleChangedEventSchema,
  UserStatusChangedEventSchema,
  MfaStatusChangedEventSchema,
  GenericAuthServiceEventSchema,
} from './AuthServiceEventSchemas';
import { eventValidationFailed } from '../../notification-errors';

/**
 * Registry mapping event types to their validation schemas
 * @description Maps event source and type combinations to specific Zod schemas
 */
const eventSchemaRegistry: Record<string, z.ZodSchema> = {
  // Signature Service Events
  [`${EventSource.SIGNATURE_SERVICE}:${SignatureServiceEventType.ENVELOPE_INVITATION}`]: EnvelopeInvitationEventSchema,
  [`${EventSource.SIGNATURE_SERVICE}:${SignatureServiceEventType.DOCUMENT_VIEW_INVITATION}`]: DocumentViewInvitationEventSchema,
  [`${EventSource.SIGNATURE_SERVICE}:${SignatureServiceEventType.SIGNER_DECLINED}`]: SignerDeclinedEventSchema,
  [`${EventSource.SIGNATURE_SERVICE}:${SignatureServiceEventType.ENVELOPE_CANCELLED}`]: EnvelopeCancelledEventSchema,
  [`${EventSource.SIGNATURE_SERVICE}:${SignatureServiceEventType.REMINDER_NOTIFICATION}`]: ReminderNotificationEventSchema,
  
  // Auth Service Events
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_REGISTERED}`]: UserRegisteredEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_UPDATED}`]: UserUpdatedEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_ROLE_CHANGED}`]: UserRoleChangedEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_STATUS_CHANGED}`]: UserStatusChangedEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.MFA_STATUS_CHANGED}`]: MfaStatusChangedEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.OAUTH_ACCOUNT_LINKED}`]: GenericAuthServiceEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED}`]: GenericAuthServiceEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_PROVIDER_LINKED}`]: GenericAuthServiceEventSchema,
  [`${EventSource.AUTH_SERVICE}:${AuthServiceEventType.USER_PROVIDER_UNLINKED}`]: GenericAuthServiceEventSchema,
};

/**
 * Validates an event payload against its specific schema
 * @description Validates the event detail payload using the schema registered for the
 * given event source and type. Returns the validated payload or throws an error.
 * @param {string} source - Event source (e.g., 'sign.service', 'auth-service')
 * @param {string} eventType - Event type (e.g., 'ENVELOPE_INVITATION', 'UserRegistered')
 * @param {Record<string, unknown>} payload - Event detail payload to validate
 * @returns {Record<string, unknown>} Validated payload
 * @throws {eventValidationFailed} When payload validation fails
 */
export function validateEventPayload(
  source: string,
  eventType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const schemaKey = `${source}:${eventType}`;
  const schema = eventSchemaRegistry[schemaKey];

  if (!schema) {
    // No specific schema found - allow through (will be validated by strategy)
    return payload;
  }

  const result = schema.safeParse(payload);

  if (!result.success) {
    throw eventValidationFailed({
      source,
      eventType,
      validationErrors: result.error.errors,
      payload: Object.keys(payload),
    });
  }

  return result.data;
}

