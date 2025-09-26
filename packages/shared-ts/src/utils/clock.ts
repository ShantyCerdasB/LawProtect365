/**
 * @fileoverview Clock - Time abstraction utility
 * @summary Provides time abstraction for deterministic testing and system time access
 * @description The Clock interface and implementations provide a way to abstract time access,
 * allowing for deterministic testing by injecting mock clocks and consistent time handling
 * across the application.
 */

/**
 * Clock interface for time abstraction
 * Allows for deterministic testing by providing a mockable time source
 */
export interface Clock {
  /**
   * Gets the current time
   * @returns Current Date instance
   */
  now(): Date;
}

/**
 * System clock implementation that uses the real system time
 */
export const systemClock: Clock = {
  now: () => new Date()
};

/**
 * Fixed clock implementation for testing
 * Always returns the same time
 */
export class FixedClock implements Clock {
  constructor(private readonly fixedTime: Date) {}

  now(): Date {
    return this.fixedTime;
  }
}

/**
 * Creates a fixed clock with a specific time
 * @param time - The fixed time to return
 * @returns FixedClock instance
 */
export function createFixedClock(time: Date): FixedClock {
  return new FixedClock(time);
}
