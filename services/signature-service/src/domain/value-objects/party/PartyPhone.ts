/**
 * @file PartyPhone.ts
 * @summary Phone number value object with validation and formatting
 * @description Provides validation and normalization for phone numbers used by parties.
 * Supports international format and basic validation.
 */

import { z } from "zod";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Branded type for phone numbers
 * Prevents mixing with other string types at compile time
 */
export type PartyPhone = Brand<string, "PartyPhone">;

/**
 * Zod schema for phone number validation
 * Accepts international format with optional + prefix
 */
export const PartyPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Phone number must be in international format (e.g., +1234567890)"
  )
  .transform((v) => v as PartyPhone);

/**
 * Creates a PartyPhone from a string
 * @param phone - The phone string to validate
 * @returns The validated PartyPhone
 * @throws {ZodError} When the phone number is invalid
 */
export const toPartyPhone = (phone: string): PartyPhone => {
  return PartyPhoneSchema.parse(phone);
};

/**
 * Safely creates a PartyPhone from a string
 * @param phone - The phone string to validate
 * @returns The validated PartyPhone or null if invalid
 */
export const toPartyPhoneSafe = (phone: string): PartyPhone | null => {
  const result = PartyPhoneSchema.safeParse(phone);
  return result.success ? result.data : null;
};

/**
 * Type guard to check if a value is a valid PartyPhone
 * @param value - The value to check
 * @returns True if the value is a valid PartyPhone
 */
export const isPartyPhone = (value: unknown): value is PartyPhone => {
  return PartyPhoneSchema.safeParse(value).success;
};

/**
 * Formats a phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number string
 */
export const formatPartyPhone = (phone: PartyPhone): string => {
  const phoneStr = phone.toString();
  
  // Add + prefix if missing
  if (!phoneStr.startsWith("+")) {
    return `+${phoneStr}`;
  }
  
  return phoneStr;
};

/**
 * Extracts country code from phone number
 * @param phone - The phone number
 * @returns Country code (e.g., "1" for US, "44" for UK)
 */
export const getCountryCode = (phone: PartyPhone): string => {
  const phoneStr = phone.toString().replace(/^\+/, "");
  
  // Basic country code extraction (1-3 digits)
  if (phoneStr.startsWith("1")) return "1"; // US/Canada
  if (phoneStr.startsWith("44")) return "44"; // UK
  if (phoneStr.startsWith("33")) return "33"; // France
  if (phoneStr.startsWith("49")) return "49"; // Germany
  if (phoneStr.startsWith("34")) return "34"; // Spain
  if (phoneStr.startsWith("39")) return "39"; // Italy
  if (phoneStr.startsWith("52")) return "52"; // Mexico
  if (phoneStr.startsWith("55")) return "55"; // Brazil
  if (phoneStr.startsWith("91")) return "91"; // India
  if (phoneStr.startsWith("86")) return "86"; // China
  if (phoneStr.startsWith("81")) return "81"; // Japan
  if (phoneStr.startsWith("82")) return "82"; // South Korea
  if (phoneStr.startsWith("61")) return "61"; // Australia
  
  // Default: return first 1-3 digits
  return phoneStr.substring(0, Math.min(3, phoneStr.length));
};
