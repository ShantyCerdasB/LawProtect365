/**
 * @fileoverview S3Cleanup - S3 mock storage cleanup utilities
 * @summary Provides cleanup functions for S3 mock storage
 * @description Standalone cleanup utilities for S3 mock storage that don't depend
 * on Jest globals, making them safe to use in globalTeardown.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Temporary storage directory for S3 mock objects
 * 
 * @description Path to the temporary directory used by S3 mock for file storage
 */
const tempStorageDir = join(tmpdir(), 'lawprotect365-s3-mock');

/**
 * Clean up temporary storage after tests
 * 
 * @description Removes all temporary files created by S3 mock
 * to prevent accumulation of test files. This function is safe to use
 * in globalTeardown as it doesn't depend on Jest globals.
 * 
 * @returns Promise<void> Resolves when cleanup is complete
 */
export async function cleanupS3MockStorage(): Promise<void> {
  try {
    await fs.rm(tempStorageDir, { recursive: true, force: true });
    console.log('🧹 S3 mock storage cleaned up successfully');
  } catch (error) {
    console.warn('⚠️  Failed to clean up S3 mock storage:', error);
    // Don't throw error in cleanup to avoid masking test failures
  }
}
