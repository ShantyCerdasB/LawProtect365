/**
 * @fileoverview SendRemindersUseCase Types - Defines types for the SendRemindersUseCase
 * @summary Type definitions for input and output of the SendRemindersUseCase
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { NetworkSecurityContext, NotificationType } from '@lawprotect/shared-ts';

/**
 * Input parameters for the SendRemindersUseCase.
 */
export type SendRemindersInput = {
  envelopeId: EnvelopeId;
  request: {
    signerIds?: string[];
    message?: string;
    type: NotificationType.REMINDER;
  };
  userId: string;
  securityContext: NetworkSecurityContext;
};

/**
 * Result of the SendRemindersUseCase execution.
 */
export type SendRemindersResult = {
  success: boolean;
  message: string;
  envelopeId: string;
  remindersSent: number;
  signersNotified: Array<{
    id: string;
    email: string;
    name: string;
    reminderCount: number;
    lastReminderAt: Date;
  }>;
  skippedSigners: Array<{
    id: string;
    email: string;
    reason: string;
  }>;
};
