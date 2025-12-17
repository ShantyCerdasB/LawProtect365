/**
 * @fileoverview PrismaNotificationRepository - Prisma implementation of NotificationRepository
 * @summary Handles all database operations for notifications using Prisma
 * @description This repository provides comprehensive data access methods for notifications,
 * including CRUD operations, querying, idempotency checks, and retry logic. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, Prisma, NotificationStatus } from '@prisma/client';
import { 
  RepositoryBase, 
  Page, 
  decodeCursor, 
  listPage, 
  EntityMapper,
  WhereBuilder,
  repositoryError
} from '@lawprotect/shared-ts';
import type { NotificationRepository } from '../domain/types/repository';
import type { NotificationSpec } from '../domain/types/notification';
import { Notification } from '../domain/entities/Notification';
import { NotificationId } from '../domain/value-objects/NotificationId';

export class PrismaNotificationRepository extends RepositoryBase<Notification, NotificationId, NotificationSpec> implements NotificationRepository {
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * @description Maps Prisma model to domain entity
   * @param {Prisma.NotificationGetPayload<{}>} model - Prisma Notification model
   * @returns {Notification} Notification entity
   */
  protected toDomain(model: Prisma.NotificationGetPayload<{}>): Notification {
    try {
      return Notification.fromPersistence(model as any);
    } catch (error_) {
      throw repositoryError({
        operation: 'toDomain',
        notificationId: (model as any)?.id,
        cause: error_
      });
    }
  }

  /**
   * @description Maps domain entity to Prisma create input
   * @param {Notification} entity - Notification entity
   * @returns {Prisma.NotificationUncheckedCreateInput} Prisma create input
   */
  protected toCreateModel(entity: Notification): Prisma.NotificationUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      notificationId: entity.getNotificationId(),
      eventId: entity.getEventId() || null,
      eventType: entity.getEventType(),
      channel: entity.getChannel(),
      recipient: entity.getRecipient(),
      recipientType: entity.getRecipientType(),
      status: entity.getStatus(),
      sentAt: entity.getSentAt() || null,
      deliveredAt: entity.getDeliveredAt() || null,
      failedAt: entity.getFailedAt() || null,
      bouncedAt: entity.getBouncedAt() || null,
      errorMessage: entity.getErrorMessage() || null,
      errorCode: entity.getErrorCode() || null,
      retryCount: entity.getRetryCount(),
      maxRetries: entity.getMaxRetries(),
      subject: entity.getSubject() || null,
      body: entity.getBody() || null,
      templateId: entity.getTemplateId() || null,
      metadata: entity.getMetadata() ? (entity.getMetadata() as Prisma.InputJsonValue) : undefined,
      providerMessageId: entity.getProviderMessageId() || null,
      providerResponse: entity.getProviderResponse() ? (entity.getProviderResponse() as Prisma.InputJsonValue) : undefined,
      userId: entity.getUserId() || null,
      envelopeId: entity.getEnvelopeId() || null,
      signerId: entity.getSignerId() || null
    };
  }

  /**
   * @description Maps partial data to Prisma update input
   * @param {Partial<Notification> | Record<string, unknown>} patch - Partial notification data
   * @returns {Prisma.NotificationUncheckedUpdateInput} Prisma update input
   */
  protected toUpdateModel(patch: Partial<Notification> | Record<string, unknown>): Prisma.NotificationUncheckedUpdateInput {
    return EntityMapper.toUpdateModel(patch, [
      { field: 'notificationId', getter: 'getNotificationId' },
      { field: 'eventId', getter: 'getEventId' },
      { field: 'eventType', getter: 'getEventType' },
      { field: 'channel', getter: 'getChannel' },
      { field: 'recipient', getter: 'getRecipient' },
      { field: 'recipientType', getter: 'getRecipientType' },
      { field: 'status', getter: 'getStatus' },
      { field: 'sentAt', getter: 'getSentAt' },
      { field: 'deliveredAt', getter: 'getDeliveredAt' },
      { field: 'failedAt', getter: 'getFailedAt' },
      { field: 'bouncedAt', getter: 'getBouncedAt' },
      { field: 'errorMessage', getter: 'getErrorMessage' },
      { field: 'errorCode', getter: 'getErrorCode' },
      { field: 'retryCount', getter: 'getRetryCount' },
      { field: 'maxRetries', getter: 'getMaxRetries' },
      { field: 'subject', getter: 'getSubject' },
      { field: 'body', getter: 'getBody' },
      { field: 'templateId', getter: 'getTemplateId' },
      { field: 'metadata', getter: 'getMetadata' },
      { field: 'providerMessageId', getter: 'getProviderMessageId' },
      { field: 'providerResponse', getter: 'getProviderResponse' },
      { field: 'userId', getter: 'getUserId' },
      { field: 'envelopeId', getter: 'getEnvelopeId' },
      { field: 'signerId', getter: 'getSignerId' }
    ]);
  }

  /**
   * @description Builds a persistence-level filter for a primary identifier
   * @param {NotificationId} id - Entity identifier
   * @returns {Prisma.NotificationWhereUniqueInput} Prisma where clause
   */
  protected whereById(id: NotificationId): Prisma.NotificationWhereUniqueInput {
    return { id: id.getValue() };
  }

  /**
   * @description Builds a persistence-level filter from a query specification
   * @param {NotificationSpec} spec - Query/filter specification
   * @returns {Prisma.NotificationWhereInput} Prisma where clause
   */
  protected whereFromSpec(spec: NotificationSpec): Prisma.NotificationWhereInput {
    const b = new WhereBuilder<Prisma.NotificationWhereInput>(() => this.now());

    b.eq('status', spec.status)
     .eq('channel', spec.channel)
     .eq('recipient', spec.recipient)
     .eq('eventType', spec.eventType)
     .eq('eventId', spec.eventId)
     .eq('notificationId', spec.notificationId)
     .eq('userId', spec.userId)
     .eq('envelopeId', spec.envelopeId)
     .eq('signerId', spec.signerId);

    if (spec.createdAfter || spec.createdBefore) {
      b.and({
        createdAt: {
          ...(spec.createdAfter && { gte: spec.createdAfter }),
          ...(spec.createdBefore && { lte: spec.createdBefore })
        }
      });
    }

    if (spec.sentAfter || spec.sentBefore) {
      b.and({
        sentAt: {
          ...(spec.sentAfter && { gte: spec.sentAfter }),
          ...(spec.sentBefore && { lte: spec.sentBefore })
        }
      });
    }

    return b.build();
  }

  /**
   * @param {NotificationId} id - Notification ID
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification | null>} Notification entity or null if not found
   */
  async findById(id: NotificationId, tx?: Prisma.TransactionClient): Promise<Notification | null> {
    const client = tx ?? this.prisma;
    
    try {
      const notification = await client.notification.findUnique({
        where: this.whereById(id)
      });

      return notification ? this.toDomain(notification) : null;
    } catch (error_) {
      throw repositoryError({
        operation: 'findById',
        notificationId: id.getValue(),
        cause: error_
      });
    }
  }

  /**
   * @param {string} notificationId - Notification ID generated by the service
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification | null>} Notification entity or null if not found
   */
  async findByNotificationId(notificationId: string, tx?: Prisma.TransactionClient): Promise<Notification | null> {
    const client = tx ?? this.prisma;
    
    try {
      const notification = await client.notification.findUnique({
        where: { notificationId }
      });

      return notification ? this.toDomain(notification) : null;
    } catch (error_) {
      throw repositoryError({
        operation: 'findByNotificationId',
        notificationId,
        cause: error_
      });
    }
  }

  /**
   * @param {string} eventId - EventBridge event ID
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification | null>} Notification entity or null if not found
   */
  async findByEventId(eventId: string, tx?: Prisma.TransactionClient): Promise<Notification | null> {
    const client = tx ?? this.prisma;
    
    try {
      const notification = await client.notification.findFirst({
        where: { eventId }
      });

      return notification ? this.toDomain(notification) : null;
    } catch (error_) {
      throw repositoryError({
        operation: 'findByEventId',
        eventId,
        cause: error_
      });
    }
  }

  /**
   * @param {Partial<Notification>} data - Notification entity to persist
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification>} Created notification entity
   */
  async create(data: Partial<Notification>, tx?: Prisma.TransactionClient): Promise<Notification> {
    const entity = data as Notification;
    const client = tx ?? this.prisma;
    
    try {
      const createData = this.toCreateModel(entity);
      const created = await client.notification.create({
        data: createData
      });

      return this.toDomain(created);
    } catch (error_) {
      throw repositoryError({
        operation: 'create',
        notificationId: entity.getNotificationId(),
        cause: error_
      });
    }
  }

  /**
   * @param {NotificationId} id - Notification ID
   * @param {Partial<Notification>} patch - Partial notification data to update
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification>} Updated notification entity
   */
  async update(id: NotificationId, patch: Partial<Notification>, tx?: Prisma.TransactionClient): Promise<Notification> {
    const client = tx ?? this.prisma;
    
    try {
      const updateData = this.toUpdateModel(patch);
      const updated = await client.notification.update({
        where: this.whereById(id),
        data: updateData
      });

      return this.toDomain(updated);
    } catch (error_) {
      throw repositoryError({
        operation: 'update',
        notificationId: id.getValue(),
        cause: error_
      });
    }
  }

  /**
   * @param {NotificationSpec} spec - Query specification
   * @param {number} [limit] - Page size
   * @param {string} [cursor] - Optional pagination cursor
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Page<Notification>>} Page of notifications
   */
  async list(spec: NotificationSpec, limit = 20, cursor?: string, tx?: Prisma.TransactionClient): Promise<Page<Notification>> {
    try {
      const where = this.whereFromSpec(spec);
      type Decoded = { createdAt: string | Date; id: string };
      const decoded = cursor ? decodeCursor<Decoded>(cursor) : undefined;

      const cfg = {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] as Array<Record<string, 'asc' | 'desc'>>,
        cursorFields: ['createdAt', 'id'] as string[],
        normalizeCursor: (d?: Decoded) => 
          d ? { id: d.id, createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt) } : undefined
      };

      const client = tx ?? this.prisma;
      const { rows, nextCursor } = await listPage(client.notification, where, limit, decoded as any, cfg);
      
      return { 
        items: rows.map(r => this.toDomain(r as Prisma.NotificationGetPayload<{}>)), 
        nextCursor 
      };
    } catch (error_) {
      throw repositoryError({ operation: 'list', spec, cause: error_ });
    }
  }

  /**
   * @param {number} maxRetries - Maximum retry count
   * @param {number} [limit] - Maximum number of notifications to return
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<Notification[]>} Array of pending notifications
   */
  async findPendingRetries(maxRetries: number, limit = 100, tx?: Prisma.TransactionClient): Promise<Notification[]> {
    const client = tx ?? this.prisma;
    
    try {
      const notifications = await client.notification.findMany({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: maxRetries }
        },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      return notifications.map(n => this.toDomain(n));
    } catch (error_) {
      throw repositoryError({
        operation: 'findPendingRetries',
        cause: error_
      });
    }
  }

  /**
   * @param {NotificationSpec} [spec] - Query specification
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   * @returns {Promise<number>} Total count
   */
  async count(spec?: NotificationSpec, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    
    try {
      const where = spec ? this.whereFromSpec(spec) : {};
      return await client.notification.count({ where });
    } catch (error_) {
      throw repositoryError({
        operation: 'count',
        spec,
        cause: error_
      });
    }
  }

  /**
   * @param {NotificationId} id - Notification ID
   * @param {Prisma.TransactionClient} [tx] - Optional transactional context
   */
  async delete(id: NotificationId, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    
    try {
      await client.notification.delete({
        where: this.whereById(id)
      });
    } catch (error_) {
      throw repositoryError({
        operation: 'delete',
        notificationId: id.getValue(),
        cause: error_
      });
    }
  }
}
