/**
 * @file PartyAuth.ts
 * @summary Party authentication value object for envelope participants
 * @description Party authentication value object for managing authentication methods.
 * Defines how parties authenticate (OTP via email/SMS).
 */

import { z } from "@lawprotect/shared-ts";
import { AUTH_METHODS } from "../../values/enums";

/**
 * @description Party authentication schema for envelope participants.
 * Validates that at least one authentication method is provided.
 */
export const PartyAuthSchema = z.object({
  methods: z.array(z.enum(AUTH_METHODS)).min(1, "At least one authentication method is required"),
});
export type PartyAuth = z.infer<typeof PartyAuthSchema>;

/**
 * @description Default authentication configuration for parties.
 * Provides sensible defaults for party authentication.
 */
export const DEFAULT_PARTY_AUTH: PartyAuth = {
  methods: ["otpViaEmail"],
};

/**
 * @description Validates that the authentication configuration is valid.
 * Ensures at least one authentication method is provided.
 * 
 * @param auth - Authentication configuration to validate
 * @returns true if valid, false otherwise
 */
export const isValidPartyAuth = (auth: PartyAuth): boolean => {
  return auth.methods.length > 0;
};

/**
 * @description Creates authentication configuration from methods array.
 * 
 * @param methods - Array of authentication methods
 * @returns PartyAuth configuration
 */
export const createPartyAuth = (methods: string[]): PartyAuth => {
  return {
    methods: methods as PartyAuth["methods"],
  };
};
