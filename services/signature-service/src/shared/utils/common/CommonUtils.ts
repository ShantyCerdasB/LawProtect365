/**
 * @file CommonUtils.ts
 * @summary Shared utilities for common operations
 * @description Common utility functions that can be reused across microservices
 */

/**
 * Small sleep helper for async operations.
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));
