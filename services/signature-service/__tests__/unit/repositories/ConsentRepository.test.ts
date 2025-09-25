import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the shared-ts module BEFORE importing the repository
const mockListPage = jest.fn() as any;
const mockDecodeCursor = jest.fn() as any;

jest.unstable_mockModule('@lawprotect/shared-ts', async () => {
  const real = await import('@lawprotect/shared-ts');
  return {
    ...real,
    decodeCursor: mockDecodeCursor,
    listPage: mockListPage,
    textContainsInsensitive: real.textContainsInsensitive,
    rangeFilter: real.rangeFilter,
  };
});

// Import AFTER the mock is set up
import type { Prisma } from '@prisma/client';
import { ConsentRepository } from '../../../src/repositories/ConsentRepository';
import { Consent } from '../../../src/domain/entities/Consent';
import { ConsentId } from '../../../src/domain/value-objects/ConsentId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../helpers/testUtils';
import {
  createPrismaMock,
  createTransactionMock,
  type PrismaConsentMock,
} from './helpers/prisma-mock';
import {
  consentPersistenceRow,
  consentEntity,
  consentSpec,
  consentDto,
  partialConsentEntity,
  consentVO,
} from './helpers/builders';
import {
  mockRepositoryMethod,
  mockRepositoryMethodError,
  createMockPage,
} from './helpers/repository-mock-helpers';

describe('ConsentRepository - Internal Methods', () => {
  let repository: ConsentRepository;
  let prismaMock: { consent: PrismaConsentMock };
  let consentOps: PrismaConsentMock;
  let shared: any;

  beforeEach(async () => {
    shared = await import('@lawprotect/shared-ts');
    const { prisma, consent } = createPrismaMock();
    prismaMock = prisma as unknown as { consent: PrismaConsentMock };
    consentOps = consent;
    repository = new ConsentRepository(prismaMock as any);
    jest.clearAllMocks();
    mockListPage.mockClear();
    mockDecodeCursor.mockClear();
  });

  describe('toCreateModel', () => {
    it('maps entity to Prisma create input (no signatureId)', () => {
      const entity = consentEntity({ signatureId: null });
      const out = (repository as any).toCreateModel(entity) as Prisma.ConsentUncheckedCreateInput;
      expect(out).toMatchObject({
        id: entity.getId().getValue(),
        envelopeId: entity.getEnvelopeId().getValue(),
        signerId: entity.getSignerId().getValue(),
        signatureId: null,
        consentGiven: true,
        consentText: 'I agree to the terms and conditions',
        ipAddress: entity.getIpAddress(),
        country: 'US',
      });
      expect(out.consentTimestamp).toBeInstanceOf(Date);
    });

    it('maps entity to Prisma create input (with signatureId)', () => {
      const signatureId = TestUtils.generateUuid();
      const entity = consentEntity({ signatureId });
      const out = (repository as any).toCreateModel(entity) as Prisma.ConsentUncheckedCreateInput;
      expect(out.signatureId).toBe(signatureId);
    });
  });

  describe('toUpdateModel', () => {
    it('supports partial entity getters', () => {
      const partial = partialConsentEntity({ consentGiven: false, consentText: 'Updated text' });
      const out = (repository as any).toUpdateModel(partial) as Prisma.ConsentUncheckedUpdateInput;
      expect(out).toEqual({ consentGiven: false, consentText: 'Updated text' });
    });

    it('supports DTO and nullables', () => {
      const dto = consentDto({ country: null, userAgent: 'UA-1' });
      const out = (repository as any).toUpdateModel(dto) as Prisma.ConsentUncheckedUpdateInput;
      expect(out).toMatchObject({
        consentGiven: true,
        consentText: 'Updated consent text',
        ipAddress: dto.ipAddress,
        userAgent: 'UA-1',
        country: null,
      });
    });

    it('ignores undefined', () => {
      const out = (repository as any).toUpdateModel({ consentText: undefined });
      expect(out).toEqual({});
    });

    it('prefers getters over DTO fields', () => {
      const mixed = { getConsentGiven: () => false, consentGiven: true };
      const out = (repository as any).toUpdateModel(mixed);
      expect(out.consentGiven).toBe(false);
    });

    it('handles signatureId null and string', () => {
      expect((repository as any).toUpdateModel({ signatureId: null }).signatureId).toBeNull();
      expect((repository as any).toUpdateModel({ signatureId: 'x' }).signatureId).toBe('x');
    });
  });

  describe('whereById', () => {
    it('builds where by id', () => {
      const id = consentVO.id();
      const where = (repository as any).whereById(id);
      expect(where).toEqual({ id: id.getValue() });
    });
  });

  describe('whereFromSpec', () => {
    it('unwraps and applies filters and ranges', () => {
      const spec = consentSpec({
        consentText: 'hello',
        userAgent: 'Chrome',
      });
      const where = (repository as any).whereFromSpec(spec);
      expect(where.envelopeId).toBe(spec.envelopeId);
      expect(where.signerId).toBe(spec.signerId);
      expect(where.signatureId).toBe(spec.signatureId);
      expect(where.consentGiven).toBe(true);
      expect(where.consentText).toMatchObject({ contains: 'hello', mode: 'insensitive' });
      expect(where.userAgent).toMatchObject({ contains: 'Chrome', mode: 'insensitive' });
      expect(where.consentTimestamp).toMatchObject({ gte: spec.consentAfter, lt: spec.consentBefore });
      expect(where.createdAt).toMatchObject({ gte: spec.createdAfter, lt: spec.createdBefore });
    });

    it('tolerates undefined/null', () => {
      const spec: any = { envelopeId: undefined, signatureId: null, consentGiven: false };
      const where = (repository as any).whereFromSpec(spec);
      expect(where.envelopeId).toBeUndefined();
      expect(where.signatureId).toBeUndefined();
      expect(where.consentGiven).toBe(false);
    });
  });

  describe('toDomain', () => {
    it('wraps domain mapping errors', () => {
      const row = consentPersistenceRow();
      const spy = jest.spyOn(Consent, 'fromPersistence').mockImplementation(() => {
        throw new Error('boom');
      });
      expect(() => (repository as any).toDomain(row)).toThrow();
      spy.mockRestore();
    });
  });

  describe('Public methods - success', () => {
    it('findById returns entity', async () => {
      const row = consentPersistenceRow();
      consentOps.findUnique.mockResolvedValueOnce(row);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.findById(ConsentId.fromString(row.id));
      expect(consentOps.findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('findById returns null', async () => {
      consentOps.findUnique.mockResolvedValueOnce(null);
      const out = await repository.findById(consentVO.id());
      expect(out).toBeNull();
    });

    it('create uses tx when provided', async () => {
      const entity = consentEntity({ signatureId: null });
      const row = consentPersistenceRow();
      const tx = createTransactionMock(consentOps);
      (tx.consent.create as any).mockResolvedValueOnce(row);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.create(entity, tx as any);
      expect(tx.consent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: entity.getId().getValue() }) });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('update maps partial and returns entity', async () => {
      const id = consentVO.id();
      const row = consentPersistenceRow({ consentGiven: false, consentText: 'Updated text' });
      consentOps.update.mockResolvedValueOnce(row);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.update(id, { getConsentGiven: () => false, getConsentText: () => 'Updated text' } as any);
      expect(consentOps.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: { consentGiven: false, consentText: 'Updated text' },
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('delete removes by id', async () => {
      const id = consentVO.id();
      consentOps.delete.mockResolvedValueOnce(undefined as any);
      await repository.delete(id);
      expect(consentOps.delete).toHaveBeenCalledWith({ where: { id: id.getValue() } });
    });

    it('list without cursor', async () => {
      const spy = jest.spyOn(Consent, 'fromPersistence').mockImplementation(() => ({} as any));
      
      // Use the pre-configured mocks
      mockListPage.mockResolvedValueOnce({ 
        rows: [consentPersistenceRow(), consentPersistenceRow({ id: TestUtils.generateUuid() })], 
        nextCursor: 'nc1' 
      });
      
      const page = await repository.list(consentSpec(), 2);
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        2,
        undefined,
        expect.anything()
      );
      expect(page.items.length).toBe(2);
      expect(page.nextCursor).toBe('nc1');
      
      spy.mockRestore();
    });

    it('list with cursor', async () => {
      const spy = jest.spyOn(Consent, 'fromPersistence').mockImplementation(() => ({} as any));
      
      // Use the pre-configured mocks
      mockDecodeCursor.mockReturnValueOnce({ createdAt: new Date('2024-01-02T00:00:00Z'), id: 'x' });
      mockListPage.mockResolvedValueOnce({ 
        rows: [consentPersistenceRow()], 
        nextCursor: undefined 
      });
      
      const page = await repository.list(consentSpec(), 1, 'opaque-cursor');
      expect(mockDecodeCursor).toHaveBeenCalledWith('opaque-cursor');
      expect(mockListPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1,
        { createdAt: new Date('2024-01-02T00:00:00Z'), id: 'x' },
        expect.anything()
      );
      expect(page.items.length).toBe(1);
      expect(page.nextCursor).toBeUndefined();
      
      spy.mockRestore();
    });

    it('findByEnvelopeId', async () => {
      const eId = EnvelopeId.fromString(TestUtils.generateUuid());
      const rows = [consentPersistenceRow()];
      consentOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findByEnvelopeId(eId);
      expect(consentOps.findMany).toHaveBeenCalledWith({
        where: { envelopeId: eId.getValue() },
        orderBy: { createdAt: 'desc' },
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('findBySignerId', async () => {
      const sId = SignerId.fromString(TestUtils.generateUuid());
      const rows = [consentPersistenceRow()];
      consentOps.findMany.mockResolvedValueOnce(rows);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValue({} as any);
      const out = await repository.findBySignerId(sId);
      expect(consentOps.findMany).toHaveBeenCalledWith({
        where: { signerId: sId.getValue() },
        orderBy: { createdAt: 'desc' },
      });
      expect(out).toEqual([{}]);
      spy.mockRestore();
    });

    it('findBySignerAndEnvelope via composite key', async () => {
      const sId = SignerId.fromString(TestUtils.generateUuid());
      const eId = EnvelopeId.fromString(TestUtils.generateUuid());
      const row = consentPersistenceRow();
      consentOps.findUnique.mockResolvedValueOnce(row);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.findBySignerAndEnvelope(sId, eId);
      expect(consentOps.findUnique).toHaveBeenCalledWith({
        where: { envelopeId_signerId: { envelopeId: eId.getValue(), signerId: sId.getValue() } },
      });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('findByActingSignerId', async () => {
      const aId = SignerId.fromString(TestUtils.generateUuid());
      const row = consentPersistenceRow({ signatureId: aId.getValue() });
      consentOps.findFirst.mockResolvedValueOnce(row);
      const spy = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.findByActingSignerId(aId);
      expect(consentOps.findFirst).toHaveBeenCalledWith({ where: { signatureId: aId.getValue() } });
      expect(out).toEqual({});
      spy.mockRestore();
    });

    it('countByEnvelopeId', async () => {
      const eId = EnvelopeId.fromString(TestUtils.generateUuid());
      consentOps.count.mockResolvedValueOnce(5);
      const out = await repository.countByEnvelopeId(eId);
      expect(consentOps.count).toHaveBeenCalledWith({ where: { envelopeId: eId.getValue() } });
      expect(out).toBe(5);
    });

    it('existsBySignerAndEnvelope', async () => {
      const sId = SignerId.fromString(TestUtils.generateUuid());
      const eId = EnvelopeId.fromString(TestUtils.generateUuid());
      consentOps.count.mockResolvedValueOnce(1);
      const yes = await repository.existsBySignerAndEnvelope(sId, eId);
      expect(yes).toBe(true);
      consentOps.count.mockResolvedValueOnce(0);
      const no = await repository.existsBySignerAndEnvelope(sId, eId);
      expect(no).toBe(false);
    });

    it('updateWithEntity applies pure updater and persists', async () => {
      const id = ConsentId.fromString(TestUtils.generateUuid());
      const signatureId = TestUtils.generateUuid();
      const start = consentEntity({ id: id.getValue() });
      consentOps.findUnique.mockResolvedValueOnce(consentPersistenceRow({ id: id.getValue() }));
      const mapSpy1 = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce(start as any);
      const updatedRow = consentPersistenceRow({ consentText: 'NEW' });
      const tx = createTransactionMock(consentOps);
      (tx.consent.update as any).mockResolvedValueOnce(updatedRow);
      const mapSpy2 = jest.spyOn(Consent, 'fromPersistence').mockReturnValueOnce({} as any);
      const out = await repository.updateWithEntity(
        id,
        (c) => c.linkWithSignature(SignerId.fromString(signatureId)),
        tx as any
      );
      expect(tx.consent.update).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        data: expect.objectContaining({ signatureId }),
      });
      expect(out).toEqual({});
      mapSpy1.mockRestore();
      mapSpy2.mockRestore();
    });
  });

  describe('Public methods - error wrapping', () => {
    it('findById wraps errors', async () => {
      consentOps.findUnique.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findById(consentVO.id())).rejects.toThrow();
    });

    it('create wraps errors', async () => {
      consentOps.create.mockRejectedValueOnce(new Error('db'));
      await expect(repository.create(consentEntity() as any)).rejects.toThrow();
    });

    it('update wraps errors', async () => {
      consentOps.update.mockRejectedValueOnce(new Error('db'));
      await expect(repository.update(consentVO.id(), {} as any)).rejects.toThrow();
    });

    it('delete wraps errors', async () => {
      consentOps.delete.mockRejectedValueOnce(new Error('db'));
      await expect(repository.delete(consentVO.id())).rejects.toThrow();
    });

    it('list wraps errors from listPage', async () => {
      // Use the pre-configured mock to throw error
      mockListPage.mockRejectedValueOnce(new Error('db'));

      await expect(repository.list(consentSpec(), 2)).rejects.toThrow();
    });

    it('findByEnvelopeId wraps errors', async () => {
      consentOps.findMany.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findByEnvelopeId(consentVO.envId())).rejects.toThrow();
    });

    it('findBySignerId wraps errors', async () => {
      consentOps.findMany.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findBySignerId(consentVO.signerId())).rejects.toThrow();
    });

    it('findBySignerAndEnvelope wraps errors', async () => {
      consentOps.findUnique.mockRejectedValueOnce(new Error('db'));
      await expect(
        repository.findBySignerAndEnvelope(consentVO.signerId(), consentVO.envId())
      ).rejects.toThrow();
    });

    it('findByActingSignerId wraps errors', async () => {
      consentOps.findFirst.mockRejectedValueOnce(new Error('db'));
      await expect(repository.findByActingSignerId(consentVO.signerId())).rejects.toThrow();
    });

    it('countByEnvelopeId wraps errors', async () => {
      consentOps.count.mockRejectedValueOnce(new Error('db'));
      await expect(repository.countByEnvelopeId(consentVO.envId())).rejects.toThrow();
    });

    it('existsBySignerAndEnvelope wraps errors', async () => {
      consentOps.count.mockRejectedValueOnce(new Error('db'));
      await expect(
        repository.existsBySignerAndEnvelope(consentVO.signerId(), consentVO.envId())
      ).rejects.toThrow();
    });

    it('updateWithEntity throws when not found', async () => {
      consentOps.findUnique.mockResolvedValueOnce(null);
      await expect(
        repository.updateWithEntity(consentVO.id(), (c) => c)
      ).rejects.toThrow();
    });
  });
});
