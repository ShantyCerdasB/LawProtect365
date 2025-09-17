/**
 * @file globalTeardown.ts
 * @summary Global teardown for Jest tests with DynamoDB Local
 * @description This file cleans up DynamoDB Local after all Jest tests complete.
 * It stops the DynamoDB Local server and performs any necessary cleanup.
 */

import { stopDynamoDBLocal } from '../scripts/startDynamoDB';

/**
 * @description Global teardown function for Jest
 * This function runs once after all tests complete
 */
export default async function globalTeardown() {
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
