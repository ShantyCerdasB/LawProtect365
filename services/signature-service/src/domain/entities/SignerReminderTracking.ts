/**
 * @fileoverview SignerReminderTracking - Entity for tracking reminder history and limits
 * @summary Tracks reminder count, timing, and messages for each signer per envelope
 * @description This entity manages reminder tracking data including count limits,
 * timing restrictions, and message history for signers in signature envelopes.
 */

import { SignerId } from '../value-objects/SignerId';
import { EnvelopeId } from '../value-objects/EnvelopeId';
import { ReminderTrackingId } from '../value-objects/ReminderTrackingId';
import { Clock, systemClock, toDateOrUndefined, ensureNonNegative, normalizeMessage } from '@lawprotect/shared-ts';

/**
 * Reasons why a reminder cannot be sent
 */
export enum ReminderGateReason {
  LIMIT_REACHED = 'LIMIT_REACHED',
  MIN_INTERVAL = 'MIN_INTERVAL'
}

/**
 * Result of evaluating whether a reminder can be sent
 */
export type ReminderGate =
  | { ok: true }
  | { ok: false; reason: ReminderGateReason; remainingHours?: number };

/**
 * SignerReminderTracking entity
 * 
 * Tracks reminder history and limits for each signer per envelope.
 * Ensures proper reminder frequency and count limits are enforced.
 */
export class SignerReminderTracking {
  private constructor(
    private readonly _id: ReminderTrackingId,
    private readonly _signerId: SignerId,
    private readonly _envelopeId: EnvelopeId,
    private readonly _lastReminderAt: Date | null,
    private readonly _reminderCount: number,
    private readonly _lastReminderMessage: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  /**
   * Creates a new SignerReminderTracking instance
   * @deprecated Use fromPersistence or createNew instead
   * @param data - The reminder tracking data
   * @returns New SignerReminderTracking instance
   */
  static create(data: {
    id: string;
    signerId: string;
    envelopeId: string;
    lastReminderAt?: Date | null;
    reminderCount?: number;
    lastReminderMessage?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): SignerReminderTracking {
    return new SignerReminderTracking(
      ReminderTrackingId.fromString(data.id),
      SignerId.fromString(data.signerId),
      EnvelopeId.fromString(data.envelopeId),
      data.lastReminderAt || null,
      data.reminderCount || 0,
      data.lastReminderMessage || null,
      data.createdAt || new Date(),
      data.updatedAt || new Date()
    );
  }

  /**
   * Creates a new SignerReminderTracking for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param clock - Time provider used for timestamps. Defaults to systemClock.
   * @returns New SignerReminderTracking instance
   */
  static createNew(signerId: SignerId, envelopeId: EnvelopeId, clock: Clock = systemClock): SignerReminderTracking {
    const now = clock.now();
    return new SignerReminderTracking(
      ReminderTrackingId.generate(),
      signerId,
      envelopeId,
      null,
      0,
      null,
      now,
      now
    );
  }

  /**
   * Records a newly sent reminder, producing an updated immutable instance.
   * Trims and truncates the provided message to a maximum of 1024 characters.
   * @param message - Optional reminder message to persist (will be trimmed; empty strings become null).
   * @param clock - Time provider used to set lastReminderAt and updatedAt. Defaults to systemClock.
   * @returns A new SignerReminderTracking instance reflecting the sent reminder.
   */
  recordReminderSent(message?: string, clock: Clock = systemClock): SignerReminderTracking {
    const now = clock.now();
    
    // Normalize and truncate message
    const normalizedMessage = normalizeMessage(message, 1024);
    
    return new SignerReminderTracking(
      this._id,
      this._signerId,
      this._envelopeId,
      now,
      this._reminderCount + 1,
      normalizedMessage,
      this._createdAt,
      now
    );
  }

  /**
   * Evaluates whether a reminder can be sent based on count and minimum interval policies.
   * @param maxReminders - Maximum number of reminders allowed. Must be >= 0.
   * @param minHoursBetween - Minimum number of hours between reminders. Must be >= 0.
   * @param clock - Time provider used for time calculations. Defaults to systemClock.
   * @returns A ReminderGate object describing whether the reminder is allowed and, if blocked, why.
   * @throws {Error} If maxReminders or minHoursBetween are negative.
   * @example
   * const gate = tracking.evaluateReminderGate(5, 24);
   * if (gate.ok) { ... }
   */
  evaluateReminderGate(maxReminders: number, minHoursBetween: number, clock: Clock = systemClock): ReminderGate {
    const validMaxReminders = ensureNonNegative(maxReminders, 'maxReminders');
    const validMinHours = ensureNonNegative(minHoursBetween, 'minHoursBetween');

    // Check count limit
    if (this._reminderCount >= validMaxReminders) {
      return { ok: false, reason: ReminderGateReason.LIMIT_REACHED };
    }

    // Check timing limit
    if (this._lastReminderAt) {
      const now = clock.now();
      const hoursSinceLastReminder = (now.getTime() - this._lastReminderAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < validMinHours) {
        const remainingHours = Math.ceil(validMinHours - hoursSinceLastReminder);
        return { 
          ok: false, 
          reason: ReminderGateReason.MIN_INTERVAL, 
          remainingHours 
        };
      }
    }

    return { ok: true };
  }

  /**
   * Checks if a reminder can be sent based on timing and count limits
   * @deprecated Use evaluateReminderGate instead
   * @param maxReminders - Maximum number of reminders allowed
   * @param minHoursBetween - Minimum hours between reminders
   * @param clock - Time provider used for time calculations. Defaults to systemClock.
   * @returns True if reminder can be sent
   */
  canSendReminder(maxReminders: number, minHoursBetween: number, clock: Clock = systemClock): boolean {
    return this.evaluateReminderGate(maxReminders, minHoursBetween, clock).ok;
  }

  /**
   * Gets the reason why a reminder cannot be sent
   * @deprecated Use evaluateReminderGate instead
   * @param maxReminders - Maximum number of reminders allowed
   * @param minHoursBetween - Minimum hours between reminders
   * @param clock - Time provider used for time calculations. Defaults to systemClock.
   * @returns Reason string or null if reminder can be sent
   */
  getReminderBlockReason(maxReminders: number, minHoursBetween: number, clock: Clock = systemClock): string | null {
    const gate = this.evaluateReminderGate(maxReminders, minHoursBetween, clock);
    
    if (gate.ok) {
      return null;
    }
    
    switch (gate.reason) {
      case ReminderGateReason.LIMIT_REACHED:
        return `Maximum reminders limit reached (${this._reminderCount}/${maxReminders})`;
      case ReminderGateReason.MIN_INTERVAL:
        return `Minimum ${minHoursBetween} hours between reminders not met (${gate.remainingHours} hours remaining)`;
      default:
        return null;
    }
  }

  // Getters
  getId(): ReminderTrackingId {
    return this._id;
  }

  getSignerId(): SignerId {
    return this._signerId;
  }

  getEnvelopeId(): EnvelopeId {
    return this._envelopeId;
  }

  getLastReminderAt(): Date | null {
    return this._lastReminderAt;
  }

  getReminderCount(): number {
    return this._reminderCount;
  }

  getLastReminderMessage(): string | null {
    return this._lastReminderMessage;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Creates entity from persistence data
   * @param data - Persistence data with date fields that can be Date or string
   * @returns SignerReminderTracking entity
   */
  static fromPersistence(data: {
    id: string;
    signerId: string;
    envelopeId: string;
    lastReminderAt: Date | string | null;
    reminderCount: number;
    lastReminderMessage: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): SignerReminderTracking {
    return new SignerReminderTracking(
      ReminderTrackingId.fromString(data.id),
      SignerId.fromString(data.signerId),
      EnvelopeId.fromString(data.envelopeId),
      toDateOrUndefined(data.lastReminderAt) || null,
      data.reminderCount,
      data.lastReminderMessage,
      toDateOrUndefined(data.createdAt)!,
      toDateOrUndefined(data.updatedAt)!
    );
  }

  /**
   * Converts entity to plain object for persistence
   * @returns Plain object representation
   */
  toPersistence(): {
    id: string;
    signerId: string;
    envelopeId: string;
    lastReminderAt: Date | null;
    reminderCount: number;
    lastReminderMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id.getValue(),
      signerId: this._signerId.getValue(),
      envelopeId: this._envelopeId.getValue(),
      lastReminderAt: this._lastReminderAt,
      reminderCount: this._reminderCount,
      lastReminderMessage: this._lastReminderMessage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}

