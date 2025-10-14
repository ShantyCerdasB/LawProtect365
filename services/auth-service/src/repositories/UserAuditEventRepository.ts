/**
 * @fileoverview UserAuditEventRepository - Data access for UserAuditEvent entity
 * @summary Handles UserAuditEvent entity persistence operations
 * @description Provides data access methods for UserAuditEvent entity using Prisma,
 * including audit trail creation and retrieval.
 */

import { PrismaClient } from '@prisma/client';
import { UserAuditEvent } from '../domain/entities/UserAuditEvent';
import { repositoryError } from '../auth-errors/factories';

/**
 * Repository for UserAuditEvent entity persistence
 * 
 * Handles all database operations for UserAuditEvent entity.
 */
export class UserAuditEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new audit event
   * @param auditEvent - UserAuditEvent entity
   * @returns Created UserAuditEvent entity
   */
  async create(auditEvent: UserAuditEvent): Promise<UserAuditEvent> {
    try {
      const created = await this.prisma.userAuditEvent.create({
        data: {
          id: auditEvent.getId(),
          userId: auditEvent.getUserId().getValue(),
          action: auditEvent.getAction(),
          description: auditEvent.getDescription(),
          actorId: auditEvent.getActorId(),
          ipAddress: auditEvent.getIpAddress(),
          userAgent: auditEvent.getUserAgent(),
          metadata: auditEvent.getMetadata(),
          createdAt: auditEvent.getCreatedAt()
        }
      });

      return UserAuditEvent.fromPersistence(created);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to create audit event: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds audit events by user ID
   * @param userId - User ID
   * @param limit - Maximum number of events to return
   * @param offset - Number of events to skip
   * @returns Array of UserAuditEvent entities
   */
  async findByUserId(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.userAuditEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return auditEvents.map(event => UserAuditEvent.fromPersistence(event));
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find audit events by user ID: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds audit events by action
   * @param action - Audit action
   * @param limit - Maximum number of events to return
   * @param offset - Number of events to skip
   * @returns Array of UserAuditEvent entities
   */
  async findByAction(
    action: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.userAuditEvent.findMany({
        where: { action },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return auditEvents.map(event => UserAuditEvent.fromPersistence(event));
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find audit events by action: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds audit events by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Maximum number of events to return
   * @param offset - Number of events to skip
   * @returns Array of UserAuditEvent entities
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserAuditEvent[]> {
    try {
      const auditEvents = await this.prisma.userAuditEvent.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return auditEvents.map(event => UserAuditEvent.fromPersistence(event));
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find audit events by date range: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Counts audit events by user ID
   * @param userId - User ID
   * @returns Number of audit events
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      return await this.prisma.userAuditEvent.count({
        where: { userId }
      });
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to count audit events by user ID: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
}
