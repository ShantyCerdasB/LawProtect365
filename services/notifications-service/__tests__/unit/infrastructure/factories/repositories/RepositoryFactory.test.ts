/**
 * @fileoverview RepositoryFactory Tests - Unit tests for RepositoryFactory
 * @summary Tests for repository creation and database configuration
 * @description Comprehensive test suite for RepositoryFactory covering
 * Prisma client creation and repository instantiation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RepositoryFactory } from '../../../../../src/infrastructure/factories/repositories/RepositoryFactory';
import { PrismaNotificationRepository } from '../../../../../src/repositories/PrismaNotificationRepository';
import { PrismaClient } from '@prisma/client';

jest.mock('@lawprotect/shared-ts', () => {
  const actual = jest.requireActual('@lawprotect/shared-ts') as typeof import('@lawprotect/shared-ts');
  return {
    ...actual,
    getPrisma: jest.fn(() => new PrismaClient()),
    getPrismaAsync: jest.fn(() => Promise.resolve(new PrismaClient())),
  };
});

describe('RepositoryFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrismaClient', () => {
    it('creates Prisma client instance', () => {
      const client = RepositoryFactory.getPrismaClient();
      expect(client).toBeInstanceOf(PrismaClient);
    });

    it('returns same instance on multiple calls', () => {
      const client1 = RepositoryFactory.getPrismaClient();
      const client2 = RepositoryFactory.getPrismaClient();
      expect(client1).toBe(client2);
    });
  });

  describe('getPrismaClientAsync', () => {
    it('creates Prisma client instance asynchronously', async () => {
      const client = await RepositoryFactory.getPrismaClientAsync();
      expect(client).toBeInstanceOf(PrismaClient);
    });

    it('returns same instance on multiple calls', async () => {
      const client1 = await RepositoryFactory.getPrismaClientAsync();
      const client2 = await RepositoryFactory.getPrismaClientAsync();
      expect(client1).toBe(client2);
    });
  });

  describe('createNotificationRepository', () => {
    it('creates NotificationRepository with Prisma client', () => {
      const repository = RepositoryFactory.createNotificationRepository();
      expect(repository).toBeInstanceOf(PrismaNotificationRepository);
    });
  });

  describe('createAll', () => {
    it('creates all repositories synchronously', () => {
      const result = RepositoryFactory.createAll();
      expect(result.notificationRepository).toBeInstanceOf(PrismaNotificationRepository);
    });
  });

  describe('createAllAsync', () => {
    it('creates all repositories asynchronously', async () => {
      const result = await RepositoryFactory.createAllAsync();
      expect(result.notificationRepository).toBeInstanceOf(PrismaNotificationRepository);
    });
  });
});

