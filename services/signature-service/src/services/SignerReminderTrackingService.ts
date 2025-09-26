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
   * Records a reminder sent for a signer
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param message - The reminder message sent
   * @returns Updated SignerReminderTracking entity
   */
  async recordReminderSent(signerId: SignerId, envelopeId: EnvelopeId, message?: string): Promise<SignerReminderTracking> {
    try {
      // Try to find existing tracking
      let tracking = await this.signerReminderTrackingRepository.findBySignerAndEnvelope(signerId, envelopeId);
      
      if (!tracking) {
        // Create new tracking if it doesn't exist
        tracking = SignerReminderTracking.createNew(signerId, envelopeId);
      }
      
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



}
