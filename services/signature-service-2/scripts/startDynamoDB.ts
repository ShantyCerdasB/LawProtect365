/**
 * @file startDynamoDB.ts
 * @summary Script to start DynamoDB Local server
 * @description This script starts DynamoDB Local server with proper configuration
 * for development and testing. It includes health checks and table initialization.
 */

import { createDynamoDBClient, listTables } from './createLocalTables';
import * as DynamoDBLocal from 'dynamodb-local';

/**
 * @description Configuration for DynamoDB Local server
 */
interface DynamoDBLocalConfig {
  port: number;
  inMemory: boolean;
  sharedDb: boolean;
  cors: string;
  delayTransientStatuses: boolean;
  optimizeDbBeforeStartup: boolean;
}

/**
 * @description Default configuration for DynamoDB Local
 */
const defaultConfig: DynamoDBLocalConfig = {
  port: 8000,
  inMemory: true,
  sharedDb: true,
  cors: '*',
  delayTransientStatuses: true,
  optimizeDbBeforeStartup: true
};

/**
 * @description DynamoDB Local port
 */
let dynamoDBPort: number = 8000;

/**
 * @description Starts DynamoDB Local server using the programmatic API
 * @param config - Configuration for DynamoDB Local
 * @returns Promise that resolves when server is ready
 */
export const startDynamoDBLocal = async (config: Partial<DynamoDBLocalConfig> = {}): Promise<void> => {
  const finalConfig = { ...defaultConfig, ...config };
  
  console.log('🚀 Starting DynamoDB Local...');
  console.log('📋 Configuration:', finalConfig);
  
  try {
    // Use the programmatic API to start DynamoDB Local
    const port = finalConfig.port;
    dynamoDBPort = port;
    
    console.log(`🔧 Starting DynamoDB Local on port ${port}...`);
    
    // Start DynamoDB Local using the programmatic API
    await DynamoDBLocal.launch(port, null, [], false, true);
    
    console.log('✅ DynamoDB Local started successfully!');
    
    // Wait a moment for the server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error: any) {
    console.error('❌ Failed to start DynamoDB Local:', error.message);
    throw error;
  }
};

/**
 * @description Stops DynamoDB Local server
 * @returns Promise that resolves when server is stopped
 */
export const stopDynamoDBLocal = async (): Promise<void> => {
  try {
    console.log('🛑 Stopping DynamoDB Local...');
    
    // Use the programmatic API to stop DynamoDB Local
    DynamoDBLocal.stop(dynamoDBPort);
    
    console.log('✅ DynamoDB Local stopped successfully!');
    
  } catch (error: any) {
    console.log('⚠️  DynamoDB Local was not running or already stopped');
  }
};

/**
 * @description Checks if DynamoDB Local is running and accessible
 * @returns Promise that resolves to true if accessible, false otherwise
 */
export const isDynamoDBLocalRunning = async (): Promise<boolean> => {
  try {
    const client = createDynamoDBClient();
    await listTables(client);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * @description Waits for DynamoDB Local to be ready
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Delay between retries in milliseconds
 * @returns Promise that resolves when ready
 */
export const waitForDynamoDBLocal = async (
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<void> => {
  console.log('⏳ Waiting for DynamoDB Local to be ready...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isRunning = await isDynamoDBLocalRunning();
      if (isRunning) {
        console.log('✅ DynamoDB Local is ready!');
        return;
      }
    } catch (error) {
      // Ignore errors during startup
    }
    
    console.log(`⏳ Attempt ${i + 1}/${maxRetries} - waiting ${retryDelay}ms...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error('DynamoDB Local failed to start within timeout period');
};

/**
 * @description Main function to start DynamoDB Local with table creation
 */
const main = async () => {
  try {
    // Check if already running
    const isRunning = await isDynamoDBLocalRunning();
    if (isRunning) {
      console.log('✅ DynamoDB Local is already running');
      process.exit(0);
    }
    
    // Start DynamoDB Local
    await startDynamoDBLocal();
    
    // Wait for it to be ready
    await waitForDynamoDBLocal();
    
    console.log('🎉 DynamoDB Local is ready for use!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to start DynamoDB Local:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { DynamoDBLocalConfig, defaultConfig };
