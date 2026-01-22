/**
 * @fileoverview Prisma Mock Helpers - Reusable Prisma mock utilities for repository tests
 * @summary Provides Prisma client and transaction mocks for testing
 * @description This module provides utilities for creating mock Prisma clients and transactions
 * that can be used across different repository tests. It follows the single responsibility
 * principle by focusing only on Prisma-related mocking.
 */

import { jest } from '@jest/globals';
import type { Prisma } from '@prisma/client';

/**
 * Mock interface for Prisma model operations
 */
export type PrismaModelMock = {
  findUnique: ReturnType<typeof jest.fn>;
  findFirst: ReturnType<typeof jest.fn>;
  findMany: ReturnType<typeof jest.fn>;
  count: ReturnType<typeof jest.fn>;
  create: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
  upsert: ReturnType<typeof jest.fn>;
};

/**
 * Creates a mock for Prisma model operations
 * @returns Mock object with all Prisma model methods
 */
export function createPrismaModelMock(): PrismaModelMock {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  };
}

/**
 * Creates a Prisma client mock with specified models
 * @param models - Object with model names as keys and mock operations as values
 * @returns Mock Prisma client
 */
export function createPrismaMock<T extends Record<string, PrismaModelMock>>(models: T) {
  const prisma = { ...models } as unknown as { [K in keyof T]: T[K] };
  return { prisma, ...models };
}

/**
 * Creates a transaction client mock
 * @param modelMocks - Object with model names as keys and mock operations as values
 * @returns Mock transaction client compatible with Prisma.TransactionClient
 */
export function createTransactionMock<T extends Record<string, PrismaModelMock>>(
  modelMocks: T
): Prisma.TransactionClient {
  const txMock = {
    ...modelMocks,
    $transaction: jest.fn((cb: any) => cb?.(txMock)),
  };
  return txMock as unknown as Prisma.TransactionClient;
}

/**
 * Convenience function for creating Notification-specific Prisma mocks
 * @returns Object with prisma client and notification model mock
 */
export function createNotificationPrismaMock() {
  const notification = createPrismaModelMock();
  return createPrismaMock({ notification });
}














