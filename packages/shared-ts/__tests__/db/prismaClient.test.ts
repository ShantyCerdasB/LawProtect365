/**
 * @file prismaClient.test.ts
 * @summary Tests for getPrisma, createPrisma, and normalizeLogLevels via construction (100% line & branch coverage).
 *
 * Notes:
 * - Mocks @prisma/client to avoid real DB connections and to capture constructor options.
 * - Mocks @utils/env.js to control DATABASE_URL, LOG_LEVEL, and DEBUG_SQL behavior.
 */

// Mock environment utilities with the same specifier used by the SUT
jest.mock('@utils/env.js', () => ({
  getEnv: jest.fn(),
  getNumber: jest.fn(),
}));

// Mock Prisma client constructor; capture options on the instance for assertions
const PrismaClientCtor = jest.fn().mockImplementation(function (this: any, opts: any) {
  this.__opts = opts;
  this.$disconnect = jest.fn();
});
jest.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientCtor,
  Prisma: {}, // runtime placeholder; types come from @prisma/client type defs
}));

import { getPrisma, createPrisma } from '../../src/db/index.js';

const envMod = jest.requireMock('@utils/env.js') as {
  getEnv: jest.Mock;
  getNumber: jest.Mock;
};
const prismaMod = jest.requireMock('@prisma/client') as {
  PrismaClient: jest.Mock;
};

const resetGlobalPrisma = () => {
  // Reset the singleton between tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__PRISMA__ = undefined;
};

beforeEach(() => {
  jest.clearAllMocks();
  resetGlobalPrisma();
  delete process.env.LOG_LEVEL;
});

describe('getPrisma (singleton)', () => {
  /**
   * Creates the singleton when absent, using env-derived URL and default log levels.
   */
  it('constructs a PrismaClient once and returns the cached instance', () => {
    envMod.getEnv.mockReturnValueOnce('postgres://db/default');
    envMod.getNumber.mockReturnValue(0); // DEBUG_SQL disabled
    process.env.LOG_LEVEL = undefined; // default -> "info"

    const first = getPrisma();
    const second = getPrisma();

    expect(first).toBe(second);
    expect(prismaMod.PrismaClient).toHaveBeenCalledTimes(1);

    const opts = (first as any).__opts;
    expect(opts.datasources.db.url).toBe('postgres://db/default');
    expect(opts.log).toEqual(['error', 'warn', 'info']); // default base
  });

  /**
   * Uses provided url/log overrides for the initial construction and ignores them on subsequent calls.
   */
  it('honors factory overrides on first call and ignores on subsequent calls', () => {
    envMod.getEnv.mockReturnValueOnce(undefined); // should not be used because opts.url is provided
    envMod.getNumber.mockReturnValue(0);

    const customLog = ['error'] as any;
    const first = getPrisma({ url: 'postgres://db/override', log: customLog });

    // Second call tries to pass different overrides but should be ignored
    const second = getPrisma({ url: 'postgres://db/ignored', log: ['debug'] as any });

    expect(first).toBe(second);
    expect(prismaMod.PrismaClient).toHaveBeenCalledTimes(1);

    const opts = (first as any).__opts;
    expect(opts.datasources.db.url).toBe('postgres://db/override');
    expect(opts.log).toBe(customLog);
  });

  /**
   * Throws when DATABASE_URL is missing and no override is provided.
   */
  it('throws when DATABASE_URL is not set and no url override is provided', () => {
    envMod.getEnv.mockReturnValueOnce(undefined); // DATABASE_URL
    expect(() => getPrisma()).toThrow('DATABASE_URL is not set');
    expect(prismaMod.PrismaClient).not.toHaveBeenCalled();
  });
});

describe('createPrisma (no caching)', () => {
  /**
   * Always constructs a new client, using an explicit url override (do not rely on env here).
   */
  it('creates a new client each call (no cache)', () => {
    envMod.getEnv.mockReturnValue(undefined); // ignored because we pass url override
    envMod.getNumber.mockReturnValue(0);
    delete process.env.LOG_LEVEL;

    const a = createPrisma({ url: 'postgres://db/create' });
    const b = createPrisma({ url: 'postgres://db/create' });

    expect(a).not.toBe(b);
    expect(prismaMod.PrismaClient).toHaveBeenCalledTimes(2);

    const optsA = (a as any).__opts;
    const optsB = (b as any).__opts;

    expect(optsA.datasources.db.url).toBe('postgres://db/create');
    expect(optsB.datasources.db.url).toBe('postgres://db/create');
    expect(optsA.log).toEqual(['error', 'warn', 'info']);
    expect(optsB.log).toEqual(['error', 'warn', 'info']);
  });

  /**
   * Honors explicit overrides for url and log.
   */
  it('accepts url and log overrides', () => {
    envMod.getEnv.mockReturnValue(undefined); // not used because opts.url is provided
    envMod.getNumber.mockReturnValue(0);

    const customLog = ['warn', 'error'] as any;
    const client = createPrisma({ url: 'postgres://db/custom', log: customLog });

    expect(prismaMod.PrismaClient).toHaveBeenCalledTimes(1);
    const opts = (client as any).__opts;
    expect(opts.datasources.db.url).toBe('postgres://db/custom');
    expect(opts.log).toBe(customLog);
  });

  /**
   * Throws when DATABASE_URL is missing and no override is provided.
   */
  it('throws when DATABASE_URL is not set and no url override is provided', () => {
    envMod.getEnv.mockReturnValue(undefined);
    expect(() => createPrisma()).toThrow('DATABASE_URL is not set');
    expect(prismaMod.PrismaClient).not.toHaveBeenCalled();
  });
});

describe('normalizeLogLevels behavior via createPrisma', () => {
  /**
   * Uses supported LOG_LEVEL (case-insensitive) and DEBUG_SQL=0.
   */
  it('uses supported LOG_LEVEL and no SQL debug events when DEBUG_SQL=0', () => {
    envMod.getEnv.mockReturnValue('postgres://db/logs');
    envMod.getNumber.mockReturnValue(0);
    process.env.LOG_LEVEL = 'WARN'; // supported, mixed case

    const client = createPrisma({ url: 'postgres://db/logs' });
    const log = (client as any).__opts.log as Array<string | { emit: string; level: string }>;

    expect(Array.isArray(log)).toBe(true);
    expect(log).toEqual(['error', 'warn', 'warn']); // base derived from LOG_LEVEL = "warn"
    expect(log.some((e) => typeof e === 'object')).toBe(false);
  });

  /**
   * Falls back to info when LOG_LEVEL is unsupported and adds SQL debug events when DEBUG_SQL=1.
   */
  it('falls back to info on unsupported LOG_LEVEL and adds SQL debug events when DEBUG_SQL=1', () => {
    envMod.getEnv.mockReturnValue('postgres://db/logs2');
    envMod.getNumber.mockReturnValue(1); // enable SQL debug events
    process.env.LOG_LEVEL = 'trace'; // unsupported -> base should fallback to ['error','warn','info']

    const client = createPrisma({ url: 'postgres://db/logs2' });
    const log = (client as any).__opts.log as Array<string | { emit: string; level: string }>;

    // Base contains the fallback levels
    expect(log).toEqual(expect.arrayContaining(['error', 'warn', 'info']));

    // Must include Prisma event-based definitions
    const hasQuery = log.some((e) => typeof e === 'object' && e.level === 'query' && e.emit === 'event');
    const hasError = log.some((e) => typeof e === 'object' && e.level === 'error' && e.emit === 'event');
    const hasWarn = log.some((e) => typeof e === 'object' && e.level === 'warn' && e.emit === 'event');

    expect(hasQuery).toBe(true);
    expect(hasError).toBe(true);
    expect(hasWarn).toBe(true);
  });
});
