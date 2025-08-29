/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript units and coverage in signature-service.
 *
 * Claves:
 * - ts-jest usa tsconfig.jest.json (que mapea aliases).
 * - moduleNameMapper mapea aliases para el *runtime* de Jest.
 * - extensionsToTreatAsEsm + useESM true: coherencia con NodeNext/ESM en TS.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Trata .ts como ESM cuando corresponda (coherente con "module": NodeNext/ESNext).
  extensionsToTreatAsEsm: [".ts"],

  // Transforma TypeScript usando el tsconfig especial para tests.
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        useESM: true, // importante si tu TS usa NodeNext/ESNext
      },
    ],
  },

  // Permite transformar código de @lawprotect/shared-ts si entra por node_modules
  transformIgnorePatterns: ["node_modules/(?!@lawprotect/shared-ts)"],

  /** Package root para que los globs funcionen. */
  roots: ["<rootDir>"],

  /** Coverage de todo src (salvo .d.ts) */
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/src/**/*.d.ts"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/"],

  /**
   * Mapear aliases para el *runtime* de Jest.
   * IMPORTANTE: los mapeos con \.js van *antes* de los genéricos.
   * También mapeamos el paquete compartido a su "src" para compilarlo en tests.
   */
  moduleNameMapper: {
    // Permite que imports relativos con sufijo .js apunten al .ts
    "^(\\.{1,2}/.*)\\.js$": "$1",

    // Paquete compartido
    "^@lawprotect/shared-ts$": "<rootDir>/../../packages/shared-ts/src/index.ts",
    "^@lawprotect/shared-ts/(.*)$": "<rootDir>/../../packages/shared-ts/src/$1",

    // Aliases internos del paquete compartido (con variantes .js primero)
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

    // Aliases locales del servicio
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

  /** Globs de tests */
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],

  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};
