/**
 * @fileoverview AccessType - Enum for envelope access types
 * @summary Defines access types for envelope operations
 * @description This enum provides type-safe access types for envelope operations,
 * distinguishing between owner access and external user access via invitation tokens.
 */

export enum AccessType {
  /** Owner/creator of the envelope */
  OWNER = 'OWNER',
  /** External user with invitation token */
  EXTERNAL = 'EXTERNAL'
}
