/**
 * @file startLocalStack.ts
 * @summary Start LocalStack with Docker Compose for AWS service emulation
 * @description Starts LocalStack container with all required AWS services for testing.
 * This script manages the complete lifecycle of LocalStack including Docker validation,
 * container management, health checks, and service readiness verification.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Path to the Docker Compose file for LocalStack configuration
 */
const DOCKER_COMPOSE_FILE = resolve(__dirname, '..', '..', '..', 'docker-compose.localstack.yml');

/**
 * Directory name for LocalStack persistent data storage
 */
const LOCALSTACK_DATA_DIR = 'localstack-data';

/**
 * Starts LocalStack container with comprehensive setup and validation
 * 
 * @description Orchestrates the complete LocalStack startup process including
 * Docker validation, container management, data directory creation, and health
 * verification. The function is idempotent and can be run multiple times safely.
 * 
 * @returns Promise<void> Resolves when LocalStack is ready and healthy
 * @throws Exits process with code 1 if startup fails
 */
async function startLocalStack(): Promise<void> {
  console.log('🚀 Starting LocalStack...');
  
  try {
    try {
      execSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Docker is not installed or not running. Please install Docker and try again.');
    }

    if (!existsSync(DOCKER_COMPOSE_FILE)) {
      throw new Error(`Docker compose file ${DOCKER_COMPOSE_FILE} not found`);
    }

    if (!existsSync(LOCALSTACK_DATA_DIR)) {
      console.log(`📁 Creating ${LOCALSTACK_DATA_DIR} directory...`);
      const { mkdirSync } = require('fs');
      mkdirSync(LOCALSTACK_DATA_DIR, { recursive: true });
    }

    try {
      console.log('🧹 Ensuring no existing LocalStack container...');
      execSync('docker rm -f lawprotect365-localstack', { stdio: 'ignore' });
    } catch {}

    console.log('🐳 Ensuring LocalStack container is running...');
    execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, { stdio: 'inherit' });

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

/**
 * Waits for LocalStack to become healthy and ready for operations
 * 
 * @description Polls LocalStack's health endpoint with configurable retry logic
 * to ensure all AWS services are properly initialized and accessible.
 * 
 * @param maxRetries - Maximum number of health check attempts (default: 20)
 * @param delay - Milliseconds to wait between attempts (default: 3000)
 * @returns Promise<void> Resolves when LocalStack is healthy
 * @throws Error if LocalStack fails to become healthy within timeout
 */
async function waitForLocalStack(maxRetries = 20, delay = 3000): Promise<void> {
  const { execSync } = require('child_process');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
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

/**
 * Executes the start function when this script is run directly from the command line
 */
if (require.main === module) {
  startLocalStack();
}

/**
 * Exports the main start function for use by other modules
 */
export { startLocalStack };
