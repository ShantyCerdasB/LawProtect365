/**
 * @fileoverview Prisma Mock Helpers - Reusable Prisma mock utilities for repository tests
 */

import { jest } from '@jest/globals';
import type { Prisma } from '@prisma/client';

export type PrismaConsentMock = {
  findUnique: ReturnType<typeof jest.fn>;
  findFirst: ReturnType<typeof jest.fn>;
  findMany: ReturnType<typeof jest.fn>;
  count: ReturnType<typeof jest.fn>;
  create: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
};

export function createConsentOpsMock(): PrismaConsentMock {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/** Prisma-like client with only the consent model mocked */
export function createPrismaMock() {
  const consent = createConsentOpsMock();
  const prisma = { consent } as unknown as { consent: PrismaConsentMock };
  return { prisma, consent };
}

/** Transaction client compatible with tx?: Prisma.TransactionClient */
export function createTransactionMock(consentMock: PrismaConsentMock): Prisma.TransactionClient {
  // Prisma.TransactionClient es estructural: proveemos el modelo y $transaction opcional si se usa.
  const txMock = {
    consent: consentMock as unknown as any,
    $transaction: jest.fn((cb: any) => cb?.(txMock)),
  };
  return txMock as unknown as Prisma.TransactionClient;
}
