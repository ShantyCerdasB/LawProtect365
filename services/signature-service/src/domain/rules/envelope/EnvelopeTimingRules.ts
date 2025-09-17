/**
 * @fileoverview EnvelopeTimingRules - Timing validation rules for envelope operations
 * @summary Defines workflow rules for timing, expiration, and reminder workflows
 * @description Contains validation rules for envelope timing including processing,
 * expiration workflows, and reminder timing validation.
 */

import { EnvelopeOperation } from '@/domain/enums/EnvelopeOperation';
import { Envelope } from '@/domain/entities/Envelope';
import { WorkflowTimingConfig } from '@/domain/types/WorkflowTypes';
import { diffHours, REMINDER_INTERVALS } from '@lawprotect/shared-ts';
import { workflowViolation } from '@/signature-errors';

/**
 * Validates timing for workflow operations
 * @param envelope - The envelope to validate timing for
 * @param operation - The operation being performed
 * @param timingConfig - The timing configuration
 * @throws {SignatureError} When timing rules are violated
 * @returns void
 */
export function validateWorkflowTiming(
  envelope: Envelope, 
  operation: EnvelopeOperation, 
  timingConfig: WorkflowTimingConfig
): void {
  switch (operation) {
    case EnvelopeOperation.SEND:
      validateSendTiming(envelope, timingConfig);
      break;
    case EnvelopeOperation.SIGN:
      validateSignTiming(envelope, timingConfig);
      break;
  }
}

/**
 * Validates send timing
 * @param envelope - The envelope being sent
 * @param timingConfig - The timing configuration
 * @throws {SignatureError} When send timing is invalid
 * @returns void
 */
export function validateSendTiming(
  envelope: Envelope, 
  timingConfig: WorkflowTimingConfig
): void {
  const now = new Date();
  const metadata = envelope.getMetadata();
  const expiresAt = metadata.expiresAt;
  
  if (expiresAt) {
    const hoursUntilExpiration = diffHours(expiresAt, now);
    const minHoursRequired = timingConfig.reminderIntervals[0] || REMINDER_INTERVALS.MIN_HOURS_BEFORE_EXPIRATION;
    
    if (hoursUntilExpiration < minHoursRequired) {
      throw workflowViolation(
        `Envelope expires too soon. Minimum ${minHoursRequired} hours required`
      );
    }
  }
}

/**
 * Validates sign timing
 * @param envelope - The envelope being signed
 * @param _timingConfig - The timing configuration
 * @throws {SignatureError} When sign timing is invalid
 * @returns void
 */
export function validateSignTiming(
  envelope: Envelope, 
  _timingConfig: WorkflowTimingConfig
): void {
  const now = new Date();
  const metadata = envelope.getMetadata();
  const expiresAt = metadata.expiresAt;
  
  if (expiresAt && now > expiresAt) {
    throw workflowViolation('Cannot sign expired envelope');
  }
}

/**
 * Expiration workflow result
 */
export interface ExpirationWorkflowResult {
  isExpired: boolean;
  isInGracePeriod: boolean;
  hoursUntilExpiration: number;
  shouldTriggerWarning: boolean;
}

/**
 * Validates expiration workflow for an envelope
 * @param envelope - The envelope to validate expiration workflow for
 * @param timingConfig - The timing configuration
 * @throws {SignatureError} When expiration workflow is invalid
 * @returns ExpirationWorkflowResult with expiration status information
 */
export function validateExpirationWorkflow(envelope: Envelope, timingConfig: WorkflowTimingConfig): ExpirationWorkflowResult {
  const now = new Date();
  const metadata = envelope.getMetadata();
  const expiresAt = metadata.expiresAt;
  
  if (!expiresAt) {
    // No expiration set - return neutral result
    return {
      isExpired: false,
      isInGracePeriod: false,
      hoursUntilExpiration: Infinity,
      shouldTriggerWarning: false
    };
  }
  
  const hoursUntilExpiration = diffHours(expiresAt, now);
  const gracePeriod = timingConfig.expirationGracePeriod;
  
  const isExpired = hoursUntilExpiration <= 0;
  const isInGracePeriod = hoursUntilExpiration <= gracePeriod && hoursUntilExpiration > 0;
  const shouldTriggerWarning = isInGracePeriod;
  
  // Throw error if already expired
  if (isExpired) {
    throw workflowViolation('Envelope has already expired');
  }
  
  return {
    isExpired,
    isInGracePeriod,
    hoursUntilExpiration,
    shouldTriggerWarning
  };
}

/**
 * Validates reminder workflow for an envelope
 * @param _envelope - The envelope to validate reminder workflow for
 * @param timingConfig - The timing configuration
 * @param lastReminderSent - The timestamp of the last reminder sent
 * @throws {SignatureError} When reminder workflow is invalid
 * @returns void
 */
export function validateReminderWorkflow(
  _envelope: Envelope, 
  timingConfig: WorkflowTimingConfig, 
  lastReminderSent?: Date
): void {
  const reminderIntervals = timingConfig.reminderIntervals || REMINDER_INTERVALS.DEFAULT_INTERVALS_HOURS;
  
  if (!lastReminderSent) {
    // First reminder - always valid
    return;
  }
  
  const now = new Date();
  const hoursSinceLastReminder = diffHours(now, lastReminderSent);
  const nextReminderInterval = reminderIntervals[0] || REMINDER_INTERVALS.FIRST_REMINDER_HOURS;
  
  if (hoursSinceLastReminder < nextReminderInterval) {
    throw workflowViolation(
      `Reminder sent too recently. Next reminder in ${nextReminderInterval - hoursSinceLastReminder} hours`
    );
  }
}
