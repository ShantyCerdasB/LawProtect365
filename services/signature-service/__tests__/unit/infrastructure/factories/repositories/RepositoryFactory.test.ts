/**
 * @fileoverview RepositoryFactory Tests - Unit tests for RepositoryFactory
 * @summary Tests for the factory that creates Prisma-backed repositories
 * @description Comprehensive unit tests for RepositoryFactory class that verifies
 * proper creation of repositories with database client configuration.
 */

import { RepositoryFactory } from '../../../../../src/infrastructure/factories/repositories/RepositoryFactory';

const mockPrismaClient = {};

jest.mock('@lawprotect/shared-ts', () => ({
  getPrisma: jest.fn(() => mockPrismaClient),
  getPrismaAsync: jest.fn(() => Promise.resolve(mockPrismaClient)),
  UserPersonalInfoRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/SignatureEnvelopeRepository', () => ({
  SignatureEnvelopeRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/EnvelopeSignerRepository', () => ({
  EnvelopeSignerRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/InvitationTokenRepository', () => ({
  InvitationTokenRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/SignatureAuditEventRepository', () => ({
  SignatureAuditEventRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/ConsentRepository', () => ({
  ConsentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/repositories/SignerReminderTrackingRepository', () => ({
  SignerReminderTrackingRepository: jest.fn().mockImplementation(() => ({})),
}));

describe('RepositoryFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RepositoryFactory as any).prismaClient = undefined;
  });

  it('should be importable', () => {
    expect(RepositoryFactory).toBeDefined();
  });

  it('should have getPrismaClientAsync method', () => {
    expect(RepositoryFactory.getPrismaClientAsync).toBeDefined();
    expect(typeof RepositoryFactory.getPrismaClientAsync).toBe('function');
  });

  it('should have getPrismaClient method', () => {
    expect(RepositoryFactory.getPrismaClient).toBeDefined();
    expect(typeof RepositoryFactory.getPrismaClient).toBe('function');
  });

  it('should have createSignatureEnvelopeRepository method', () => {
    expect(RepositoryFactory.createSignatureEnvelopeRepository).toBeDefined();
    expect(typeof RepositoryFactory.createSignatureEnvelopeRepository).toBe('function');
  });

  it('should have createEnvelopeSignerRepository method', () => {
    expect(RepositoryFactory.createEnvelopeSignerRepository).toBeDefined();
    expect(typeof RepositoryFactory.createEnvelopeSignerRepository).toBe('function');
  });

  it('should have createInvitationTokenRepository method', () => {
    expect(RepositoryFactory.createInvitationTokenRepository).toBeDefined();
    expect(typeof RepositoryFactory.createInvitationTokenRepository).toBe('function');
  });

  it('should have createSignatureAuditEventRepository method', () => {
    expect(RepositoryFactory.createSignatureAuditEventRepository).toBeDefined();
    expect(typeof RepositoryFactory.createSignatureAuditEventRepository).toBe('function');
  });

  it('should have createConsentRepository method', () => {
    expect(RepositoryFactory.createConsentRepository).toBeDefined();
    expect(typeof RepositoryFactory.createConsentRepository).toBe('function');
  });

  it('should have createSignerReminderTrackingRepository method', () => {
    expect(RepositoryFactory.createSignerReminderTrackingRepository).toBeDefined();
    expect(typeof RepositoryFactory.createSignerReminderTrackingRepository).toBe('function');
  });

  it('should have createUserPersonalInfoRepository method', () => {
    expect(RepositoryFactory.createUserPersonalInfoRepository).toBeDefined();
    expect(typeof RepositoryFactory.createUserPersonalInfoRepository).toBe('function');
  });

  it('should have createAll method', () => {
    expect(RepositoryFactory.createAll).toBeDefined();
    expect(typeof RepositoryFactory.createAll).toBe('function');
  });

  it('should have createAllAsync method', () => {
    expect(RepositoryFactory.createAllAsync).toBeDefined();
    expect(typeof RepositoryFactory.createAllAsync).toBe('function');
  });

  describe('getPrismaClient', () => {
    it('should return Prisma client instance', () => {
      const { getPrisma } = require('@lawprotect/shared-ts');
      const result = RepositoryFactory.getPrismaClient();

      expect(result).toBeDefined();
      expect(getPrisma).toHaveBeenCalled();
    });

    it('should return same instance on subsequent calls', () => {
      const result1 = RepositoryFactory.getPrismaClient();
      const result2 = RepositoryFactory.getPrismaClient();

      expect(result1).toBe(result2);
    });
  });

  describe('getPrismaClientAsync', () => {
    it('should return Prisma client instance asynchronously', async () => {
      const { getPrismaAsync } = require('@lawprotect/shared-ts');
      const result = await RepositoryFactory.getPrismaClientAsync();

      expect(result).toBeDefined();
      expect(getPrismaAsync).toHaveBeenCalled();
    });

    it('should return same instance on subsequent calls', async () => {
      const result1 = await RepositoryFactory.getPrismaClientAsync();
      const result2 = await RepositoryFactory.getPrismaClientAsync();

      expect(result1).toBe(result2);
    });
  });

  describe('createSignatureEnvelopeRepository', () => {
    it('should create SignatureEnvelopeRepository instance', () => {
      const { SignatureEnvelopeRepository } = require('../../../../../src/repositories/SignatureEnvelopeRepository');
      const result = RepositoryFactory.createSignatureEnvelopeRepository();

      expect(result).toBeDefined();
      expect(SignatureEnvelopeRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createEnvelopeSignerRepository', () => {
    it('should create EnvelopeSignerRepository instance', () => {
      const { EnvelopeSignerRepository } = require('../../../../../src/repositories/EnvelopeSignerRepository');
      const result = RepositoryFactory.createEnvelopeSignerRepository();

      expect(result).toBeDefined();
      expect(EnvelopeSignerRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createInvitationTokenRepository', () => {
    it('should create InvitationTokenRepository instance', () => {
      const { InvitationTokenRepository } = require('../../../../../src/repositories/InvitationTokenRepository');
      const result = RepositoryFactory.createInvitationTokenRepository();

      expect(result).toBeDefined();
      expect(InvitationTokenRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createSignatureAuditEventRepository', () => {
    it('should create SignatureAuditEventRepository instance', () => {
      const { SignatureAuditEventRepository } = require('../../../../../src/repositories/SignatureAuditEventRepository');
      const result = RepositoryFactory.createSignatureAuditEventRepository();

      expect(result).toBeDefined();
      expect(SignatureAuditEventRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createConsentRepository', () => {
    it('should create ConsentRepository instance', () => {
      const { ConsentRepository } = require('../../../../../src/repositories/ConsentRepository');
      const result = RepositoryFactory.createConsentRepository();

      expect(result).toBeDefined();
      expect(ConsentRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createSignerReminderTrackingRepository', () => {
    it('should create SignerReminderTrackingRepository instance', () => {
      const { SignerReminderTrackingRepository } = require('../../../../../src/repositories/SignerReminderTrackingRepository');
      const result = RepositoryFactory.createSignerReminderTrackingRepository();

      expect(result).toBeDefined();
      expect(SignerReminderTrackingRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createUserPersonalInfoRepository', () => {
    it('should create UserPersonalInfoRepository instance', () => {
      const { UserPersonalInfoRepository } = require('@lawprotect/shared-ts');
      const result = RepositoryFactory.createUserPersonalInfoRepository();

      expect(result).toBeDefined();
      expect(UserPersonalInfoRepository).toHaveBeenCalledWith(mockPrismaClient);
    });
  });

  describe('createAll', () => {
    it('should create all repositories', () => {
      const result = RepositoryFactory.createAll();

      expect(result).toBeDefined();
      expect(result.signatureEnvelopeRepository).toBeDefined();
      expect(result.envelopeSignerRepository).toBeDefined();
      expect(result.invitationTokenRepository).toBeDefined();
      expect(result.signatureAuditEventRepository).toBeDefined();
      expect(result.consentRepository).toBeDefined();
      expect(result.signerReminderTrackingRepository).toBeDefined();
      expect(result.userPersonalInfoRepository).toBeDefined();
    });

    it('should return object with all required repositories', () => {
      const result = RepositoryFactory.createAll();

      expect(result).toHaveProperty('signatureEnvelopeRepository');
      expect(result).toHaveProperty('envelopeSignerRepository');
      expect(result).toHaveProperty('invitationTokenRepository');
      expect(result).toHaveProperty('signatureAuditEventRepository');
      expect(result).toHaveProperty('consentRepository');
      expect(result).toHaveProperty('signerReminderTrackingRepository');
      expect(result).toHaveProperty('userPersonalInfoRepository');
    });
  });

  describe('createAllAsync', () => {
    it('should create all repositories asynchronously', async () => {
      const result = await RepositoryFactory.createAllAsync();

      expect(result).toBeDefined();
      expect(result.signatureEnvelopeRepository).toBeDefined();
      expect(result.envelopeSignerRepository).toBeDefined();
      expect(result.invitationTokenRepository).toBeDefined();
      expect(result.signatureAuditEventRepository).toBeDefined();
      expect(result.consentRepository).toBeDefined();
      expect(result.signerReminderTrackingRepository).toBeDefined();
      expect(result.userPersonalInfoRepository).toBeDefined();
    });

    it('should return object with all required repositories', async () => {
      const result = await RepositoryFactory.createAllAsync();

      expect(result).toHaveProperty('signatureEnvelopeRepository');
      expect(result).toHaveProperty('envelopeSignerRepository');
      expect(result).toHaveProperty('invitationTokenRepository');
      expect(result).toHaveProperty('signatureAuditEventRepository');
      expect(result).toHaveProperty('consentRepository');
      expect(result).toHaveProperty('signerReminderTrackingRepository');
      expect(result).toHaveProperty('userPersonalInfoRepository');
    });
  });
});
