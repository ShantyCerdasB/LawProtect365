/**
 * @file setupTestEnvironment.ts
 * @summary Setup complete test environment with LocalStack and DynamoDB Local
 * @description Sets up both LocalStack and DynamoDB Local for integration tests
 */

import { execSync } from 'child_process';
import { startLocalStack } from './startLocalStack';
import { setupLocalStack } from './setupLocalStack';
import { startDynamoDB } from './startDynamoDB';
import { createLocalTables } from './createLocalTables';

async function setupTestEnvironment() {
  console.log('🚀 Setting up complete test environment...');
  
  try {
    // 1. Start LocalStack
    console.log('📦 Starting LocalStack...');
    await startLocalStack();
    
    // 2. Setup LocalStack resources (KMS, S3, EventBridge, SSM)
    console.log('🔧 Setting up LocalStack resources...');
    await setupLocalStack();
    
    // 3. Start DynamoDB Local
    console.log('🗄️ Starting DynamoDB Local...');
    await startDynamoDB();
    
    // 4. Create DynamoDB tables
    console.log('📋 Creating DynamoDB tables...');
    await createLocalTables();
    
    console.log('✅ Test environment setup completed successfully!');
    console.log('📋 Available services:');
    console.log('   - DynamoDB Local: http://localhost:8000');
    console.log('   - LocalStack: http://localhost:4566');
    console.log('   - KMS: http://localhost:4566');
    console.log('   - S3: http://localhost:4566');
    console.log('   - EventBridge: http://localhost:4566');
    console.log('   - SSM: http://localhost:4566');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupTestEnvironment();
}

export { setupTestEnvironment };
