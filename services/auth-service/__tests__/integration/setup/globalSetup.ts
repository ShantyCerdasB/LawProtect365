/**
 * @fileoverview globalSetup - Global setup for integration tests
 * @summary Configures environment variables for integration tests
 * @description Sets up environment variables required for integration tests
 * without database setup to avoid Prisma schema issues.
 */

// Mock logger for setup
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`)
};

/**
 * Global setup for integration tests
 * 
 * This function runs before all integration tests to:
 * 1. Configure test environment variables
 * 2. Set up required environment variables for shared-ts
 */
export default async function globalSetup(): Promise<void> {
  try {
    logger.info('Starting global setup for integration tests');

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
    
    // Required environment variables for shared-ts
    process.env.PROJECT_NAME = 'lawprotect';
    process.env.SERVICE_NAME = 'auth-service';
    process.env.AWS_REGION = 'us-east-1';
    process.env.ENV = 'test';
    
    // Set DATABASE_URL for tests if not already set
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://livekitadmin:ADcc2023.@localhost:5432/postgres?schema=public';
    }

    logger.info('Environment variables configured successfully');
    logger.info('Global setup completed successfully');
  } catch (error) {
    logger.error(`Global setup failed: ${error}`);
    throw error;
  }
}
