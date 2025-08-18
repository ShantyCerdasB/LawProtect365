import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Transaction options wrapping Prisma's interactive transactions.
 */
export interface TxOptions {
  /** Maximum wait time for acquiring a transaction in ms. */
  maxWaitMs?: number;
  /** Transaction timeout in ms. */
  timeoutMs?: number;
  /** Optional isolation level override. */
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Runs a function within a Prisma transaction using $transaction interactive API.
 * Propagates the result or throws on error. The Prisma client must be provided.
 *
 * @param prisma Prisma client instance.
 * @param fn Function that receives a transactional Prisma client.
 * @param opts Transaction options (timeouts, isolation).
 */
export const withTransaction = async <T>(
  prisma: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>,
  opts: TxOptions = {}
): Promise<T> => {
  return prisma.$transaction(
    async (tx) => fn(tx as unknown as PrismaClient),
    {
      maxWait: opts.maxWaitMs ?? 5000,
      timeout: opts.timeoutMs ?? 15000,
      isolationLevel: opts.isolationLevel
    }
  );
};
