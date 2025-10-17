// Set environment variables FIRST - before any imports
process.env.PROJECT_NAME = 'lawprotect';
process.env.SERVICE_NAME = 'auth-service';
process.env.AWS_REGION = 'us-east-1';
process.env.ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_ISSUER = 'https://test.lawprotect.com';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb?schema=public';

const baseConfig = require('../../jest.base.cjs');

module.exports = {
  ...baseConfig,
  
  roots: ["<rootDir>"],
  
  testMatch: [
    "<rootDir>/__tests__/integration/**/*.test.ts",
    "<rootDir>/__tests__/integration/**/*.int.test.ts"
  ],

  setupFiles: ["<rootDir>/__tests__/setup.ts", "<rootDir>/__tests__/integration/mocks/index.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  
  testTimeout: 30000,
  maxWorkers: '50%',
  forceExit: true,
  detectOpenHandles: true,
  
  testPathIgnorePatterns: ["<rootDir>/__tests__/integration/disabled/"],

  moduleNameMapper: {
    // Override base config moduleNameMapper to handle AWS SDK mocks properly
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
    
    // AWS SDK mocks for integration tests - MUST come before generic @aws/ mapping
    '^@aws/lambda-invoke-store$': '<rootDir>/__tests__/integration/mocks/@aws/lambda-invoke-store.ts',
    '^@aws/lambda-invoke-store/(.*)$': '<rootDir>/__tests__/integration/mocks/@aws/lambda-invoke-store.ts',
    
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
};
