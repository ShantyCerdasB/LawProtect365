/**
 * @file globalTeardown.ts
 * @summary Global teardown for Jest tests with DynamoDB Local
 * @description This file cleans up DynamoDB Local after all Jest tests complete.
 * It stops the DynamoDB Local server and performs any necessary cleanup.
 */

// Intentionally do not stop DynamoDB Local to speed up subsequent runs

/**
 * @description Global teardown function for Jest
 * This function runs once after all tests complete
 */
export default async function globalTeardown() {
  console.log('🛑 Starting global test teardown...');
  
  try {
    console.log('ℹ️  Leaving DynamoDB Local running');
    console.log('✅ Global test teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}
