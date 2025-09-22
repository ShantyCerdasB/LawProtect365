/**
 * @file setupLocalDatabase.ts
 * @summary Script to setup database for integration testing
 * @description This script sets up the database for integration testing.
 * It uses the real PostgreSQL database configured in DATABASE_URL.
 */

import { spawn } from 'child_process';
import { join } from 'path';

/**
 * Runs Prisma migrations on the database
 * 
 * @description Executes Prisma migrations to ensure the database schema
 * is up-to-date for testing. Uses the DATABASE_URL from environment.
 * 
 * @returns Promise<void> Resolves when migrations complete
 * @throws Error if migrations fail
 */
export const runMigrations = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running Prisma migrations...');
    
    // Use process.cwd() to get the project root, then navigate to shared-ts
    const projectRoot = process.cwd();
    const sharedTsPath = join(projectRoot, 'packages', 'shared-ts');
    const prismaPath = join(sharedTsPath, 'node_modules', '.bin', 'prisma');
    
    const child = spawn(prismaPath, ['migrate', 'deploy'], {
      cwd: sharedTsPath,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma migrations completed');
        resolve();
      } else {
        console.error('❌ Failed to run Prisma migrations');
        reject(new Error(`Prisma migrations failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ Failed to run Prisma migrations:', error);
      reject(error);
    });
  });
};

/**
 * Seeds the database with initial data (optional)
 * 
 * @description Populates the database with seed data for testing.
 * Uses the custom seed script from shared-ts package.
 * 
 * @returns Promise<void> Resolves when seeding completes
 * @throws Error if seeding fails
 */
export const seedDatabase = async (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🌱 Seeding database...');
    
    // Use process.cwd() to get the project root, then navigate to shared-ts
    const projectRoot = process.cwd();
    const sharedTsPath = join(projectRoot, 'packages', 'shared-ts');
    const tsxPath = join(sharedTsPath, 'node_modules', '.bin', 'tsx');
    
    const child = spawn(tsxPath, ['prisma/seeds/seed.ts'], {
      cwd: sharedTsPath,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database seeded successfully');
      } else {
        console.log('⚠️  Seeding failed, continuing...');
      }
      resolve(); // Always resolve, don't fail tests for seeding issues
    });
    
    child.on('error', (error) => {
      console.log('⚠️  Seeding failed, continuing...', error.message);
      resolve(); // Always resolve, don't fail tests for seeding issues
    });
  });
};

/**
 * Main execution function that orchestrates the database setup process
 * 
 * @description Sets up the database environment for testing including
 * migrations and optional seeding. Uses the real database configured
 * in DATABASE_URL environment variable.
 * 
 * @returns Promise<void> Resolves when setup is complete
 * @throws Error if any setup step fails
 */
const main = async (): Promise<void> => {
  console.log('🚀 Starting database setup for integration tests...');
  
  try {
    await runMigrations();
    await seedDatabase();
    
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

/**
 * Executes the main function when this script is run directly from the command line
 */
if (require.main === module) {
  main().catch(console.error);
}
