/**
 * @fileoverview UnlinkingMode - Enum for provider unlinking modes
 * @summary Defines the modes for unlinking OAuth providers
 * @description This enum defines the different ways a user can unlink an OAuth provider
 * from their account, supporting both direct and confirmation-based unlinking.
 */

export enum UnlinkingMode {
  DIRECT = 'direct',
  CONFIRM = 'confirm'
}
