/**
 * @fileoverview IncludeFlag - Enum for GET /me include flags
 * @summary Defines all possible include flags for conditional data inclusion
 * @description This enum provides type-safe include flag values for
 * the GET /me endpoint to control which additional data to include in the response.
 */

export enum IncludeFlag {
  /** Include OAuth identity providers */
  IDP = 'idp',
  /** Include personal profile information */
  PROFILE = 'profile',
  /** Include JWT claims information */
  CLAIMS = 'claims'
}
