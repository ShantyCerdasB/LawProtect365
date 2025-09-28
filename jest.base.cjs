/**
 * @file jest.base.cjs
 * @summary Base Jest configuration for all microservices in the monorepo
 * @description
 * This file contains the common Jest configuration that can be extended by individual services.
 * It includes TypeScript transformation setup, shared module name mappings for @lawprotect/shared-ts,
 * common coverage settings, and standard test environment configuration.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        useESM: true,
      },
    ],
  },

  transformIgnorePatterns: ["node_modules/(?!@lawprotect/shared-ts)"],

  /** Coverage for all src files (excluding .d.ts, index files, and enums) */
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts", 
    "!<rootDir>/src/**/*.d.ts",
    "!<rootDir>/src/**/index.ts",
    "!<rootDir>/src/**/enums/**/*.ts"
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/"],

  /**
   * Map aliases for Jest runtime.
   * IMPORTANT: mappings with \.js must come BEFORE generic ones.
   * Also map the shared package to its "src" for compilation in tests.
   */
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",

    // Service-specific aliases (for @/ imports within the service) - MUST come first
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1",

    // Shared-ts internal aliases (for @/ imports within shared-ts package) - MUST come first
    "^@/index\\.js$": "<rootDir>/../../packages/shared-ts/src/index.ts",
    "^@/validation/z\\.js$": "<rootDir>/../../packages/shared-ts/src/validation/z.ts",
    
    // Shared-ts package aliases
    "^@lawprotect/shared-ts$": "<rootDir>/../../packages/shared-ts/src/index.ts",
    "^@lawprotect/shared-ts/(.*)$": "<rootDir>/../../packages/shared-ts/src/$1",
    
    // Specific module aliases (with .js extension first, then generic)
    "^@auth/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/auth/$1.ts",
    "^@auth/(.*)$": "<rootDir>/../../packages/shared-ts/src/auth/$1",
    "^@aws/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/aws/$1.ts",
    "^@aws/(.*)$": "<rootDir>/../../packages/shared-ts/src/aws/$1",
    "^@cache/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/cache/$1.ts",
    "^@cache/(.*)$": "<rootDir>/../../packages/shared-ts/src/cache/$1",
    "^@config/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/config/$1.ts",
    "^@config/(.*)$": "<rootDir>/../../packages/shared-ts/src/config/$1",
    "^@contracts/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/contracts/$1.ts",
    "^@contracts/(.*)$": "<rootDir>/../../packages/shared-ts/src/contracts/$1",
    "^@db/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/db/$1.ts",
    "^@db/(.*)$": "<rootDir>/../../packages/shared-ts/src/db/$1",
    "^@errors/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/errors/$1.ts",
    "^@errors/(.*)$": "<rootDir>/../../packages/shared-ts/src/errors/$1",
    "^@events/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/events/$1.ts",
    "^@events/(.*)$": "<rootDir>/../../packages/shared-ts/src/events/$1",
    "^@http/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/http/$1.ts",
    "^@http/(.*)$": "<rootDir>/../../packages/shared-ts/src/http/$1",
    "^@messaging/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/messaging/$1.ts",
    "^@messaging/(.*)$": "<rootDir>/../../packages/shared-ts/src/messaging/$1",
    "^@observability/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/observability/$1.ts",
    "^@observability/(.*)$": "<rootDir>/../../packages/shared-ts/src/observability/$1",
    "^@storage/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/storage/$1.ts",
    "^@storage/(.*)$": "<rootDir>/../../packages/shared-ts/src/storage/$1",
    "^@types/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/types/$1.ts",
    "^@types/(.*)$": "<rootDir>/../../packages/shared-ts/src/types/$1",
    "^@utils/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/utils/$1.ts",
    "^@utils/(.*)$": "<rootDir>/../../packages/shared-ts/src/utils/$1",
    "^@validation/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/validation/$1.ts",
    "^@validation/(.*)$": "<rootDir>/../../packages/shared-ts/src/validation/$1",
    "^@app/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/app/$1.ts",
    "^@app/(.*)$": "<rootDir>/../../packages/shared-ts/src/app/$1",
  },

  /** Test file globs */
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],

  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};