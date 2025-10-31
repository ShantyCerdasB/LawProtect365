/**
 * @fileoverview prismaUtils - Database transaction utilities for tests
 * @summary Utilities for managing database transactions in integration tests
 * @description Provides utilities for managing database transactions using
 * savepoints to ensure test isolation and fast cleanup.
 */

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Transaction context for tests
 */
export interface TransactionContext {
  savepointId: string;
  prisma: PrismaClient;
}

/**
 * Begins a transaction with a savepoint for test isolation
 * @param prisma - Prisma client instance
 * @returns Transaction context with savepoint
 */
export async function beginWithSavepoint(prisma: PrismaClient): Promise<TransactionContext> {
  const { randomBytes } = require('node:crypto');
  const savepointId = `test_savepoint_${Date.now()}_${randomBytes(5).toString('hex')}`;
  
  // Start transaction
  await prisma.$executeRaw`BEGIN`;
  
  // Create savepoint
  await prisma.$executeRaw(Prisma.sql`SAVEPOINT ${Prisma.raw(savepointId)}`);
  
  return {
    savepointId,
    prisma
  };
}

/**
 * Rolls back to a savepoint, undoing all changes since the savepoint
 * @param context - Transaction context
 */
export async function rollbackToSavepoint(context: TransactionContext): Promise<void> {
  const { savepointId, prisma } = context;
  
  try {
    await prisma.$executeRaw(Prisma.sql`ROLLBACK TO SAVEPOINT ${Prisma.raw(savepointId)}`);
  } catch (error) {
    // If savepoint doesn't exist, it's already been released
    if (!(error as Error).message?.includes('savepoint') && !(error as Error).message?.includes('SAVEPOINT')) {
      throw error;
    }
  }
}

/**
 * Releases a savepoint, committing changes up to that point
 * @param context - Transaction context
 */
export async function releaseSavepoint(context: TransactionContext): Promise<void> {
  const { savepointId, prisma } = context;
  
  try {
    await prisma.$executeRaw(Prisma.sql`RELEASE SAVEPOINT ${Prisma.raw(savepointId)}`);
  } catch (error) {
    // If savepoint doesn't exist, it's already been released
    if (!(error as Error).message?.includes('savepoint') && !(error as Error).message?.includes('SAVEPOINT')) {
      throw error;
    }
  }
}

/**
 * Commits the current transaction
 * @param prisma - Prisma client instance
 */
export async function commitTransaction(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`COMMIT`;
}

/**
 * Rolls back the entire transaction
 * @param prisma - Prisma client instance
 */
export async function rollbackTransaction(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`ROLLBACK`;
}

/**
 * Executes a function within a transaction with automatic cleanup
 * @param prisma - Prisma client instance
 * @param fn - Function to execute within transaction
 * @returns Result of the function
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const context = await beginWithSavepoint(prisma);
  
  try {
    const result = await fn(prisma);
    await releaseSavepoint(context);
    await commitTransaction(prisma);
    return result;
  } catch (error) {
    await rollbackToSavepoint(context);
    await rollbackTransaction(prisma);
    throw error;
  }
}

/**
 * Executes a function within a transaction with automatic rollback
 * @param prisma - Prisma client instance
 * @param fn - Function to execute within transaction
 * @returns Result of the function
 */
export async function withTransactionRollback<T>(
  prisma: PrismaClient,
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const context = await beginWithSavepoint(prisma);
  
  try {
    const result = await fn(prisma);
    await rollbackToSavepoint(context);
    await rollbackTransaction(prisma);
    return result;
  } catch (error) {
    await rollbackToSavepoint(context);
    await rollbackTransaction(prisma);
    throw error;
  }
}

/**
 * Cleans up a transaction context
 * @param context - Transaction context to clean up
 */
export async function cleanupTransaction(context: TransactionContext): Promise<void> {
  const { prisma } = context;
  
  try {
    await rollbackTransaction(prisma);
  } catch (error) {
    // Transaction might already be closed
    if (!(error as Error).message?.includes('transaction') && !(error as Error).message?.includes('TRANSACTION')) {
      throw error;
    }
  }
}

/**
 * Verifies that a transaction is active
 * @param prisma - Prisma client instance
 * @returns True if transaction is active
 */
export async function isTransactionActive(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the current transaction status
 * @param prisma - Prisma client instance
 * @returns Transaction status information
 */
export async function getTransactionStatus(prisma: PrismaClient): Promise<{
  isActive: boolean;
  isolationLevel?: string;
}> {
  try {
    const result = await prisma.$queryRaw<Array<{ current_setting: string }>>`
      SELECT current_setting('transaction_isolation')
    `;
    
    return {
      isActive: true,
      isolationLevel: result[0]?.current_setting
    };
  } catch (error) {
    return {
      isActive: false
    };
  }
}
