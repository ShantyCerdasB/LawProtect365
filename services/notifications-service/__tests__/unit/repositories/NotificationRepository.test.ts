/**
 * @fileoverview NotificationRepository Tests - Comprehensive unit tests for NotificationRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of NotificationRepository including
 * CRUD operations, business queries, error handling, and cursor pagination functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Setup cursor pagination mocks BEFORE importing the repository
import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

// Import AFTER the mock is set up
import { NotificationStatus, NotificationChannel, RecipientType } from '@prisma/client';
import { PrismaNotificationRepository } from '../../../src/repositories/PrismaNotificationRepository';
import { Notification } from '../../../src/domain/entities/Notification';
import { NotificationId } from '../../../src/domain/value-objects/NotificationId';
import { TestUtils } from '../../helpers/testUtils';
import {
  createNotificationPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  notificationPersistenceRow,
  notificationEntity,
  notificationSpec,
  partialNotificationEntity,
} from '../../helpers/builders/notification';

describe('NotificationRepository - Internal Methods', () => {
  let repository: PrismaNotificationRepository;
  let prismaMock: { notification: PrismaModelMock };
  let notificationOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createNotificationPrismaMock();
    prismaMock = mock.prisma;
    notificationOps = mock.notification;
    
    repository = new PrismaNotificationRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = notificationEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId().getValue(),
        notificationId: entity.getNotificationId(),
        eventId: entity.getEventId(),
        eventType: entity.getEventType(),
        channel: entity.getChannel(),
        recipient: entity.getRecipient(),
        recipientType: entity.getRecipientType(),
        status: entity.getStatus(),
        retryCount: entity.getRetryCount(),
        maxRetries: entity.getMaxRetries(),
      });
    });

    it('handles null optional fields', () => {
      const entity = notificationEntity({
        eventId: undefined,
        sentAt: undefined,
        subject: undefined,
        body: undefined,
      });
      const result = repository['toCreateModel'](entity);
      
      expect(result.eventId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.subject).toBeNull();
      expect(result.body).toBeNull();
    });

    it('handles metadata as JSON', () => {
      const metadata = { key: 'value', nested: { data: 123 } };
      const entity = notificationEntity({ metadata });
      const result = repository['toCreateModel'](entity);
      
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialNotificationEntity({
        getStatus: () => NotificationStatus.SENT,
        getSentAt: () => new Date('2024-01-01'),
      });
      const out = repository['toUpdateModel'](partial);
      expect(out.status).toBe(NotificationStatus.SENT);
      expect(out.sentAt).toEqual(new Date('2024-01-01'));
    });

    it('ignores undefined', () => {
      const out = repository['toUpdateModel']({ subject: undefined });
      expect(out).toEqual({});
    });

    it('prefers getters over DTO fields', () => {
      const mixed = { 
        getStatus: () => NotificationStatus.SENT, 
        status: NotificationStatus.PENDING 
      };
      const out = repository['toUpdateModel'](mixed);
      expect(out.status).toBe(NotificationStatus.SENT);
    });
  });

  describe('whereById', () => {
    it('builds correct where clause', () => {
      const id = NotificationId.generate();
      const result = repository['whereById'](id);
      expect(result).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('builds where clause from spec', () => {
      const spec = notificationSpec({
        status: NotificationStatus.SENT,
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
      });
      const result = repository['whereFromSpec'](spec);
      
      // WhereBuilder returns { AND: [...] } structure
      expect(result).toHaveProperty('AND');
      expect(Array.isArray(result.AND)).toBe(true);
      expect(result.AND).toContainEqual({ status: NotificationStatus.SENT });
      expect(result.AND).toContainEqual({ channel: NotificationChannel.EMAIL });
      expect(result.AND).toContainEqual({ recipient: 'test@example.com' });
    });

    it('handles date range filters', () => {
      const createdAfter = new Date('2024-01-01');
      const createdBefore = new Date('2024-01-31');
      const spec = notificationSpec({ createdAfter, createdBefore });
      const result = repository['whereFromSpec'](spec);
      
      // WhereBuilder returns { AND: [...] } structure
      expect(result).toHaveProperty('AND');
      expect(Array.isArray(result.AND)).toBe(true);
      expect(result.AND).toContainEqual({
        createdAt: {
          gte: createdAfter,
          lte: createdBefore,
        }
      });
    });

    it('handles sentAfter filter', () => {
      const sentAfter = new Date('2024-01-01');
      const spec = notificationSpec({ sentAfter });
      const result = repository['whereFromSpec'](spec);
      
      expect(result).toHaveProperty('AND');
      expect(Array.isArray(result.AND)).toBe(true);
      expect(result.AND).toContainEqual({
        sentAt: {
          gte: sentAfter,
        }
      });
    });

    it('handles sentBefore filter', () => {
      const sentBefore = new Date('2024-01-31');
      const spec = notificationSpec({ sentBefore });
      const result = repository['whereFromSpec'](spec);
      
      expect(result).toHaveProperty('AND');
      expect(Array.isArray(result.AND)).toBe(true);
      expect(result.AND).toContainEqual({
        sentAt: {
          lte: sentBefore,
        }
      });
    });

    it('handles sentAfter and sentBefore filters together', () => {
      const sentAfter = new Date('2024-01-01');
      const sentBefore = new Date('2024-01-31');
      const spec = notificationSpec({ sentAfter, sentBefore });
      const result = repository['whereFromSpec'](spec);
      
      expect(result).toHaveProperty('AND');
      expect(Array.isArray(result.AND)).toBe(true);
      expect(result.AND).toContainEqual({
        sentAt: {
          gte: sentAfter,
          lte: sentBefore,
        }
      });
    });
  });

  describe('toDomain', () => {
    it('maps Prisma model to domain entity', () => {
      const row = notificationPersistenceRow();
      const result = repository['toDomain'](row as any);
      
      expect(result).toBeInstanceOf(Notification);
      expect(result.getId().getValue()).toBe(row.id);
      expect(result.getNotificationId()).toBe(row.notificationId);
    });

    it('throws repository error on invalid data', () => {
      const invalidRow = { id: null } as any;
      expect(() => repository['toDomain'](invalidRow)).toThrow();
    });
  });
});

describe('NotificationRepository - Public Methods', () => {
  let repository: PrismaNotificationRepository;
  let prismaMock: { notification: PrismaModelMock };
  let notificationOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createNotificationPrismaMock();
    prismaMock = mock.prisma;
    notificationOps = mock.notification;
    
    repository = new PrismaNotificationRepository(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('finds notification by ID', async () => {
      const row = notificationPersistenceRow();
      const id = NotificationId.fromString(row.id);
      
      notificationOps.findUnique.mockResolvedValue(row);
      
      const result = await repository.findById(id);
      
      expect(result).toBeInstanceOf(Notification);
      expect(result?.getId().getValue()).toBe(row.id);
      expect(notificationOps.findUnique).toHaveBeenCalledWith({
        where: { id: row.id }
      });
    });

    it('returns null when not found', async () => {
      const id = NotificationId.generate();
      notificationOps.findUnique.mockResolvedValue(null);
      
      const result = await repository.findById(id);
      
      expect(result).toBeNull();
    });

    it('handles errors', async () => {
      const id = NotificationId.generate();
      notificationOps.findUnique.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('findByNotificationId', () => {
    it('finds notification by notificationId', async () => {
      const row = notificationPersistenceRow();
      const notificationId = row.notificationId;
      
      notificationOps.findUnique.mockResolvedValue(row);
      
      const result = await repository.findByNotificationId(notificationId);
      
      expect(result).toBeInstanceOf(Notification);
      expect(result?.getNotificationId()).toBe(notificationId);
      expect(notificationOps.findUnique).toHaveBeenCalledWith({
        where: { notificationId }
      });
    });

    it('handles errors', async () => {
      const notificationId = 'notif-123';
      notificationOps.findUnique.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.findByNotificationId(notificationId)).rejects.toThrow();
    });
  });

  describe('findByEventId', () => {
    it('finds notification by eventId', async () => {
      const row = notificationPersistenceRow();
      const eventId = row.eventId;
      
      notificationOps.findFirst.mockResolvedValue(row);
      
      const result = await repository.findByEventId(eventId);
      
      expect(result).toBeInstanceOf(Notification);
      expect(result?.getEventId()).toBe(eventId);
      expect(notificationOps.findFirst).toHaveBeenCalledWith({
        where: { eventId }
      });
    });

    it('handles errors', async () => {
      const eventId = 'event-123';
      notificationOps.findFirst.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.findByEventId(eventId)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates notification', async () => {
      const entity = notificationEntity();
      const row = notificationPersistenceRow({
        id: entity.getId().getValue(),
        notificationId: entity.getNotificationId(),
      });
      
      notificationOps.create.mockResolvedValue(row);
      
      const result = await repository.create(entity);
      
      expect(result).toBeInstanceOf(Notification);
      expect(notificationOps.create).toHaveBeenCalled();
    });

    it('handles errors', async () => {
      const entity = notificationEntity();
      notificationOps.create.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.create(entity)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates notification', async () => {
      const id = NotificationId.generate();
      const patch = partialNotificationEntity({
        getStatus: () => NotificationStatus.SENT,
      });
      const row = notificationPersistenceRow({
        id: id.getValue(),
        status: NotificationStatus.SENT,
      });
      
      notificationOps.update.mockResolvedValue(row);
      
      const result = await repository.update(id, patch);
      
      expect(result).toBeInstanceOf(Notification);
      expect(notificationOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({ status: NotificationStatus.SENT })
      });
    });

    it('handles errors', async () => {
      const id = NotificationId.generate();
      const patch = partialNotificationEntity({
        getStatus: () => NotificationStatus.SENT,
      });
      notificationOps.update.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.update(id, patch)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('lists notifications with pagination', async () => {
      const spec = notificationSpec();
      const rows = [notificationPersistenceRow(), notificationPersistenceRow()];
      
      mockListPage.mockResolvedValue({ rows, nextCursor: 'cursor123' });
      
      const result = await repository.list(spec, 20);
      
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('cursor123');
      expect(mockListPage).toHaveBeenCalled();
    });

    it('handles empty results', async () => {
      const spec = notificationSpec();
      mockListPage.mockResolvedValue({ rows: [], nextCursor: undefined });
      
      const result = await repository.list(spec, 20);
      
      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it('handles cursor with Date', async () => {
      const spec = notificationSpec();
      const cursorDate = new Date('2024-01-01');
      mockDecodeCursor.mockReturnValue({ id: 'id-123', createdAt: cursorDate });
      mockListPage.mockResolvedValue({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 20, 'cursor123');
      
      expect(mockDecodeCursor).toHaveBeenCalledWith('cursor123');
    });

    it('handles cursor with string date', async () => {
      const spec = notificationSpec();
      mockDecodeCursor.mockReturnValue({ id: 'id-123', createdAt: '2024-01-01T00:00:00.000Z' });
      mockListPage.mockResolvedValue({ rows: [], nextCursor: undefined });
      
      await repository.list(spec, 20, 'cursor123');
      
      expect(mockDecodeCursor).toHaveBeenCalledWith('cursor123');
    });

    it('handles errors', async () => {
      const spec = notificationSpec();
      mockListPage.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.list(spec, 20)).rejects.toThrow();
    });
  });

  describe('findPendingRetries', () => {
    it('finds pending retries', async () => {
      const rows = [
        notificationPersistenceRow({ status: NotificationStatus.FAILED, retryCount: 1 }),
        notificationPersistenceRow({ status: NotificationStatus.FAILED, retryCount: 2 }),
      ];
      
      notificationOps.findMany.mockResolvedValue(rows);
      
      const result = await repository.findPendingRetries(3, 100);
      
      expect(result).toHaveLength(2);
      expect(notificationOps.findMany).toHaveBeenCalledWith({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: 3 }
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      });
    });

    it('handles errors', async () => {
      notificationOps.findMany.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.findPendingRetries(3, 100)).rejects.toThrow();
    });
  });

  describe('count', () => {
    it('counts notifications', async () => {
      const spec = notificationSpec({ status: NotificationStatus.SENT });
      notificationOps.count.mockResolvedValue(5);
      
      const result = await repository.count(spec);
      
      expect(result).toBe(5);
      expect(notificationOps.count).toHaveBeenCalled();
    });

    it('counts all notifications when spec is undefined', async () => {
      notificationOps.count.mockResolvedValue(10);
      
      const result = await repository.count();
      
      expect(result).toBe(10);
      expect(notificationOps.count).toHaveBeenCalledWith({ where: {} });
    });

    it('handles errors', async () => {
      const spec = notificationSpec();
      notificationOps.count.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.count(spec)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes notification', async () => {
      const id = NotificationId.generate();
      notificationOps.delete.mockResolvedValue({});
      
      await repository.delete(id);
      
      expect(notificationOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() }
      });
    });

    it('handles errors', async () => {
      const id = NotificationId.generate();
      notificationOps.delete.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.delete(id)).rejects.toThrow();
    });
  });
});


