/**
 * @file globalTeardown.ts
 * @summary Global teardown for Jest tests with DynamoDB Local
 * @description This file cleans up DynamoDB Local after all Jest tests complete.
 * It stops the DynamoDB Local server and performs any necessary cleanup.
 */

import { stopDynamoDBLocal } from '../scripts/startDynamoDB';

/**
 * Global teardown function for Jest test environment
 * 
 * @description Executes once after all tests complete to clean up the test environment.
 * Stops DynamoDB Local server and performs any necessary resource cleanup.
 * Errors in teardown are logged but not thrown to avoid masking test failures.
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
    
    console.log('✅ Global test teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}
