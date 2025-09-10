/**
 * @file common.ts
 * @summary Shared schemas and common fields for envelope operations
 * @description Centralized schemas to eliminate duplication across envelope schemas.
 * Contains reusable path parameters, common fields, and base schemas.
 */

import { z } from "@lawprotect/shared-ts";
import { ENVELOPE_STATUSES, ENVELOPE_VALIDATION_RULES, PAGINATION_LIMITS } from "../../../domain/values/enums";

// Re-export commonly used enums and constants
export { ENVELOPE_STATUSES, ENVELOPE_VALIDATION_RULES, PAGINATION_LIMITS };

/* ────────────────────────────────────────────────────────────────────────────
 * PATH PARAMETERS
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * @description Path parameters schema for operations requiring  envelopeId
 */
export const EnvelopeWithIdParams = z.object({
  envelopeId: z.string().min(1)});

/* ────────────────────────────────────────────────────────────────────────────
 * COMMON FIELDS
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * @description Envelope identifier field
 */
export const EnvelopeIdField = z.string();

/**
 * @description Envelope status field
 */
export const EnvelopeStatusField = z.string();

/**
 * @description Envelope title field
 */
export const EnvelopeTitleField = z.string();

/**
 * @description Envelope name field with validation rules
 */
export const EnvelopeNameField = z.string()
  .min(ENVELOPE_VALIDATION_RULES.MIN_NAME_LENGTH)
  .max(ENVELOPE_VALIDATION_RULES.MAX_NAME_LENGTH);

/**
 * @description Envelope description field with validation rules
 */
export const EnvelopeDescriptionField = z.string()
  .max(ENVELOPE_VALIDATION_RULES.MAX_DESCRIPTION_LENGTH);

/**
 * @description Envelope owner email field
 */
export const EnvelopeOwnerEmailField = z.string().email();

/**
 * @description Creation timestamp field
 */
export const CreatedAtField = z.string();

/**
 * @description Last update timestamp field
 */
export const UpdatedAtField = z.string();

/* ────────────────────────────────────────────────────────────────────────────
 * BASE SCHEMAS
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * @description Base envelope fields present in most responses
 */
export const BaseEnvelopeFields = z.object({
  id: EnvelopeIdField,
  status: EnvelopeStatusField,
  updatedAt: UpdatedAtField});

/**
 * @description Full envelope fields including all common properties
 */
export const FullEnvelopeFields = BaseEnvelopeFields.extend({
  title: EnvelopeTitleField,
  createdAt: CreatedAtField,
  ownerEmail: EnvelopeOwnerEmailField});

/**
 * @description Envelope name and description fields
 */
export const EnvelopeNameFields = z.object({
  name: EnvelopeNameField,
  description: EnvelopeDescriptionField.optional()});

/**
 * @description Envelope status field with enum validation
 */
export const EnvelopeStatusFields = z.object({
  status: z.enum(ENVELOPE_STATUSES).optional()});

/* ────────────────────────────────────────────────────────────────────────────
 * TYPE EXPORTS
 * ────────────────────────────────────────────────────────────────────────────*/

export type EnvelopeWithIdParams = z.infer<typeof EnvelopeWithIdParams>;
export type BaseEnvelopeFields = z.infer<typeof BaseEnvelopeFields>;
export type FullEnvelopeFields = z.infer<typeof FullEnvelopeFields>;
export type EnvelopeNameFields = z.infer<typeof EnvelopeNameFields>;
export type EnvelopeStatusFields = z.infer<typeof EnvelopeStatusFields>;

