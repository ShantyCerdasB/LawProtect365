/**
 * @fileoverview SignerReminderTracking - Entity for tracking reminder history and limits
 * @summary Tracks reminder count, timing, and messages for each signer per envelope
 * @description This entity manages reminder tracking data including count limits,
 * timing restrictions, and message history for signers in signature envelopes.
 */

import { SignerId } from '../value-objects/SignerId';
import { EnvelopeId } from '../value-objects/EnvelopeId';
import { ReminderTrackingId } from '../value-objects/ReminderTrackingId';

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
   * @returns New SignerReminderTracking instance
   */
  static createNew(signerId: SignerId, envelopeId: EnvelopeId): SignerReminderTracking {
    const now = new Date();
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
   * Records a new reminder sent
   * @param message - The reminder message sent
   * @returns Updated SignerReminderTracking instance
   */
  recordReminderSent(message?: string): SignerReminderTracking {
    const now = new Date();
    return new SignerReminderTracking(
      this._id,
      this._signerId,
      this._envelopeId,
      now,
      this._reminderCount + 1,
      message || null,
      this._createdAt,
      now
    );
  }

  /**
   * Checks if a reminder can be sent based on timing and count limits
   * @param maxReminders - Maximum number of reminders allowed
   * @param minHoursBetween - Minimum hours between reminders
   * @returns True if reminder can be sent
   */
  canSendReminder(maxReminders: number, minHoursBetween: number): boolean {
    // Check count limit
    if (this._reminderCount >= maxReminders) {
      return false;
    }

    // Check timing limit
    if (this._lastReminderAt) {
      const hoursSinceLastReminder = (Date.now() - this._lastReminderAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < minHoursBetween) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the reason why a reminder cannot be sent
   * @param maxReminders - Maximum number of reminders allowed
   * @param minHoursBetween - Minimum hours between reminders
   * @returns Reason string or null if reminder can be sent
   */
  getReminderBlockReason(maxReminders: number, minHoursBetween: number): string | null {
    if (this._reminderCount >= maxReminders) {
      return `Maximum reminders limit reached (${this._reminderCount}/${maxReminders})`;
    }

    if (this._lastReminderAt) {
      const hoursSinceLastReminder = (Date.now() - this._lastReminderAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < minHoursBetween) {
        const remainingHours = Math.ceil(minHoursBetween - hoursSinceLastReminder);
        return `Minimum ${minHoursBetween} hours between reminders not met (${remainingHours} hours remaining)`;
      }
    }

    return null;
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
