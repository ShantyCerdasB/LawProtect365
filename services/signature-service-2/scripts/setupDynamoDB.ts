/**
 * @file setupDynamoDB.ts
 * @summary Complete setup script for DynamoDB Local with table creation
 * @description This script starts DynamoDB Local, waits for it to be ready,
 * and then creates all necessary tables for the signature service.
 */

import { startDynamoDBLocal, waitForDynamoDBLocal, stopDynamoDBLocal } from './startDynamoDB';
import { createTable, tableDefinitions } from './createLocalTables';

/**
 * @description Main setup function
 */
const main = async () => {
  console.log('🚀 Starting complete DynamoDB Local setup...');
  
  try {
    // Start DynamoDB Local
    console.log('📡 Starting DynamoDB Local server...');
    await startDynamoDBLocal();
    
    // Wait for it to be ready
    console.log('⏳ Waiting for DynamoDB Local to be ready...');
    await waitForDynamoDBLocal();
    
    // Create tables
    console.log('📝 Creating tables...');
    const { createDynamoDBClient } = await import('./createLocalTables');
    const client = createDynamoDBClient();
    
    // Create tables with test prefixes for this setup
    const testTableDefinitions = tableDefinitions.map(table => ({
      ...table,
      TableName: table.TableName.replace('local-', 'test-')
    }));
    
    for (const tableDefinition of testTableDefinitions) {
      await createTable(client, tableDefinition);
    }
    
    console.log('✅ DynamoDB Local setup completed successfully!');
    console.log('🎉 Ready for testing!');
    
    // Keep the process running so DynamoDB Local stays alive
    console.log('🔄 DynamoDB Local is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down DynamoDB Local...');
      await stopDynamoDBLocal();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await stopDynamoDBLocal();
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as setupDynamoDB };
