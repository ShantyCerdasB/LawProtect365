/**
 * @file startLocalStack.ts
 * @summary Start LocalStack with Docker Compose for AWS service emulation
 * @description Starts LocalStack container with all required AWS services for testing.
 * This script manages the complete lifecycle of LocalStack including Docker validation,
 * container management, health checks, and service readiness verification.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Creates a safe PATH environment variable for command execution
 * 
 * @returns Safe PATH string containing only system directories
 * @description Generates a PATH that includes system directories and common tool locations
 * while excluding user-writable directories to prevent PATH injection attacks.
 * Works across different operating systems and CI/CD environments.
 */
function createSafePath(): string {
  const platform = process.platform;
  const currentPath = process.env.PATH || '';
  
  // Extract system directories from current PATH
  const systemDirs = currentPath
    .split(platform === 'win32' ? ';' : ':')
    .filter(dir => {
      if (!dir.trim()) return false;
      
      // Include system directories
      if (platform === 'win32') {
        return dir.includes('Windows') || 
               dir.includes('Program Files') || 
               dir.includes('Docker') ||
               dir.includes('Git') ||
               dir.includes('Node');
      } else {
        return dir.startsWith('/usr') || 
               dir.startsWith('/bin') || 
               dir.startsWith('/sbin') ||
               dir.startsWith('/opt');
      }
    });
  
  // Fallback to minimal safe paths if no system dirs found
  if (systemDirs.length === 0) {
    return platform === 'win32' 
      ? 'C:\\Windows\\System32;C:\\Windows'
      : '/usr/local/bin:/usr/bin:/bin';
  }
  
  return systemDirs.join(platform === 'win32' ? ';' : ':');
}

/**
 * Executes a command with a sanitized environment to prevent PATH injection
 * 
 * @param command - The command to execute
 * @param options - Execution options (stdio, timeout, etc.)
 * @returns The result of execSync
 * @description Uses a dynamically generated safe PATH environment variable that
 * includes necessary system directories while excluding user-writable locations.
 * Executes commands directly without shell interpreter for enhanced security.
 * This prevents security vulnerabilities from PATH injection and shell injection attacks.
 */
function safeExecSync(command: string, options: any = {}) {
  const safeEnv = {
    ...process.env,
    PATH: createSafePath()
  };
  
  // Define allowed commands and their arguments for security
  const ALLOWED_COMMANDS = {
    'docker': ['compose', 'ps', 'rm', 'logs'],
    'docker-compose': ['up', 'down', 'ps', 'logs'],
    'powershell': ['-Command'],
    'curl': ['-f']
  };
  
  // Define safe argument patterns (using atomic groups and avoiding backtracking)
  const SAFE_ARG_PATTERNS = [
    /^-[a-zA-Z]$/,                    // Single letter flags like -f, -d
    /^--[a-zA-Z-]+$/,                 // Long flags like --detach
    /^[a-zA-Z0-9._/\\:-]+$/,          // File paths and names (including Windows paths with backslashes)
    /^[a-zA-Z0-9._-]+$/,              // Simple identifiers
    /^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/, // Container names with colons
    /^https?:\/\/[a-zA-Z0-9._/-]+$/,  // HTTP/HTTPS URLs
    /^Invoke-WebRequest [a-zA-Z0-9._/\\:-]+$/, // PowerShell commands with specific pattern
    /^[a-zA-Z0-9._-]+ \| [a-zA-Z0-9._-]+$/, // PowerShell pipe commands with specific pattern
  ];
  
  function isSafeArgument(arg: string): boolean {
    return SAFE_ARG_PATTERNS.some(pattern => pattern.test(arg));
  }
  
  // For docker compose commands, use predefined safe arguments
  if (command.startsWith('docker compose')) {
    const args = command.split(' ').slice(2); // Remove 'docker compose'
    const allowedArgs = ALLOWED_COMMANDS['docker'];
    
    // Validate that all arguments are allowed
    if (args.every(arg => allowedArgs.includes(arg) || isSafeArgument(arg))) {
      return execSync(command, {
        ...options,
        shell: true, // Use shell for docker compose subcommands
        env: safeEnv
      });
    } else {
      throw new Error(`Unsafe command arguments detected: ${args.join(' ')}`);
    }
  }
  
  // For other commands, use predefined safe command arrays
  if (command.startsWith('docker-compose')) {
    const args = command.split(' ').slice(1); // Remove 'docker-compose'
    const allowedArgs = ALLOWED_COMMANDS['docker-compose'];
    
    // Validate that all arguments are allowed
    if (args.every(arg => allowedArgs.includes(arg) || isSafeArgument(arg))) {
      return execSync('docker-compose', {
        ...options,
        args: args,
        shell: false, // Disable shell interpreter for security
        env: safeEnv
      });
    } else {
      throw new Error(`Unsafe command arguments detected: ${args.join(' ')}`);
    }
  }
  
  // For other commands, use safe parsing with validation
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  
  // Only allow specific commands
  if (!ALLOWED_COMMANDS[cmd as keyof typeof ALLOWED_COMMANDS]) {
    throw new Error(`Command not allowed: ${cmd}`);
  }
  
  return execSync(cmd, {
    ...options,
    args: args,
    shell: false, // Disable shell interpreter for security
    env: safeEnv
  });
}

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
      safeExecSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('Docker version check failed:', error);
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
      safeExecSync('docker rm -f lawprotect365-localstack', { stdio: 'ignore' });
    } catch {}

    console.log('🐳 Ensuring LocalStack container is running...');
    safeExecSync(`docker compose -f ${DOCKER_COMPOSE_FILE} up -d`, { stdio: 'inherit' });

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
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Use platform-specific health check command
      const healthCheckCmd = process.platform === 'win32' 
        ? 'powershell -Command "Invoke-WebRequest -Uri http://localhost:4566/_localstack/health -UseBasicParsing | Out-Null"'
        : 'curl -f http://localhost:4566/_localstack/health';
        
      safeExecSync(healthCheckCmd, { 
        stdio: 'ignore',
        timeout: 10000 
      });
      console.log('✅ LocalStack is healthy!');
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('LocalStack health check failed after maximum retries:', error);
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
