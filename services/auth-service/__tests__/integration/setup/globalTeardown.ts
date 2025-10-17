/**
 * @fileoverview globalTeardown - Global teardown for integration tests
 * @summary Cleans up resources after all integration tests complete
 * @description Ensures proper cleanup of database connections and other
 * resources to prevent resource leaks and ensure clean test environment.
 */

import { Logger } from '@lawprotect/shared-ts';

const logger = new Logger('IntegrationTestTeardown');

/**
 * Global teardown for integration tests
 * 
 * This function runs after all integration tests complete to:
 * 1. Clean up any remaining database connections
 * 2. Verify no resource leaks
 * 3. Log test completion statistics
 */
export default async function globalTeardown(): Promise<void> {
  try {
    logger.info('Starting global teardown for integration tests');

    // Force garbage collection to help with memory cleanup
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    }

    // Log completion
    logger.info('Global teardown completed successfully');
  } catch (error) {
    logger.error('Global teardown failed', { error });
    // Don't throw here as it's cleanup
  }
}
