/**
 * @file seed.ts
 * @summary Database seed script for signature service
 * @description Seeds the database with test users and initial data for integration testing.
 * This seed creates a test user that can be used across all integration tests.
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the database with test data
 * 
 * @description Creates a test user that can be used across all integration tests.
 * This user has ADMIN role and can create envelopes for testing purposes.
 * 
 * @returns Promise<void> Resolves when seeding is complete
 */
async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test user for integration tests
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        // Update existing user if found
        name: 'Test User',
        role: UserRole.ADMIN,
        updatedAt: new Date()
      },
      create: {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID for test user
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ADMIN
      }
    });

    console.log('✅ Test user created/updated:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role
    });

    // Create second test user for security testing
    const testUser2 = await prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {
        // Update existing user if found
        name: 'Test User 2',
        role: UserRole.ADMIN,
        updatedAt: new Date()
      },
      create: {
        id: '660e8400-e29b-41d4-a716-446655440001', // Valid UUID for second test user
        email: 'test2@example.com',
        name: 'Test User 2',
        role: UserRole.ADMIN
      }
    });

    console.log('✅ Second test user created/updated:', {
      id: testUser2.id,
      email: testUser2.email,
      name: testUser2.name,
      role: testUser2.role
    });

    // Note: External users are NOT stored in the User table
    // They are handled separately as EnvelopeSigner entities with isExternal=true

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Executes the seed function and handles cleanup
 */
main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
