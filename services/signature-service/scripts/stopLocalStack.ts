/**
 * @file stopLocalStack.ts
 * @summary Stop LocalStack container
 * @description Stops and removes LocalStack container
 */

import { execSync } from 'child_process';

const DOCKER_COMPOSE_FILE = 'docker-compose.localstack.yml';

async function stopLocalStack() {
  console.log('🛑 Stopping LocalStack...');
  
  try {
    // Stop and remove LocalStack container
    execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} down`, { stdio: 'inherit' });
    
    console.log('✅ LocalStack stopped successfully');
  } catch (error) {
    console.error('❌ Failed to stop LocalStack:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  stopLocalStack();
}

export { stopLocalStack };
