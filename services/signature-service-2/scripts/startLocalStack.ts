/**
 * @file startLocalStack.ts
 * @summary Start LocalStack with Docker Compose
 * @description Starts LocalStack container with all required AWS services for testing
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const DOCKER_COMPOSE_FILE = 'docker-compose.localstack.yml';
const LOCALSTACK_DATA_DIR = 'localstack-data';

async function startLocalStack() {
  console.log('🚀 Starting LocalStack...');
  
  try {
    // Check if Docker is running
    try {
      execSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Docker is not installed or not running. Please install Docker and try again.');
    }

    // Check if docker-compose file exists
    if (!existsSync(DOCKER_COMPOSE_FILE)) {
      throw new Error(`Docker compose file ${DOCKER_COMPOSE_FILE} not found`);
    }

    // Create localstack data directory if it doesn't exist
    if (!existsSync(LOCALSTACK_DATA_DIR)) {
      console.log(`📁 Creating ${LOCALSTACK_DATA_DIR} directory...`);
      const { mkdirSync } = require('fs');
      mkdirSync(LOCALSTACK_DATA_DIR, { recursive: true });
    }

    // Start LocalStack without forcing a restart if it's already running
    console.log('🐳 Ensuring LocalStack container is running...');
    execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, { stdio: 'inherit' });

    // Wait for LocalStack to be ready
    console.log('⏳ Waiting for LocalStack to be ready...');
    await waitForLocalStack();

    console.log('✅ LocalStack is ready!');
    console.log('📋 Available services:');
    console.log('   - S3: http://localhost:4566');
    console.log('   - KMS: http://localhost:4566');
    console.log('   - Cognito: http://localhost:4566');
    console.log('   - EventBridge: http://localhost:4566');
    console.log('   - SSM: http://localhost:4566');
    console.log('   - DynamoDB: Using DynamoDB Local on http://localhost:8000');

  } catch (error) {
    console.error('❌ Failed to start LocalStack:', error);
    process.exit(1);
  }
}

async function waitForLocalStack(maxRetries = 20, delay = 3000) {
  const { execSync } = require('child_process');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if LocalStack health endpoint is responding
      execSync('curl -f http://localhost:4566/_localstack/health', { 
        stdio: 'ignore',
        timeout: 10000 
      });
      console.log('✅ LocalStack is healthy!');
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error('LocalStack failed to start within the expected time');
      }
      console.log(`⏳ Waiting for LocalStack... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Run if called directly
if (require.main === module) {
  startLocalStack();
}

export { startLocalStack };
