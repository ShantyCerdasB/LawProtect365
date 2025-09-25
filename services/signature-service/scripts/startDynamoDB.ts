/**
 * @file startDynamoDB.ts
 * @summary Script to start DynamoDB Local server for testing
 * @description This script provides utilities to start, stop, and manage DynamoDB Local
 * server with proper configuration for development and testing. It includes health checks,
 * connection validation, and graceful startup/shutdown procedures.
 */

import { createDynamoDBClient, listTables } from './createLocalTables';
import * as DynamoDBLocal from 'dynamodb-local';

/**
 * Configuration interface for DynamoDB Local server parameters
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
 * Default configuration optimized for testing and development
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
 * Tracks the current DynamoDB Local port for shutdown operations
 */
let dynamoDBPort: number = 8000;

/**
 * Starts DynamoDB Local server using the programmatic API
 * 
 * @description Launches DynamoDB Local with the specified configuration,
 * merging provided options with defaults. Waits for the server to be
 * fully initialized before resolving.
 * 
 * @param config - Partial configuration object to override defaults
 * @returns Promise<void> Resolves when server is ready and accessible
 * @throws Error if server startup fails
 */
export const startDynamoDBLocal = async (config: Partial<DynamoDBLocalConfig> = {}): Promise<void> => {
  const finalConfig = { ...defaultConfig, ...config };
  
  try {
    // Check if DynamoDB Local is already running
    const isRunning = await isDynamoDBLocalRunning();
    if (isRunning) {
      console.log('✅ DynamoDB Local is already running');
      return;
    }
    
    // Use the programmatic API to start DynamoDB Local
    const port = finalConfig.port;
    dynamoDBPort = port;
    
    
    // Start DynamoDB Local using the programmatic API
    await DynamoDBLocal.launch(port, null, [], false, true);
    
    
    // Wait a moment for the server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error: any) {
    // Check if the error is due to port already in use
    if (error.message && error.message.includes('Address already in use')) {
      console.log('✅ DynamoDB Local is already running on port', finalConfig.port);
      return;
    }
    console.error('❌ Failed to start DynamoDB Local:', error.message);
    throw error;
  }
};

/**
 * Stops the running DynamoDB Local server
 * 
 * @description Gracefully shuts down DynamoDB Local using the tracked port.
 * Handles cases where the server may not be running.
 * 
 * @returns Promise<void> Resolves when server is stopped
 * @throws Logs warnings if server was not running
 */
export const stopDynamoDBLocal = async (): Promise<void> => {
  try {
    
    // Use the programmatic API to stop DynamoDB Local
    DynamoDBLocal.stop(dynamoDBPort);
    
    
  } catch (error: any) {
  }
};

/**
 * Checks if DynamoDB Local is running and accessible
 * 
 * @description Attempts to connect to DynamoDB Local and list tables
 * to verify the server is responsive and ready for operations.
 * 
 * @returns Promise<boolean> True if server is accessible, false otherwise
 */
export const isDynamoDBLocalRunning = async (): Promise<boolean> => {
  try {
    const client = createDynamoDBClient();
    await listTables(client);
    return true;
  } catch (error) {
    // DynamoDB Local is not running or not accessible
    console.debug(`DynamoDB Local check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Waits for DynamoDB Local to be ready with retry logic
 * 
 * @description Polls DynamoDB Local connection status with configurable
 * retry attempts and delays. Useful for ensuring server is fully ready
 * before proceeding with operations.
 * 
 * @param maxRetries - Maximum number of connection attempts (default: 30)
 * @param retryDelay - Milliseconds to wait between attempts (default: 1000)
 * @returns Promise<void> Resolves when server is ready
 * @throws Error if server fails to become ready within timeout
 */
export const waitForDynamoDBLocal = async (
  maxRetries: number = 30,
  retryDelay: number = 1000
): Promise<void> => {
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isRunning = await isDynamoDBLocalRunning();
      if (isRunning) {
        return;
      }
    } catch (error) {
      // Log errors during startup for debugging but continue retrying
      console.debug(`DynamoDB Local startup check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error('DynamoDB Local failed to start within timeout period');
};

/**
 * Main execution function for starting DynamoDB Local
 * 
 * @description Orchestrates the complete startup process: checks if already
 * running, starts the server, waits for readiness, and exits gracefully.
 * 
 * @returns Promise<void> Exits process with code 0 on success, 1 on failure
 */
const main = async (): Promise<void> => {
  try {
    // Check if already running
    const isRunning = await isDynamoDBLocalRunning();
    if (isRunning) {
      process.exit(0);
    }
    
    // Start DynamoDB Local
    await startDynamoDBLocal();
    
    // Wait for it to be ready
    await waitForDynamoDBLocal();
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to start DynamoDB Local:', error);
    process.exit(1);
  }
};

/**
 * Executes the main function when this script is run directly from the command line
 */
if (require.main === module) {
  main().catch(console.error);
}

/**
 * Exports configuration types and defaults for use by other modules
 */
export { DynamoDBLocalConfig, defaultConfig };
