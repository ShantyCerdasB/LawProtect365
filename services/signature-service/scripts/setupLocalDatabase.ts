/**
 * @file setupLocalDatabase.ts
 * @summary Script to setup database for integration testing
 * @description This script sets up the database for integration testing.
 * It uses the real PostgreSQL database configured in DATABASE_URL.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

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
  try {

    
    // Use process.cwd() to get the project root, then navigate to shared-ts
    // process.cwd() is already in services/signature-service, so we need to go up 2 levels
    const projectRoot = join(process.cwd(), '..', '..');
    const sharedTsPath = join(projectRoot, 'packages', 'shared-ts');
    
    // Verify the shared-ts directory exists
    if (!existsSync(sharedTsPath)) {
      throw new Error(`Shared-ts directory not found at: ${sharedTsPath}`);
    }
    
    // Use the npm script from package.json for better compatibility
    // This approach works better in CI/CD environments like AWS CodeBuild
    execSync('npm run prisma:migrate', {
      cwd: sharedTsPath,
      stdio: 'inherit',
      env: { ...process.env }
    });
    

  } catch (error) {
    console.error('❌ Failed to run Prisma migrations:', error);
    throw error;
  }
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
  try {

    
    // Use process.cwd() to get the project root, then navigate to shared-ts
    // process.cwd() is already in services/signature-service, so we need to go up 2 levels
    const projectRoot = join(process.cwd(), '..', '..');
    const sharedTsPath = join(projectRoot, 'packages', 'shared-ts');
    
    // Verify the shared-ts directory exists
    if (!existsSync(sharedTsPath)) {
      throw new Error(`Shared-ts directory not found at: ${sharedTsPath}`);
    }
    
    // Use the npm script from package.json for better compatibility
    // This approach works better in CI/CD environments like AWS CodeBuild
    execSync('npm run prisma:seed', {
      cwd: sharedTsPath,
      stdio: 'inherit',
      env: { ...process.env }
    });
    

  } catch (error) {
    // Don't throw error for seeding failures
    console.warn('Database seeding failed:', error);
  }
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

  try {
    await runMigrations();
    await seedDatabase();
    

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

/**
 * Executes the main function when this script is run directly from the command line
 */
if (require.main === module) {
  await main();
}
