/**
 * @fileoverview SignerReminderTrackingRepository - Repository for reminder tracking data access
 * @summary Handles persistence operations for signer reminder tracking
 * @description Provides data access methods for managing reminder tracking records,
 * including creation, updates, and queries for reminder history and limits.
 */

import { PrismaClient } from '@prisma/client';
import { SignerReminderTracking } from '../domain/entities/SignerReminderTracking';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { ReminderTrackingId } from '../domain/value-objects/ReminderTrackingId';
import { reminderTrackingNotFound, reminderTrackingCreationFailed } from '../signature-errors/factories';

/**
 * Repository for SignerReminderTracking entities
 * 
 * Handles all database operations related to reminder tracking,
 * including CRUD operations and business logic queries.
 */
export class SignerReminderTrackingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds reminder tracking by signer and envelope
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @returns SignerReminderTracking entity or null if not found
   */
  async findBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<SignerReminderTracking | null> {
    try {
      const tracking = await this.prisma.signerReminderTracking.findUnique({
        where: {
          signerId_envelopeId: {
            signerId: signerId.getValue(),
            envelopeId: envelopeId.getValue()
          }
        }
      });

      if (!tracking) {
        return null;
      }

      return this.toDomain(tracking);
    } catch (error) {
      console.error('Failed to find reminder tracking by signer and envelope', {
        error: error instanceof Error ? error.message : error,
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue()
      });
      throw reminderTrackingNotFound(
        `Failed to find reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Finds all reminder tracking records for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of SignerReminderTracking entities
   */
  async findByEnvelope(envelopeId: EnvelopeId): Promise<SignerReminderTracking[]> {
    try {
      const trackingRecords = await this.prisma.signerReminderTracking.findMany({
        where: {
          envelopeId: envelopeId.getValue()
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return trackingRecords.map((tracking: any) => this.toDomain(tracking));
    } catch (error) {
      console.error('Failed to find reminder tracking by envelope', {
        error: error instanceof Error ? error.message : error,
        envelopeId: envelopeId.getValue()
      });
      throw reminderTrackingNotFound(
        `Failed to find reminder tracking by envelope: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Creates a new reminder tracking record
   * @param tracking - The SignerReminderTracking entity to create
   * @returns Created SignerReminderTracking entity
   */
  async create(tracking: SignerReminderTracking): Promise<SignerReminderTracking> {
    try {
      const data = tracking.toPersistence();
      
      const created = await this.prisma.signerReminderTracking.create({
        data: {
          id: data.id,
          signerId: data.signerId,
          envelopeId: data.envelopeId,
          lastReminderAt: data.lastReminderAt,
          reminderCount: data.reminderCount,
          lastReminderMessage: data.lastReminderMessage,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      });

      return this.toDomain(created);
    } catch (error) {
      console.error('Failed to create reminder tracking', {
        error: error instanceof Error ? error.message : error,
        signerId: tracking.getSignerId().getValue(),
        envelopeId: tracking.getEnvelopeId().getValue()
      });
      throw reminderTrackingCreationFailed(
        `Failed to create reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates an existing reminder tracking record
   * @param tracking - The SignerReminderTracking entity to update
   * @returns Updated SignerReminderTracking entity
   */
  async update(tracking: SignerReminderTracking): Promise<SignerReminderTracking> {
    try {
      const data = tracking.toPersistence();
      
      const updated = await this.prisma.signerReminderTracking.update({
        where: {
          id: data.id
        },
        data: {
          lastReminderAt: data.lastReminderAt,
          reminderCount: data.reminderCount,
          lastReminderMessage: data.lastReminderMessage,
          updatedAt: data.updatedAt
        }
      });

      return this.toDomain(updated);
    } catch (error) {
      console.error('Failed to update reminder tracking', {
        error: error instanceof Error ? error.message : error,
        id: tracking.getId().getValue()
      });
      throw reminderTrackingCreationFailed(
        `Failed to update reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Creates or updates a reminder tracking record
   * @param tracking - The SignerReminderTracking entity to upsert
   * @returns Created or updated SignerReminderTracking entity
   */
  async upsert(tracking: SignerReminderTracking): Promise<SignerReminderTracking> {
    try {
      const data = tracking.toPersistence();
      
      const upserted = await this.prisma.signerReminderTracking.upsert({
        where: {
          signerId_envelopeId: {
            signerId: data.signerId,
            envelopeId: data.envelopeId
          }
        },
        create: {
          id: data.id,
          signerId: data.signerId,
          envelopeId: data.envelopeId,
          lastReminderAt: data.lastReminderAt,
          reminderCount: data.reminderCount,
          lastReminderMessage: data.lastReminderMessage,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        },
        update: {
          lastReminderAt: data.lastReminderAt,
          reminderCount: data.reminderCount,
          lastReminderMessage: data.lastReminderMessage,
          updatedAt: data.updatedAt
        }
      });

      return this.toDomain(upserted);
    } catch (error) {
      console.error('Failed to upsert reminder tracking', {
        error: error instanceof Error ? error.message : error,
        signerId: tracking.getSignerId().getValue(),
        envelopeId: tracking.getEnvelopeId().getValue()
      });
      throw reminderTrackingCreationFailed(
        `Failed to upsert reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Deletes reminder tracking record
   * @param id - The reminder tracking ID
   */
  async delete(id: ReminderTrackingId): Promise<void> {
    try {
      await this.prisma.signerReminderTracking.delete({
        where: {
          id: id.getValue()
        }
      });
    } catch (error) {
      console.error('Failed to delete reminder tracking', {
        error: error instanceof Error ? error.message : error,
        id: id.getValue()
      });
      throw reminderTrackingNotFound(
        `Failed to delete reminder tracking: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Converts database record to domain entity
   * @param record - Database record
   * @returns SignerReminderTracking domain entity
   */
  private toDomain(record: any): SignerReminderTracking {
    return SignerReminderTracking.create({
      id: record.id,
      signerId: record.signerId,
      envelopeId: record.envelopeId,
      lastReminderAt: record.lastReminderAt,
      reminderCount: record.reminderCount,
      lastReminderMessage: record.lastReminderMessage,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }
}
