/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in signature-service.
 * @details
 * - Transforms .ts/.tsx via ts-jest.
 * - Collects coverage for all source files.
 * - Resolves TS path aliases and `.js`-suffixed imports (ESM-friendly in TS).
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!@lawprotect/shared-ts)"
  ],

  /** Package root so relative globs resolve as expected. */
  roots: ["<rootDir>"],

  /** Transform TS for tests and files included only by coverage. */
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }] },

  /** Include every .ts under src for coverage, even if not imported by tests. */
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/src/**/*.d.ts"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/"],

  /**
   * Path aliases and ESM-style `.js` imports inside TS.
   * Order matters: place the `.js` variants BEFORE the base aliases.
   */
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",

    "^@lawprotect/shared-ts$": "<rootDir>/../../packages/shared-ts/src/index.ts",
    "^@lawprotect/shared-ts/(.*)$": "<rootDir>/../../packages/shared-ts/src/$1",

    // Shared-ts internal path mappings (with .js variants first)
    "^@http/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/http/$1",
    "^@http/(.*)$": "<rootDir>/../../packages/shared-ts/src/http/$1",
    "^@auth/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/auth/$1",
    "^@auth/(.*)$": "<rootDir>/../../packages/shared-ts/src/auth/$1",
    "^@app/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/app/$1",
    "^@app/(.*)$": "<rootDir>/../../packages/shared-ts/src/app/$1",
    "^@aws/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/aws/$1",
    "^@aws/(.*)$": "<rootDir>/../../packages/shared-ts/src/aws/$1",
    "^@config/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/config/$1",
    "^@config/(.*)$": "<rootDir>/../../packages/shared-ts/src/config/$1",
    "^@db/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/db/$1",
    "^@db/(.*)$": "<rootDir>/../../packages/shared-ts/src/db/$1",
    "^@errors/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/errors/$1",
    "^@errors/(.*)$": "<rootDir>/../../packages/shared-ts/src/errors/$1",
    "^@observability/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/observability/$1",
    "^@observability/(.*)$": "<rootDir>/../../packages/shared-ts/src/observability/$1",
    "^@utils/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/utils/$1",
    "^@utils/(.*)$": "<rootDir>/../../packages/shared-ts/src/utils/$1",
    "^@validation/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/validation/$1",
    "^@validation/(.*)$": "<rootDir>/../../packages/shared-ts/src/validation/$1",
    "^@types/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/types/$1",
    "^@types/(.*)$": "<rootDir>/../../packages/shared-ts/src/types/$1",
    "^@cache/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/cache/$1",
    "^@cache/(.*)$": "<rootDir>/../../packages/shared-ts/src/cache/$1",
    "^@contracts/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/contracts/$1",
    "^@contracts/(.*)$": "<rootDir>/../../packages/shared-ts/src/contracts/$1",
    "^@events/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/events/$1",
    "^@events/(.*)$": "<rootDir>/../../packages/shared-ts/src/events/$1",
    "^@messaging/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/messaging/$1",
    "^@messaging/(.*)$": "<rootDir>/../../packages/shared-ts/src/messaging/$1",
    "^@storage/(.*)\\.js$": "<rootDir>/../../packages/shared-ts/src/storage/$1",
    "^@storage/(.*)$": "<rootDir>/../../packages/shared-ts/src/storage/$1",

    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",

    "^@adapters/(.*)\\.js$": "<rootDir>/src/adapters/$1",
    "^@adapters/(.*)$": "<rootDir>/src/adapters/$1",

    "^@controllers/(.*)\\.js$": "<rootDir>/src/controllers/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",

    "^@domain/(.*)\\.js$": "<rootDir>/src/domain/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",

    "^@guard/(.*)\\.js$": "<rootDir>/src/guard/$1",
    "^@guard/(.*)$": "<rootDir>/src/guard/$1",

    "^@infra/(.*)\\.js$": "<rootDir>/src/infra/$1",
    "^@infra/(.*)$": "<rootDir>/src/infra/$1",

    "^@mappers/(.*)\\.js$": "<rootDir>/src/mappers/$1",
    "^@mappers/(.*)$": "<rootDir>/src/mappers/$1",

    "^@middleware/(.*)\\.js$": "<rootDir>/src/middleware/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",

    "^@ports/(.*)\\.js$": "<rootDir>/src/ports/$1",
    "^@ports/(.*)$": "<rootDir>/src/ports/$1",

    "^@schemas/(.*)\\.js$": "<rootDir>/src/schemas/$1",
    "^@schemas/(.*)$": "<rootDir>/src/schemas/$1",

    "^@use-cases/(.*)\\.js$": "<rootDir>/src/use-cases/$1",
    "^@use-cases/(.*)$": "<rootDir>/src/use-cases/$1",
  },

  /** Test file globs. */
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],

  /** Useful defaults for Node services. */
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};
