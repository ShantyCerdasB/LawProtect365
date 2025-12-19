/**
 * @fileoverview RepositoryFactory Tests - Unit tests for RepositoryFactory
 * @summary Tests all repository factory methods
 * @description Tests that RepositoryFactory correctly creates repository instances with Prisma client.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RepositoryFactory } from '../../../../src/infrastructure/factories/RepositoryFactory';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { OAuthAccountRepository } from '../../../../src/repositories/OAuthAccountRepository';
import { UserAuditEventRepository } from '../../../../src/repositories/UserAuditEventRepository';
import { UserPersonalInfoRepository } from '../../../../src/repositories/UserPersonalInfoRepository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({}))
}));

describe('RepositoryFactory', () => {
  beforeEach(() => {
    (RepositoryFactory as any).prismaClient = undefined;
    jest.clearAllMocks();
  });

  describe('createPrismaClient', () => {
    it('creates Prisma client instance', () => {
      const client = RepositoryFactory.createPrismaClient();

      expect(PrismaClient).toHaveBeenCalled();
      expect(client).toBeDefined();
    });

    it('returns same instance on subsequent calls', () => {
      const client1 = RepositoryFactory.createPrismaClient();
      const client2 = RepositoryFactory.createPrismaClient();

      expect(client1).toBe(client2);
      expect(PrismaClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUserRepository', () => {
    it('creates UserRepository instance', () => {
      const repository = RepositoryFactory.createUserRepository();

      expect(repository).toBeInstanceOf(UserRepository);
    });

    it('uses Prisma client', () => {
      RepositoryFactory.createUserRepository();
      expect(PrismaClient).toHaveBeenCalled();
    });
  });

  describe('createOAuthAccountRepository', () => {
    it('creates OAuthAccountRepository instance', () => {
      const repository = RepositoryFactory.createOAuthAccountRepository();

      expect(repository).toBeInstanceOf(OAuthAccountRepository);
    });
  });

  describe('createUserAuditEventRepository', () => {
    it('creates UserAuditEventRepository instance', () => {
      const repository = RepositoryFactory.createUserAuditEventRepository();

      expect(repository).toBeInstanceOf(UserAuditEventRepository);
    });
  });

  describe('createUserPersonalInfoRepository', () => {
    it('creates UserPersonalInfoRepository instance', () => {
      const repository = RepositoryFactory.createUserPersonalInfoRepository();

      expect(repository).toBeInstanceOf(UserPersonalInfoRepository);
    });
  });

  describe('createAll', () => {
    it('creates all repositories', () => {
      const repositories = RepositoryFactory.createAll();

      expect(repositories.userRepository).toBeInstanceOf(UserRepository);
      expect(repositories.oauthAccountRepository).toBeInstanceOf(OAuthAccountRepository);
      expect(repositories.userAuditEventRepository).toBeInstanceOf(UserAuditEventRepository);
      expect(repositories.userPersonalInfoRepository).toBeInstanceOf(UserPersonalInfoRepository);
    });
  });
});

