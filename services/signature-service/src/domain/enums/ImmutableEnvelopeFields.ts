/**
 * @fileoverview ImmutableEnvelopeFields - Enum for immutable envelope fields
 * @summary Defines fields that cannot be modified after envelope creation
 * @description This enum contains all envelope fields that are immutable
 * and cannot be changed once the envelope is created.
 */

/**
 * Immutable envelope fields that cannot be modified after creation
 */
export enum ImmutableEnvelopeFields {
  CREATED_BY = 'createdBy',
  ORIGIN_TYPE = 'originType',
  TEMPLATE_ID = 'templateId',
  TEMPLATE_VERSION = 'templateVersion'
}

/**
 * Array of immutable field names for validation
 */
export const IMMUTABLE_ENVELOPE_FIELDS = Object.values(ImmutableEnvelopeFields);
