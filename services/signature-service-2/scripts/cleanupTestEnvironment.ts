/**
 * @file cleanupTestEnvironment.ts
 * @summary Cleanup test environment (LocalStack and DynamoDB Local)
 * @description Stops and cleans up LocalStack and DynamoDB Local containers
 */

import { execSync } from 'child_process';

async function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Stop DynamoDB Local
    console.log('🛑 Stopping DynamoDB Local...');
    try {
      execSync('taskkill /F /IM java.exe /FI "WINDOWTITLE eq DynamoDB Local*" 2>nul || pkill -f dynamodb-local || true', { stdio: 'inherit' });
      console.log('✅ DynamoDB Local stopped');
    } catch (error) {
      console.log('⚠️ DynamoDB Local was not running or already stopped');
    }
    
    // Stop LocalStack
    console.log('🛑 Stopping LocalStack...');
    try {
      execSync('docker-compose -f docker-compose.localstack.yml down', { stdio: 'inherit' });
      console.log('✅ LocalStack stopped');
    } catch (error) {
      console.log('⚠️ LocalStack was not running or already stopped');
    }
    
    console.log('✅ Test environment cleanup completed!');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupTestEnvironment();
}

export { cleanupTestEnvironment };
