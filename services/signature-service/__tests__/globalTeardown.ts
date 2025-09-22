/**
 * @fileoverview GlobalTeardown - Jest global teardown for test environment cleanup
 * @summary Cleans up test environment after all Jest tests complete
 * @description Performs cleanup operations after all Jest tests complete.
 * Stops DynamoDB Local server and performs necessary resource cleanup.
 */

import { stopDynamoDBLocal } from '../scripts/startDynamoDB';
import { cleanupS3MockStorage } from './integration/mocks/aws/s3Cleanup';

/**
 * Cleans up the test environment after all Jest tests complete
 * 
 * @description Executes once after all tests complete to perform cleanup operations.
 * Stops DynamoDB Local server and performs necessary resource cleanup.
 * Errors are logged but not thrown to avoid masking test failures.
 * 
 * @returns Promise<void> Resolves when cleanup is complete
 * @throws Never throws errors to avoid masking test failures
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🛑 Starting global test teardown...');
  
  try {
    // Stop DynamoDB Local
    console.log('🛑 Stopping DynamoDB Local...');
    await stopDynamoDBLocal();
    
    // Clean up S3 mock storage
    console.log('🧹 Cleaning up S3 mock storage...');
    await cleanupS3MockStorage();
    
    console.log('✅ Global test teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}
