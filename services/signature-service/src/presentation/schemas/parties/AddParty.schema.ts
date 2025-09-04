/**
 * @file AddParty.schema.ts
 * @summary Zod schemas for the AddParty endpoint
 * @description Zod schemas for the AddParty endpoint.
 * Defines input validation schemas for adding a party to an envelope.
 * Handles path parameters and request body validation with proper error messages.
 */


import { PARTY_ROLES, PARTY_STATUSES } from "@/domain/values/enums";
import { z } from "zod";


/**
 * @description Path parameters schema for POST /envelopes/:envelopeId/parties.
 * Validates the envelope identifier in the URL path.
 */
export const AddPartyPath = z.object({
  /** Envelope identifier (required, non-empty) */
  envelopeId: z.string().min(1, "Envelope ID is required"),
});

/**
 * @description Request body schema for adding a party.
 * Validates all required and optional fields for party creation.
 */
export const AddPartyBody = z.object({
  /** Party email address (required, valid email format) */
  email: z.string().email("Valid email is required"),
  /** Party full name (required, 1-255 characters) */
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  /** Party role in the envelope (signer, viewer, or delegate) */
  role: z.enum(PARTY_ROLES),
  /** Optional signing order for sequential signing (minimum 1) */
  order: z.number().int().min(1, "Order must be at least 1").optional(),
  /** Optional metadata for additional party information */
  metadata: z.record(z.unknown()).optional(),
  /** Optional notification preferences */
  notificationPreferences: z.object({
    /** Email notifications enabled (default: true) */
    email: z.boolean().default(true),
    /** SMS notifications enabled (default: false) */
    sms: z.boolean().default(false),
  }).optional(),
});

/**
 * @description Response schema for party addition.
 * Defines the structure of the response returned after successful party creation.
 */
export const AddPartyResponse = z.object({
  /** Generated party identifier */
  partyId: z.string(),
  /** Envelope identifier */
  envelopeId: z.string(),
  /** Party email address */
  email: z.string(),
  /** Party full name */
  name: z.string(),
  /** Party role in the envelope */
  role: z.enum(PARTY_ROLES),
  /** Optional signing order */
  order: z.number().optional(),
  /** Current party status */
  status: z.enum(PARTY_STATUSES),
  /** Creation timestamp */
  createdAt: z.string(),
  /** Optional metadata */
  metadata: z.record(z.unknown()).optional(),
  /** Notification preferences */
  notificationPreferences: z.object({
    /** Email notifications enabled */
    email: z.boolean(),
    /** SMS notifications enabled */
    sms: z.boolean(),
  }).optional(),
});

export type AddPartyPathType = z.infer<typeof AddPartyPath>;
export type AddPartyBodyType = z.infer<typeof AddPartyBody>;
export type AddPartyResponseType = z.infer<typeof AddPartyResponse>;
