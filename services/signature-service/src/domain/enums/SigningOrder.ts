/**
 * @fileoverview SigningOrder enum - Defines signing order types
 * @summary Enum for signing order configuration
 * @description Defines the possible signing order types for envelopes
 */

/**
 * Signing order types for envelopes
 */
export enum SigningOrderType {
  OWNER_FIRST = 'OWNER_FIRST',
  INVITEES_FIRST = 'INVITEES_FIRST'
}

/**
 * Array of all signing order values for validation
 */
export const SIGNING_ORDER_VALUES = Object.values(SigningOrderType);
