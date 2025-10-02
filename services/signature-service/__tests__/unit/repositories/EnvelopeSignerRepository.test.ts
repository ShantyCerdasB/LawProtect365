/**
 * @fileoverview EnvelopeSignerRepository Tests - Comprehensive unit tests for EnvelopeSignerRepository
 * @summary Tests all repository methods with full coverage including edge cases
 * @description This test suite provides comprehensive coverage of EnvelopeSignerRepository including
 * CRUD operations, business queries, error handling, and cursor pagination functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Setup cursor pagination mocks BEFORE importing the repository
import { setupCursorPaginationMocks } from '../../helpers/mocks/cursorPagination';
const { mockListPage, mockDecodeCursor } = setupCursorPaginationMocks();

// Import AFTER the mock is set up
import { SignerStatus, ParticipantRole } from '@prisma/client';
import { EnvelopeSignerRepository } from '../../../src/repositories/EnvelopeSignerRepository';
import { EnvelopeSigner } from '../../../src/domain/entities/EnvelopeSigner';
import { TestUtils } from '../../helpers/testUtils';
import {
  createEnvelopeSignerPrismaMock,
  PrismaModelMock,
} from '../../helpers/mocks/prisma';
import {
  signerPersistenceRow,
  signerEntity,
  signerSpec,
  signerDto,
  partialSignerEntity,
  signerVO,
} from '../../helpers/builders/envelopeSigner';

describe('EnvelopeSignerRepository - Internal Methods', () => {
  let repository: EnvelopeSignerRepository;
  let prismaMock: { envelopeSigner: PrismaModelMock };
  let signerOps: PrismaModelMock;

  beforeEach(() => {
    const mock = createEnvelopeSignerPrismaMock();
    prismaMock = mock.prisma;
    signerOps = mock.envelopeSigner;
    
    repository = new EnvelopeSignerRepository(prismaMock as any);
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input', () => {
      const entity = signerEntity();
      const result = repository['toCreateModel'](entity);
      
      expect(result).toMatchObject({
        id: entity.getId().getValue(),
        envelopeId: entity.getEnvelopeId().getValue(),
        userId: entity.getUserId(),
        isExternal: entity.getIsExternal(),
        email: entity.getEmail()?.getValue()?.toLowerCase(),
        fullName: entity.getFullName(),
        invitedByUserId: entity.getInvitedByUserId(),
        participantRole: ParticipantRole.SIGNER,
        order: entity.getOrder(),
        status: entity.getStatus(),
      });
    });

    it('handles null email normalization', () => {
      const entity = signerEntity({ email: undefined });
      const result = repository['toCreateModel'](entity);
      expect(result.email).toBe('test@example.com'); // Default email from builder
    });

    it('maps VIEWER participant role (line 33)', () => {
      const entity = signerEntity({ participantRole: 'VIEWER' });
      const result = repository['toCreateModel'](entity);
      expect(result.participantRole).toBe(ParticipantRole.VIEWER);
    });

    it('maps unknown participant role to SIGNER default (lines 34-36)', () => {
      const entity = signerEntity({ participantRole: 'UNKNOWN_ROLE' });
      const result = repository['toCreateModel'](entity);
      expect(result.participantRole).toBe(ParticipantRole.SIGNER);
    });

    it('handles null email in toCreateModel (line 74)', () => {
      // Create entity with null email by overriding the getEmail method
      const entity = signerEntity();
      entity.getEmail = () => null as any;
      const result = repository['toCreateModel'](entity);
      expect(result.email).toBeNull();
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialSignerEntity({
        getStatus: () => SignerStatus.SIGNED,
        getSignedAt: () => new Date('2024-01-01'),
      });
      const out = repository['toUpdateModel'](partial);
      expect(out.status).toBe(SignerStatus.SIGNED);
      expect(out.signedAt).toEqual(new Date('2024-01-01'));
    });

    it('supports DTO and nullables', () => {
      const dto = signerDto({ 
        email: null, 
        fullName: 'Updated Name',
        status: SignerStatus.SIGNED 
      });
      const out = repository['toUpdateModel'](dto);
      expect(out).toMatchObject({
        email: null,
        fullName: 'Updated Name',
        status: SignerStatus.SIGNED,
      });
    });

    it('ignores undefined', () => {
      const out = repository['toUpdateModel']({ fullName: undefined });
      expect(out).toEqual({});
    });

    it('prefers getters over DTO fields', () => {
      const mixed = { 
        getStatus: () => SignerStatus.SIGNED, 
        status: SignerStatus.PENDING 
      };
      const out = repository['toUpdateModel'](mixed);
      expect(out.status).toBe(SignerStatus.SIGNED);
    });

    it('handles getters that return undefined (lines 78-79)', () => {
      const partial = {
        getEnvelopeId: () => undefined,
        getUserId: () => undefined,
        envelopeId: 'env-123',
        userId: 'user-123'
      };
      const result = repository['toUpdateModel'](partial);
      expect(result.envelopeId).toBe('env-123');
      expect(result.userId).toBe('user-123');
    });

    it('handles getters that return undefined for signer fields (line 86)', () => {
      const partial = {
        getFullName: () => undefined,
        getOrder: () => undefined,
        fullName: 'Test Signer',
        order: 2
      };
      const result = repository['toUpdateModel'](partial);
      expect(result.fullName).toBe('Test Signer');
      expect(result.order).toBe(2);
    });

    it('handles email without normalization (handled by Email VO)', () => {
      const partial = { email: 'TEST@EXAMPLE.COM' };
      const result = repository['toUpdateModel'](partial);
      expect(result.email).toBe('TEST@EXAMPLE.COM'); // Not normalized in toUpdateModel
    });

    it('maps VIEWER participant role in toUpdateModel (line 33)', () => {
      const partial = { participantRole: 'VIEWER' };
      const result = repository['toUpdateModel'](partial);
      expect(result.participantRole).toBe(ParticipantRole.VIEWER);
    });

    it('maps unknown participant role to SIGNER default in toUpdateModel (lines 34-36)', () => {
      const partial = { participantRole: 'UNKNOWN_ROLE' };
      const result = repository['toUpdateModel'](partial);
      expect(result.participantRole).toBe(ParticipantRole.SIGNER);
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = signerVO().id();
      const where = repository['whereById'](id);
      expect(where).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('unwraps and applies filters with AND logic', () => {
      const spec = signerSpec({
        envelopeId: 'env-123',
        userId: 'user-123',
        status: SignerStatus.SIGNED,
        hasSigned: true,
        hasDeclined: false,
      });
      const where = repository['whereFromSpec'](spec);
      
      expect(where).toHaveProperty('AND');
      expect(where.AND.length).toBeGreaterThan(0); // Multiple filters applied
      expect(where.AND).toContainEqual({ envelopeId: 'env-123' });
      expect(where.AND).toContainEqual({ userId: 'user-123' });
      expect(where.AND).toContainEqual({ status: SignerStatus.SIGNED });
    });

    it('tolerates undefined/null', () => {
      const spec: any = { 
        envelopeId: undefined, 
        userId: null, 
        status: SignerStatus.PENDING 
      };
      const where = repository['whereFromSpec'](spec);
      expect(where).toHaveProperty('AND');
      expect(where.AND).toHaveLength(1);
      expect(where.AND).toContainEqual({ status: SignerStatus.PENDING });
    });

    it('handles values without getValue method (line 111)', () => {
      const spec = {
        envelopeId: 'direct-string-value', // No getValue method
        userId: 'user-123', // Direct string value
        email: undefined // No getValue method
      };
      const where = repository['whereFromSpec'](spec);
      expect(where.AND).toContainEqual({ envelopeId: 'direct-string-value' });
      expect(where.AND).toContainEqual({ userId: 'user-123' });
    });

    it('returns empty object when no filters', () => {
      const where = repository['whereFromSpec']({});
      expect(where).toEqual({});
    });

    it('handles impossible filter combinations', () => {
      const spec = {
        hasSigned: true,
        hasDeclined: true
      };
      const where = repository['whereFromSpec'](spec);
      // Should not have conflicting status filters
      expect(where.AND).toHaveLength(2);
      expect(where.AND).toContainEqual({ status: SignerStatus.SIGNED });
      expect(where.AND).toContainEqual({ status: SignerStatus.DECLINED });
    });

    it('handles email with toLowerCase method (line 156)', () => {
      const spec = {
        email: {
          toLowerCase: () => 'test@example.com'
        }
      } as any;
      const where = repository['whereFromSpec'](spec);
      expect(where.AND).toContainEqual({ email: 'test@example.com' });
    });

    it('handles hasDeclined false (line 164)', () => {
      const spec = {
        hasDeclined: false
      };
      const where = repository['whereFromSpec'](spec);
      expect(where.AND).toContainEqual({ status: { not: SignerStatus.DECLINED } });
    });

    it('handles optional filters - emailContains (line 168)', () => {
      const spec = {
        emailContains: 'test'
      } as any;
      const where = repository['whereFromSpec'](spec);
      expect(where.AND).toHaveLength(1);
      expect(where.AND[0]).toHaveProperty('email');
    });

    it('handles optional filters - fullNameContains (line 169)', () => {
      const spec = {
        fullNameContains: 'John'
      } as any;
      const where = repository['whereFromSpec'](spec);
      expect(where.AND).toHaveLength(1);
      expect(where.AND[0]).toHaveProperty('fullName');
    });

    it('handles optional filters - date ranges (lines 171-176)', () => {
      const spec = {
        signedBefore: new Date('2024-01-01'),
        signedAfter: new Date('2024-01-02'),
        declinedBefore: new Date('2024-01-03'),
        declinedAfter: new Date('2024-01-04'),
        createdBefore: new Date('2024-01-05'),
        createdAfter: new Date('2024-01-06')
      } as any;
      const where = repository['whereFromSpec'](spec);
      expect(where.AND.length).toBeGreaterThan(0);
    });
  });

  describe('toDomain', () => {
    it('wraps domain mapping errors', () => {
      const row = signerPersistenceRow({ id: 'invalid' });
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockImplementation(() => {
        throw new Error('Invalid data');
      });
      expect(() => repository['toDomain'](row)).toThrow();
      spy.mockRestore();
    });
  });

  describe('Public methods - success', () => {
    it('findById returns entity', async () => {
      const row = signerPersistenceRow();
      signerOps.findUnique.mockResolvedValueOnce(row);
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findById(signerVO().id());
      expect(signerOps.findUnique).toHaveBeenCalledWith({ 
        where: { id: expect.any(String) },
        include: { envelope: true, user: true }
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('findById returns null', async () => {
      signerOps.findUnique.mockResolvedValueOnce(null);
      const out = await repository.findById(signerVO().id());
      expect(out).toBeNull();
    });

    it('create without tx', async () => {
      const entity = signerEntity();
      signerOps.create.mockResolvedValueOnce(signerPersistenceRow());
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.create(entity);
      expect(signerOps.create).toHaveBeenCalledWith({ 
        data: expect.objectContaining({ id: entity.getId().getValue() }),
        include: { envelope: true, user: true }
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('update maps partial and returns entity', async () => {
      const id = signerVO().id();
      const partial = partialSignerEntity();
      signerOps.update.mockResolvedValueOnce(signerPersistenceRow());
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.update(id, partial);
      expect(signerOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { envelope: true, user: true }
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('delete removes by id', async () => {
      const id = signerVO().id();
      signerOps.delete.mockResolvedValueOnce({});
      await repository.delete(id);
      expect(signerOps.delete).toHaveBeenCalledWith({ where: { id: id.getValue() } });
    });

    it('list without cursor', async () => {
      mockListPage.mockResolvedValueOnce({ 
        rows: [signerPersistenceRow(), signerPersistenceRow({ id: TestUtils.generateUuid() })], 
        nextCursor: 'nc1' 
      });
      
      const page = await repository.list(signerSpec(), 2);
      
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        2,
        undefined,
        expect.anything()
      );
      expect(page.items.length).toBe(2);
      expect(page.nextCursor).toBe('nc1');
    });

    it('list with cursor', async () => {
      mockDecodeCursor.mockReturnValueOnce({ createdAt: new Date('2024-01-02T00:00:00Z'), id: 'x' });
      mockListPage.mockResolvedValueOnce({ 
        rows: [signerPersistenceRow()], 
        nextCursor: undefined 
      });
      
      const page = await repository.list(signerSpec(), 1, 'cursor123');
      
      expect(mockDecodeCursor).toHaveBeenCalledWith('cursor123');
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1,
        { createdAt: new Date('2024-01-02T00:00:00Z'), id: 'x' },
        expect.anything()
      );
      expect(page.items.length).toBe(1);
      expect(page.nextCursor).toBeUndefined();
    });

    it('list with cursor containing string date (covers normalizeCursor branch)', async () => {
      mockDecodeCursor.mockReturnValueOnce({
        createdAt: '2024-01-02T00:00:00Z', // String instead of Date
        id: 'x'
      });
      
      mockListPage.mockResolvedValueOnce({ 
        rows: [signerPersistenceRow()], 
        nextCursor: undefined 
      });
      
      const page = await repository.list(signerSpec(), 1, 'cursor123');
      
      expect(mockDecodeCursor).toHaveBeenCalledWith('cursor123');
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1,
        { createdAt: '2024-01-02T00:00:00Z', id: 'x' },
        expect.objectContaining({
          normalizeCursor: expect.any(Function)
        })
      );
      expect(page.items.length).toBe(1);
    });

    it('list with undefined cursor (covers cursor branch)', async () => {
      mockListPage.mockResolvedValueOnce({ 
        rows: [signerPersistenceRow()], 
        nextCursor: undefined 
      });
      
      const page = await repository.list(signerSpec(), 1); // No cursor parameter
      
      expect(mockDecodeCursor).not.toHaveBeenCalled();
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1,
        undefined, // No decoded cursor
        expect.anything()
      );
      expect(page.items.length).toBe(1);
    });

    it('findByEnvelopeId', async () => {
      const eId = signerVO().envelopeId();
      const rows = [signerPersistenceRow()];
      signerOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findByEnvelopeId(eId);
      expect(signerOps.findMany).toHaveBeenCalledWith({
        where: { envelopeId: eId.getValue() },
        orderBy: { order: 'asc' },
        include: { envelope: true, user: true }
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('findByUserId', async () => {
      const userId = TestUtils.generateUuid();
      const rows = [signerPersistenceRow()];
      signerOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findByUserId(userId);
      expect(signerOps.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { envelope: true, user: true }
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('findByStatus with envelopeId', async () => {
      const status = SignerStatus.SIGNED;
      const envelopeId = signerVO().envelopeId();
      const rows = [signerPersistenceRow()];
      signerOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findByStatus(status, envelopeId);
      expect(signerOps.findMany).toHaveBeenCalledWith({
        where: { 
          status,
          envelopeId: envelopeId.getValue()
        },
        orderBy: { order: 'asc' },
        include: { envelope: true, user: true }
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('findByStatus without envelopeId', async () => {
      const status = SignerStatus.SIGNED;
      const rows = [signerPersistenceRow()];
      signerOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findByStatus(status);
      expect(signerOps.findMany).toHaveBeenCalledWith({
        where: { status },
        orderBy: { order: 'asc' },
        include: { envelope: true, user: true }
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('existsByEmail returns true when found', async () => {
      const email = 'test@example.com';
      const envelopeId = signerVO().envelopeId();
      signerOps.findFirst.mockResolvedValueOnce({ id: TestUtils.generateUuid() });
      const result = await repository.existsByEmail(email, envelopeId);
      expect(signerOps.findFirst).toHaveBeenCalledWith({
        where: {
          envelopeId: envelopeId.getValue(),
          email: email.toLowerCase()
        },
        select: { id: true }
      });
      expect(result).toBe(true);
    });

    it('existsByEmail returns false when not found', async () => {
      const email = 'test@example.com';
      const envelopeId = signerVO().envelopeId();
      signerOps.findFirst.mockResolvedValueOnce(null);
      const result = await repository.existsByEmail(email, envelopeId);
      expect(result).toBe(false);
    });

    it('updateWithEntity applies pure updater and persists', async () => {
      const id = signerVO().id();
      signerOps.findUnique.mockResolvedValueOnce(signerPersistenceRow());
      signerOps.update.mockResolvedValueOnce(signerPersistenceRow());
      const spy = jest.spyOn(EnvelopeSigner, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.updateWithEntity(id, (s) => s);
      expect(signerOps.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: { envelope: true, user: true }
      });
      expect(signerOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.any(Object),
        include: { envelope: true, user: true }
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });
  });

  describe('Public methods - error wrapping', () => {
    it('findById wraps errors', async () => {
      signerOps.findUnique.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findById(signerVO().id())).rejects.toThrow();
    });

    it('create wraps errors', async () => {
      signerOps.create.mockRejectedValueOnce(new Error('db'));
      await expect(repository.create(signerEntity())).rejects.toThrow();
    });

    it('update wraps errors', async () => {
      signerOps.update.mockRejectedValueOnce(new Error('db'));
      await expect(repository.update(signerVO().id(), partialSignerEntity())).rejects.toThrow();
    });

    it('delete wraps errors', async () => {
      signerOps.delete.mockRejectedValueOnce(new Error('db'));
      await expect(repository.delete(signerVO().id())).rejects.toThrow();
    });

    it('list wraps errors from listPage', async () => {
      mockListPage.mockRejectedValueOnce(new Error('listPage failed'));
      await expect(repository.list(signerSpec())).rejects.toThrow();
    });

    it('findByEnvelopeId wraps errors', async () => {
      signerOps.findMany.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findByEnvelopeId(signerVO().envelopeId())).rejects.toThrow();
    });

    it('findByUserId wraps errors', async () => {
      signerOps.findMany.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findByUserId(TestUtils.generateUuid())).rejects.toThrow();
    });

    it('findByStatus wraps errors', async () => {
      signerOps.findMany.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findByStatus(SignerStatus.SIGNED)).rejects.toThrow();
    });

    it('existsByEmail wraps errors', async () => {
      signerOps.findFirst.mockRejectedValueOnce(new Error('db'));
      await expect(
        repository.existsByEmail('test@example.com', signerVO().envelopeId())
      ).rejects.toThrow();
    });

    it('updateWithEntity throws when not found', async () => {
      signerOps.findUnique.mockResolvedValueOnce(null);
      await expect(
        repository.updateWithEntity(signerVO().id(), (s) => s)
      ).rejects.toThrow();
    });

    it('updateWithEntity handles null return from updateFn (lines 385-386)', async () => {
      signerOps.findUnique.mockResolvedValueOnce(signerPersistenceRow());
      signerOps.update.mockResolvedValueOnce(signerPersistenceRow());
      
      // updateFn returns null, should fallback to current entity
      const result = await repository.updateWithEntity(signerVO().id(), () => null as any);
      
      expect(signerOps.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
