/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in shared-ts package.
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * package-specific module name mappings for local aliases.
 */

const baseConfig = require('../../jest.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,

  /** Package root for glob resolution */
  roots: ['<rootDir>'],

  /**
   * Override base moduleNameMapper with package-specific aliases.
   * The shared-ts package has its own internal aliases that point to its own src.
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
};
