/**
 * @fileoverview SignerReminderTrackingService - Service for managing reminder tracking
 * @summary Handles business logic for reminder tracking operations
 * @description Provides high-level operations for managing reminder tracking,
 * including validation, creation, updates, and business rule enforcement.
 */

import { SignerReminderTracking } from '../domain/entities/SignerReminderTracking';
import { SignerReminderTrackingRepository } from '../repositories/SignerReminderTrackingRepository';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { reminderTrackingNotFound, reminderTrackingCreationFailed } from '../signature-errors/factories';

/**
 * Service for managing signer reminder tracking
 * 
 * Handles business logic for reminder tracking operations including
 * validation, creation, updates, and enforcement of reminder limits.
 */
export class SignerReminderTrackingService {
  constructor(
    private readonly signerReminderTrackingRepository: SignerReminderTrackingRepository
  ) {}

  /**
   * Gets or creates reminder tracking for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @returns SignerReminderTracking entity
   */
  async getOrCreateTracking(signerId: SignerId, envelopeId: EnvelopeId): Promise<SignerReminderTracking> {
    try {
      // Try to find existing tracking
      let tracking = await this.signerReminderTrackingRepository.findBySignerAndEnvelope(signerId, envelopeId);
      
      if (!tracking) {
        // Create new tracking if it doesn't exist
        tracking = SignerReminderTracking.createNew(signerId, envelopeId);
        tracking = await this.signerReminderTrackingRepository.create(tracking);
      }
      
      return tracking;
    } catch (error) {
      throw reminderTrackingCreationFailed(
        `Failed to get or create reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Records a reminder sent for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param message - The reminder message sent
   * @returns Updated SignerReminderTracking entity
   */
  async recordReminderSent(signerId: SignerId, envelopeId: EnvelopeId, message?: string): Promise<SignerReminderTracking> {
    try {
      // Get or create tracking
      let tracking = await this.getOrCreateTracking(signerId, envelopeId);
      
      // Record the reminder
      const updatedTracking = tracking.recordReminderSent(message);
      
      // Save to database
      return await this.signerReminderTrackingRepository.upsert(updatedTracking);
    } catch (error) {
      throw reminderTrackingCreationFailed(
        `Failed to record reminder sent: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Checks if a reminder can be sent for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param maxReminders - Maximum number of reminders allowed
   * @param minHoursBetween - Minimum hours between reminders
   * @returns Object with canSend flag and reason if blocked
   */
  async canSendReminder(
    signerId: SignerId, 
    envelopeId: EnvelopeId, 
    maxReminders: number, 
    minHoursBetween: number
  ): Promise<{ canSend: boolean; reason?: string; tracking?: SignerReminderTracking }> {
    try {
      const tracking = await this.signerReminderTrackingRepository.findBySignerAndEnvelope(signerId, envelopeId);
      
      if (!tracking) {
        // No tracking exists, can send first reminder
        return { canSend: true };
      }
      
      const canSend = tracking.canSendReminder(maxReminders, minHoursBetween);
      const reason = canSend ? undefined : tracking.getReminderBlockReason(maxReminders, minHoursBetween);
      
      return { canSend, reason: reason || undefined, tracking };
    } catch (error) {
      throw reminderTrackingNotFound(
        `Failed to check reminder eligibility: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets reminder tracking for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @returns SignerReminderTracking entity or null if not found
   */
  async getTracking(signerId: SignerId, envelopeId: EnvelopeId): Promise<SignerReminderTracking | null> {
    try {
      return await this.signerReminderTrackingRepository.findBySignerAndEnvelope(signerId, envelopeId);
    } catch (error) {
      throw reminderTrackingNotFound(
        `Failed to get reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets all reminder tracking records for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of SignerReminderTracking entities
   */
  async getTrackingByEnvelope(envelopeId: EnvelopeId): Promise<SignerReminderTracking[]> {
    try {
      return await this.signerReminderTrackingRepository.findByEnvelope(envelopeId);
    } catch (error) {
      throw reminderTrackingNotFound(
        `Failed to get reminder tracking by envelope: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets reminder statistics for an envelope
   * @param envelopeId - The envelope ID
   * @returns Object with reminder statistics
   */
  async getReminderStats(envelopeId: EnvelopeId): Promise<{
    totalTrackings: number;
    totalRemindersSent: number;
    signersWithReminders: number;
    averageRemindersPerSigner: number;
  }> {
    try {
      const trackings = await this.getTrackingByEnvelope(envelopeId);
      
      const totalTrackings = trackings.length;
      const totalRemindersSent = trackings.reduce((sum, tracking) => sum + tracking.getReminderCount(), 0);
      const signersWithReminders = trackings.filter(tracking => tracking.getReminderCount() > 0).length;
      const averageRemindersPerSigner = totalTrackings > 0 ? totalRemindersSent / totalTrackings : 0;
      
      return {
        totalTrackings,
        totalRemindersSent,
        signersWithReminders,
        averageRemindersPerSigner: Math.round(averageRemindersPerSigner * 100) / 100
      };
    } catch (error) {
      throw reminderTrackingNotFound(
        `Failed to get reminder statistics: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
