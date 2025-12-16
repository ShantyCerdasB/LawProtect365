/**
 * @file jest.config.cjs
 * @summary Jest setup for TypeScript unit tests in web application
 * @description
 * Extends the base Jest configuration from the monorepo root and adds
 * web-specific module name mappings for React components and aliases.
 */

const baseConfig = require('../../jest.base.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,

  /** Package root for glob resolution */
  roots: ['<rootDir>'],

  /** Test environment - use jsdom for React components */
  testEnvironment: 'jsdom',

  /** Extensions to treat as ESM */
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  /**
   * Override transform to use tsconfig.jest.json
   */
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        useESM: true,
      },
    ],
  },

  /**
   * Override base moduleNameMapper with web-specific aliases.
   * Maps @app and @ui-kit aliases used in the web application.
   */
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-dom/client$': '<rootDir>/node_modules/react-dom/client',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime',
    '^react/jsx-dev-runtime$': '<rootDir>/node_modules/react/jsx-dev-runtime',

    // strip .js on relative imports (./foo.js -> ./foo) - MUST come first
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // Web app internal aliases - must come before baseConfig mappings
    '^@app/(.*)\\.js$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/$1',

    '^@ui-kit/(.*)\\.js$': '<rootDir>/src/ui-kit/$1',
    '^@ui-kit/(.*)$': '<rootDir>/src/ui-kit/$1',

    // Test helpers alias
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',

    // App aliases with @/ prefix
    '^@/app/(.*)\\.js$': '<rootDir>/src/app/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',

    // Modules aliases with @/ prefix
    '^@/modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',

    // UI Kit aliases with @/ prefix (must come after modules)
    '^@/ui-kit/(.*)\\.js$': '<rootDir>/src/ui-kit/$1',
    '^@/ui-kit/(.*)$': '<rootDir>/src/ui-kit/$1',

    // frontend-core package aliases
    '^@lawprotect/frontend-core$': '<rootDir>/../../packages/frontend-core/src/index.ts',
    '^@lawprotect/frontend-core/(.*)$': '<rootDir>/../../packages/frontend-core/src/$1',

    // Mock static assets (images, CSS, etc.)
    '\\.(jpg|jpeg|png|gif|svg|css)$': '<rootDir>/__mocks__/fileMock.js',
  },

  /** Test file globs - include both .ts and .tsx for React components */
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],

  /** Module file extensions */
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  /** Setup files for test environment */
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  /** Coverage settings specific to web app */
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/routes.tsx',
    '!<rootDir>/src/**/enums/**/*.ts',
    '!<rootDir>/src/main.tsx',
    '!<rootDir>/src/**/*.stories.{ts,tsx}',
  ],

  /** Transform ignore patterns */
  transformIgnorePatterns: [
    'node_modules/(?!(@lawprotect/frontend-core|@tanstack/react-query)/)',
  ],

  /** Coverage thresholds - 95% minimum for all metrics */
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};

