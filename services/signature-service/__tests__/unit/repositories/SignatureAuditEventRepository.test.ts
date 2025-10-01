import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { generateTestIpAddress } from '../../integration/helpers/testHelpers';
import { textContainsInsensitive, rangeFilter } from '@lawprotect/shared-ts';

import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

import { SignatureAuditEventRepository } from '../../../src/repositories/SignatureAuditEventRepository';
import { SignatureAuditEvent } from '../../../src/domain/entities/SignatureAuditEvent';
import { AuditEventType } from '../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../../helpers/testUtils';
import {
  createSignatureAuditEventPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  auditEventPersistenceRow,
  auditEventEntity,
  auditEventSpec,
  partialAuditEventEntity,
  envelopeEventEntity,
} from '../../helpers/builders/signatureAuditEvent';
import {
} from '../../helpers/mocks/repository';

describe('SignatureAuditEventRepository - Internal Methods', () => {
  let repository: SignatureAuditEventRepository;
  let prismaMock: { signatureAuditEvent: PrismaModelMock };

  beforeEach(async () => {
    await import('@lawprotect/shared-ts');
    const { prisma } = createSignatureAuditEventPrismaMock();
    prismaMock = prisma as unknown as { signatureAuditEvent: PrismaModelMock };
    repository = new SignatureAuditEventRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input with all fields', () => {
      const entity = auditEventEntity();
      const result = repository['toCreateModel'](entity);

      expect(result).toEqual({
        id: entity.getId().getValue(),
        envelopeId: entity.getEnvelopeId().getValue(),
        signerId: entity.getSignerId()?.getValue() ?? null,
        eventType: entity.getEventType(),
        description: entity.getDescription(),
        userId: entity.getUserId(),
        userEmail: entity.getUserEmail(),
        ipAddress: entity.getIpAddress(),
        userAgent: entity.getUserAgent(),
        country: entity.getCountry(),
        metadata: entity.getMetadata(),
        createdAt: entity.getCreatedAt(),
      });
    });

    it('handles null signerId', () => {
      const entity = envelopeEventEntity(); // Uses ENVELOPE_CREATED by default, no signerId required
      const result = repository['toCreateModel'](entity);

      expect(result.signerId).toBeNull();
    });
  });

  describe('toUpdateModel', () => {
    it('maps partial entity to Prisma update input', () => {
      const patch = partialAuditEventEntity({
        description: 'Updated description',
        userEmail: 'updated@example.com',
      });
      const result = repository['toUpdateModel'](patch);

      expect(result).toEqual({
        description: 'Updated description',
        userEmail: 'updated@example.com',
      });
    });

    it('handles entity with getter methods', () => {
      const patch = partialAuditEventEntity({
        getDescription: () => 'Getter description',
        getUserEmail: () => 'getter@example.com',
      });
      const result = repository['toUpdateModel'](patch);

      expect(result).toEqual({
        description: 'Getter description',
        userEmail: 'getter@example.com',
      });
    });

    it('handles plain object with direct properties', () => {
      const patch = {
        description: 'Direct description',
        userEmail: 'direct@example.com',
      };
      const result = repository['toUpdateModel'](patch);

      expect(result).toEqual({
        description: 'Direct description',
        userEmail: 'direct@example.com',
      });
    });

    it('handles mixed entity and plain object properties', () => {
      const patch = {
        getDescription: () => 'Getter description',
        userEmail: 'direct@example.com',
      };
      const result = repository['toUpdateModel'](patch);

      expect(result).toEqual({
        description: 'Getter description',
        userEmail: 'direct@example.com',
      });
    });

    it('handles undefined values', () => {
      const patch = {
        description: undefined,
        userEmail: 'valid@example.com',
      };
      const result = repository['toUpdateModel'](patch);

      expect(result).toEqual({
        userEmail: 'valid@example.com',
      });
    });

    it('handles null signerId', () => {
      const patch = partialAuditEventEntity({
        getSignerId: () => null,
      });
      const result = repository['toUpdateModel'](patch);

      expect(result.signerId).toBeNull();
    });

    it('handles undefined signerId', () => {
      const patch = partialAuditEventEntity({
        getSignerId: () => undefined,
      });
      const result = repository['toUpdateModel'](patch);

      expect(result.signerId).toBeUndefined();
    });

    it('never includes createdAt in updates', () => {
      const patch = {
        description: 'Updated',
        createdAt: new Date(),
      };
      const result = repository['toUpdateModel'](patch);

      expect(result.createdAt).toBeUndefined();
    });
  });

  describe('whereFromSpec', () => {
    it('returns empty object when no filters', () => {
      const spec = auditEventSpec({});
      const where = repository['whereFromSpec'](spec);

      expect(where).toEqual({});
    });

    it('builds where clause with basic filters', () => {
      const spec = auditEventSpec({
        envelopeId: 'envelope-123',
        signerId: 'signer-456',
        eventType: AuditEventType.SIGNER_ADDED,
        userId: 'user-789',
        userEmail: 'test@example.com',
        ipAddress: generateTestIpAddress(),
        country: 'US',
      });
      const where = repository['whereFromSpec'](spec);

      expect(where).toEqual({
        AND: [
          { envelopeId: 'envelope-123' },
          { signerId: 'signer-456' },
          { eventType: AuditEventType.SIGNER_ADDED },
          { userId: 'user-789' },
          { userEmail: 'test@example.com' },
          { ipAddress: expect.any(String) },
          { country: 'US' },
        ],
      });
    });

    it('uses textContainsInsensitive for userAgent and description', () => {
      const spec = auditEventSpec({
        userAgent: 'Chrome',
        description: 'test event',
      });
      const where = repository['whereFromSpec'](spec);

      expect(where.AND).toContainEqual({
        userAgent: textContainsInsensitive('Chrome'),
      });
      expect(where.AND).toContainEqual({
        description: textContainsInsensitive('test event'),
      });
    });

    it('uses rangeFilter for createdAt', () => {
      const before = new Date('2024-01-01');
      const after = new Date('2024-01-02');
      const spec = auditEventSpec({
        createdBefore: before,
        createdAfter: after,
      });
      const where = repository['whereFromSpec'](spec);

      expect(where.AND).toContainEqual({
        createdAt: rangeFilter(before, after),
      });
    });

    it('handles only createdBefore', () => {
      const before = new Date('2024-01-01');
      const spec = auditEventSpec({
        createdBefore: before,
      });
      const where = repository['whereFromSpec'](spec);

      expect(where.AND).toContainEqual({
        createdAt: rangeFilter(before, undefined),
      });
    });

    it('handles only createdAfter', () => {
      const after = new Date('2024-01-01');
      const spec = auditEventSpec({
        createdAfter: after,
      });
      const where = repository['whereFromSpec'](spec);

      expect(where.AND).toContainEqual({
        createdAt: rangeFilter(undefined, after),
      });
    });
  });

  describe('toDomain', () => {
    it('maps persistence row to domain entity', () => {
      const row = auditEventPersistenceRow();
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = repository['toDomain'](row);

      expect(spy).toHaveBeenCalledWith(row);
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('throws repositoryError on mapping failure', () => {
      const row = auditEventPersistenceRow();
      const error = new Error('Mapping failed');
      jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockImplementation(() => {
        throw error;
      });

      expect(() => repository['toDomain'](row)).toThrow();
    });
  });
});

describe('SignatureAuditEventRepository - Public Methods', () => {
  let repository: SignatureAuditEventRepository;
  let prismaMock: { signatureAuditEvent: PrismaModelMock };
  let auditEventOps: PrismaModelMock;

  beforeEach(async () => {
    const { prisma, signatureAuditEvent } = createSignatureAuditEventPrismaMock();
    prismaMock = prisma as unknown as { signatureAuditEvent: PrismaModelMock };
    auditEventOps = signatureAuditEvent;
    repository = new SignatureAuditEventRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('findById', () => {
    it('returns audit event when found', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      const row = auditEventPersistenceRow();
      auditEventOps.findUnique.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.findById(id);

      expect(auditEventOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('returns null when not found', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      auditEventOps.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });

    it('throws repositoryError on database error', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      const error = new Error('Database error');
      auditEventOps.findUnique.mockRejectedValueOnce(error);

      await expect(repository.findById(id)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates audit event successfully', async () => {
      const entity = auditEventEntity();
      const row = auditEventPersistenceRow();
      auditEventOps.create.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.create(entity);

      expect(auditEventOps.create).toHaveBeenCalledWith({
        data: repository['toCreateModel'](entity),
      });
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('throws repositoryError on creation failure', async () => {
      const entity = auditEventEntity();
      const error = new Error('Creation failed');
      auditEventOps.create.mockRejectedValueOnce(error);

      await expect(repository.create(entity)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates audit event successfully', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      const patch = partialAuditEventEntity({ description: 'Updated' });
      const row = auditEventPersistenceRow();
      auditEventOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.update(id, patch);

      expect(auditEventOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: repository['toUpdateModel'](patch),
      });
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('throws repositoryError on update failure', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      const patch = partialAuditEventEntity();
      const error = new Error('Update failed');
      auditEventOps.update.mockRejectedValueOnce(error);

      await expect(repository.update(id, patch)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes audit event successfully', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      auditEventOps.delete.mockResolvedValueOnce({});

      await repository.delete(id);

      expect(auditEventOps.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
    });

    it('throws repositoryError on deletion failure', async () => {
      const id = TestUtils.generateSignatureAuditEventId();
      const error = new Error('Deletion failed');
      auditEventOps.delete.mockRejectedValueOnce(error);

      await expect(repository.delete(id)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('lists audit events with pagination', async () => {
      const spec = auditEventSpec({ envelopeId: 'envelope-123' });
      const limit = 10;
      const cursor = 'cursor-123';
      const rows = [auditEventPersistenceRow(), auditEventPersistenceRow()];
      const nextCursor = 'next-cursor';
      const fixedDate = new Date('2024-01-01T00:00:00Z');
      
      mockDecodeCursor.mockReturnValueOnce({ createdAt: fixedDate, id: 'id-123' });
      mockListPage.mockResolvedValueOnce({ rows, nextCursor });
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.list(spec, limit, cursor);

      expect(mockDecodeCursor).toHaveBeenCalledWith(cursor);
      expect(mockListPage).toHaveBeenCalledWith(
        auditEventOps,
        repository['whereFromSpec'](spec),
        limit,
        { createdAt: fixedDate, id: 'id-123' },
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          cursorFields: ['createdAt', 'id'],
        })
      );
      expect(result).toEqual({
        items: [{}, {}],
        nextCursor,
      });
      spy.mockRestore();
    });

    it('lists audit events without cursor', async () => {
      const spec = auditEventSpec();
      const rows = [auditEventPersistenceRow()];
      const nextCursor = 'next-cursor';
      
      mockListPage.mockResolvedValueOnce({ rows, nextCursor });
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.list(spec);

      expect(mockDecodeCursor).not.toHaveBeenCalled();
      expect(mockListPage).toHaveBeenCalledWith(
        auditEventOps,
        repository['whereFromSpec'](spec),
        25, // DEFAULT_PAGE_LIMIT
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual({
        items: [{}],
        nextCursor,
      });
      spy.mockRestore();
    });

    it('throws repositoryError on list failure', async () => {
      const spec = auditEventSpec();
      const error = new Error('List failed');
      mockListPage.mockRejectedValueOnce(error);

      await expect(repository.list(spec)).rejects.toThrow();
    });
  });

  describe('getAllByEnvelope', () => {
    it('gets all audit events for envelope', async () => {
      const envelopeId = 'envelope-123';
      const rows = [auditEventPersistenceRow(), auditEventPersistenceRow()];
      auditEventOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(SignatureAuditEvent, 'fromPersistence').mockReturnValue({} as any);

      const result = await repository.getByEnvelope(envelopeId);

      expect(auditEventOps.findMany).toHaveBeenCalledWith({
        where: { envelopeId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{}, {}]);
      spy.mockRestore();
    });

    it('throws repositoryError on getAllByEnvelope failure', async () => {
      const envelopeId = 'envelope-123';
      const error = new Error('GetAllByEnvelope failed');
      auditEventOps.findMany.mockRejectedValueOnce(error);

      await expect(repository.getByEnvelope(envelopeId)).rejects.toThrow();
    });
  });

  describe('whereFromSpec edge cases', () => {
    it('should handle empty spec', () => {
      const spec = {};
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toBeDefined();
    });

    it('should handle spec with all filters', () => {
      const spec = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNER_ADDED,
        userId: TestUtils.generateUuid(),
        userEmail: 'test@example.com',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0',
        country: 'US',
        description: 'Test event',
        createdBefore: new Date('2024-01-01'),
        createdAfter: new Date('2024-01-02')
      };
      
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toBeDefined();
      expect(where.AND).toBeDefined();
    });
  });

  describe('toUpdateModel', () => {
    it('should map partial entity to update model', () => {
      const patch = partialAuditEventEntity();
      const result = repository['toUpdateModel'](patch);
      
      expect(result).toBeDefined();
    });
  });

});
