/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in this package.
 * @details
 * - Transforms .ts/.tsx via ts-jest.
 * - Collects coverage for all source files.
 * - Resolves TS path aliases and `.js`-suffixed imports (ESM-friendly in TS).
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  /** Package root so relative globs resolve as expected. */
  roots: ['<rootDir>'],

  /** Transform TS for tests and files included only by coverage. */
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] },

  /** Include every .ts under src for coverage, even if not imported by tests. */
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/**/*.d.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/'],

  /**
   * Path aliases and ESM-style `.js` imports inside TS.
   * Order matters: place the `.js` variants BEFORE the base aliases.
   */
  moduleNameMapper: {
    // strip .js on relative imports (./foo.js -> ./foo)
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // base namespace
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',

    '^@auth/(.*)\\.js$': '<rootDir>/src/auth/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',

    '^@aws/(.*)\\.js$': '<rootDir>/src/aws/$1',
    '^@aws/(.*)$': '<rootDir>/src/aws/$1',

    '^@config/(.*)\\.js$': '<rootDir>/src/config/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',

    '^@db/(.*)\\.js$': '<rootDir>/src/db/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',

    '^@errors/(.*)\\.js$': '<rootDir>/src/errors/$1',
    '^@errors/(.*)$': '<rootDir>/src/errors/$1',

    '^@http/(.*)\\.js$': '<rootDir>/src/http/$1',
    '^@http/(.*)$': '<rootDir>/src/http/$1',

    '^@observability/(.*)\\.js$': '<rootDir>/src/observability/$1',
    '^@observability/(.*)$': '<rootDir>/src/observability/$1',

    '^@utils/(.*)\\.js$': '<rootDir>/src/utils/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',

    '^@validation/(.*)\\.js$': '<rootDir>/src/validation/$1',
    '^@validation/(.*)$': '<rootDir>/src/validation/$1',

    '^@types/(.*)\\.js$': '<rootDir>/src/types/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',

    '^@app/(.*)\\.js$': '<rootDir>/src/app/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',

    '^@cache/(.*)\\.js$': '<rootDir>/src/cache/$1',
    '^@cache/(.*)$': '<rootDir>/src/cache/$1',

    '^@contracts/(.*)\\.js$': '<rootDir>/src/contracts/$1',
    '^@contracts/(.*)$': '<rootDir>/src/contracts/$1',

    '^@events/(.*)\\.js$': '<rootDir>/src/events/$1',
    '^@events/(.*)$': '<rootDir>/src/events/$1',

    '^@messaging/(.*)\\.js$': '<rootDir>/src/messaging/$1',
    '^@messaging/(.*)$': '<rootDir>/src/messaging/$1',

    '^@storage/(.*)\\.js$': '<rootDir>/src/storage/$1',
    '^@storage/(.*)$': '<rootDir>/src/storage/$1',
  },

  /** Test file globs. */
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],

  /** Useful defaults for Node services. */
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
