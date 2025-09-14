/**
 * @fileoverview WorkflowTypes - Type definitions for workflow operations
 * @summary Defines interfaces and types for envelope workflow operations
 * @description Contains type definitions for workflow timing configuration,
 * event data, and other workflow-related interfaces.
 */

import { AuditEventType } from '@/domain/enums/AuditEventType';

/**
 * Workflow timing configuration
 */
export interface WorkflowTimingConfig {
  reminderIntervals: number[]; // hours between reminders
  expirationGracePeriod: number; // hours before expiration to send warnings
  maxReminderAttempts: number;
  escalationThresholds: number; // hours before escalation
}

/**
 * Workflow event data for notification service
 */
export interface WorkflowEventData {
  envelopeId: string;
  eventType: AuditEventType;
  timestamp: Date;
  userId?: string;
  signerId?: string;
  signatureId?: string;
  metadata?: Record<string, any>;
}
