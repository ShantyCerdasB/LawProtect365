/**
 * @fileoverview Triggers barrel export - Exports all Cognito trigger handlers
 * @summary Centralized exports for all Cognito trigger handlers
 * @description This barrel file exports all Cognito trigger handlers for easy importing
 * throughout the application.
 */

export { PreAuthenticationTrigger, handler as preAuthenticationHandler } from './PreAuthenticationTrigger';
export { PostAuthenticationTrigger, handler as postAuthenticationHandler } from './PostAuthenticationTrigger';
export { PostConfirmationTrigger, handler as postConfirmationHandler } from './PostConfirmationTrigger';
export { PreTokenGenerationTrigger, handler as preTokenGenerationHandler } from './PreTokenGenerationTrigger';
