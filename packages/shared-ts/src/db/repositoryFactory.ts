/**
 * @fileoverview RepositoryFactory - Factory for creating repository instances with shared Prisma client
 * @summary Centralized factory for repository creation and transaction management
 * @description This factory provides centralized creation of repository instances using a shared Prisma client,
 * transaction management utilities, and pagination helpers. It ensures consistent repository instantiation
 * across the application and provides utilities for complex operations requiring transactions.
 */

import { getPrisma, createPrisma, type PrismaFactoryOptions } from './prismaClient.js';
import { withTransaction, type TxOptions } from './prismaTx.js';
import { Page, pageFromRows, idCursorFromRow, getIdFromCursor } from './pagination.js';
import { encodeCursor, decodeCursor, cursorFromRecord, toJsonValue } from './cursor.js';
import { stableStringifyUnsafe } from '../utils/json.js';
import type { RepositoryBase } from './repositoryBase.js';
import type { CrudRepository, ListRepository, UnitOfWorkPrisma } from './ports.js';
import type { PrismaClient } from '@prisma/client';
import type { JsonValue } from '../types/common.js';

/**
 * Factory for creating repository instances with shared Prisma client
 * 
 * This factory provides centralized repository creation, transaction management,
 * and utility methods for pagination and cursor operations. It ensures consistent
 * repository instantiation across the application and provides utilities for
 * complex operations requiring transactions.
 */
export class RepositoryFactory {
  private static prisma = getPrisma();

  /**
   * Creates a repository instance with shared Prisma client
   * 
   * @param RepositoryClass - Repository class constructor that extends RepositoryBase
   * @returns Repository instance with shared Prisma client
   * @example
   * const envelopeRepo = RepositoryFactory.create(SignatureEnvelopeRepository);
   */
  static create<T extends RepositoryBase<any, any, any>>(
    RepositoryClass: new (prisma: PrismaClient) => T
  ): T {
    return new RepositoryClass(this.prisma);
  }

  /**
   * Creates a repository instance with isolated client (for tests)
   * 
   * @param RepositoryClass - Repository class constructor that extends RepositoryBase
   * @param options - Optional Prisma client configuration
   * @returns Repository instance with isolated Prisma client
   * @example
   * const envelopeRepo = RepositoryFactory.createIsolated(SignatureEnvelopeRepository, { url: 'test-db-url' });
   */
  static createIsolated<T extends RepositoryBase<any, any, any>>(
    RepositoryClass: new (prisma: PrismaClient) => T,
    options?: PrismaFactoryOptions
  ): T {
    const isolatedPrisma = createPrisma(options);
    return new RepositoryClass(isolatedPrisma);
  }

  /**
   * Executes operations within a transaction
   * 
   * @param fn - Function that receives a transactional Prisma client
   * @param options - Transaction configuration options
   * @returns Promise that resolves to the function result
   * @throws Error when transaction fails
   * @example
   * const result = await RepositoryFactory.withTransaction(async (tx) => {
   *   const envelope = await envelopeRepo.create(data, tx);
   *   const signers = await signerRepo.createMany(signersData, tx);
   *   return envelope;
   * });
   */
  static async withTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    options?: TxOptions
  ): Promise<T> {
    return withTransaction(this.prisma, fn, options);
  }

  /**
   * Creates a paginated result from rows with cursor-based pagination
   * 
   * @param rows - Array of rows fetched from storage (up to limit + 1)
   * @param limit - Page size requested
   * @param cursorBuilder - Function that builds a cursor from a row
   * @returns Page object with items and optional nextCursor
   * @example
   * const page = RepositoryFactory.createPage(rows, 10, (row) => cursorFromRecord(row, ['id']));
   */
  static createPage<T>(rows: T[], limit: number, cursorBuilder: (item: T) => string): Page<T> {
    return pageFromRows(rows, limit, cursorBuilder);
  }

  /**
   * Creates a cursor from a record using specified fields
   * 
   * @param record - Source record
   * @param fields - Field names to include in the cursor payload
   * @returns Encoded cursor string
   * @example
   * const cursor = RepositoryFactory.createCursor(envelope, ['id', 'createdAt']);
   */
  static createCursor<T extends object>(record: T, fields: Array<keyof T>): string {
    return cursorFromRecord(record, fields);
  }

  /**
   * Decodes a cursor string to extract payload
   * 
   * @param cursor - Encoded cursor string
   * @returns Decoded cursor payload or undefined if invalid
   * @example
   * const payload = RepositoryFactory.decodeCursor<{id: string}>(cursor);
   */
  static decodeCursor<T = unknown>(cursor?: string): T | undefined {
    return decodeCursor<T>(cursor);
  }

  /**
   * Encodes a JSON-serializable value into an opaque cursor string
   * 
   * @param value - JSON-serializable payload
   * @returns Encoded cursor string
   * @example
   * const cursor = RepositoryFactory.encodeCursor({ id: '123', createdAt: '2024-01-01' });
   */
  static encodeCursor(value: JsonValue): string {
    return encodeCursor(value);
  }

  /**
   * Converts an unknown value to JsonValue and encodes it as a cursor
   * 
   * @param value - Any value to convert and encode
   * @returns Encoded cursor string
   * @example
   * const cursor = RepositoryFactory.encodeUnknownValue({ id: '123', createdAt: new Date() });
   */
  static encodeUnknownValue(value: unknown): string {
    return encodeCursor(toJsonValue(value));
  }

  /**
   * Safely stringifies an unknown value for cursor encoding
   * 
   * @param value - Any value to stringify
   * @returns Stable JSON string
   * @example
   * const json = RepositoryFactory.safeStringify({ id: '123', createdAt: new Date() });
   */
  static safeStringify(value: unknown): string {
    return stableStringifyUnsafe(value);
  }

  /**
   * Creates a cursor from a row by reading the "id" field
   * 
   * @param row - Source row containing an "id" field
   * @returns Encoded cursor string
   * @example
   * const cursor = RepositoryFactory.createIdCursor(envelope);
   */
  static createIdCursor<T extends { id: string | number }>(row: T): string {
    return idCursorFromRow(row);
  }

  /**
   * Extracts the "id" from a cursor created by createIdCursor
   * 
   * @param cursor - Opaque cursor string
   * @returns ID value or undefined if cursor is invalid
   * @example
   * const id = RepositoryFactory.getIdFromCursor(cursor);
   */
  static getIdFromCursor(cursor?: string): string | number | undefined {
    return getIdFromCursor(cursor);
  }

  /**
   * Gets the shared Prisma client instance
   * 
   * @returns Shared Prisma client instance
   * @example
   * const prisma = RepositoryFactory.getPrismaClient();
   */
  static getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Creates a UnitOfWork implementation for transaction management
   * 
   * @returns UnitOfWorkPrisma implementation
   * @example
   * const uow = RepositoryFactory.createUnitOfWork();
   * await uow.withTransaction(async (tx) => { ... });
   */
  static createUnitOfWork(): UnitOfWorkPrisma<PrismaClient> {
    return {
      withTransaction: <T>(fn: (ctx: PrismaClient) => Promise<T>): Promise<T> => {
        return withTransaction(this.prisma, fn);
      }
    };
  }

  /**
   * Validates that a repository implements required interfaces
   * 
   * @param repository - Repository instance to validate
   * @returns True if repository implements required interfaces
   * @example
   * const isValid = RepositoryFactory.validateRepository(envelopeRepo);
   */
  static validateRepository<T, ID, Filter>(
    repository: any
  ): repository is CrudRepository<T, ID> & ListRepository<T, Filter> {
    return (
      typeof repository.findById === 'function' &&
      typeof repository.create === 'function' &&
      typeof repository.update === 'function' &&
      typeof repository.delete === 'function' &&
      typeof repository.list === 'function'
    );
  }
}
