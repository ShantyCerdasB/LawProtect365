/**
 * @fileoverview SignerReminderTrackingService Mock - Reusable mock for SignerReminderTrackingService
 * @summary Mock implementation for SignerReminderTrackingService in tests
 * @description Provides mock implementations for SignerReminderTrackingService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock SignerReminderTrackingService with default implementations
 * @returns Mock SignerReminderTrackingService with jest functions
 */
export function createSignerReminderTrackingServiceMock() {
  return {
    canSendReminder: jest.fn() as jest.MockedFunction<any>,
    recordReminderSent: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock SignerReminderTrackingService with successful operations
 * @param canSend - Whether reminders can be sent (defaults to true)
 * @param tracking - Optional tracking object to return
 * @returns Mock SignerReminderTrackingService with successful operations
 */
export function createSignerReminderTrackingServiceMockWithSuccess(
  canSend: boolean = true,
  tracking?: any
) {
  const mockService = createSignerReminderTrackingServiceMock();
  const defaultTracking = tracking || {
    getReminderCount: () => 1,
    getLastReminderAt: () => new Date()
  };

  mockService.canSendReminder.mockResolvedValue({
    canSend,
    reason: canSend ? undefined : 'Rate limit exceeded'
  });
  mockService.recordReminderSent.mockResolvedValue(defaultTracking);

  return mockService;
}

/**
 * Creates a mock SignerReminderTrackingService with failing operations
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock SignerReminderTrackingService with failing operations
 */
export function createSignerReminderTrackingServiceMockWithFailure(error: Error = new Error('Reminder tracking failed')) {
  const mockService = createSignerReminderTrackingServiceMock();

  mockService.canSendReminder.mockRejectedValue(error);
  mockService.recordReminderSent.mockRejectedValue(error);

  return mockService;
}
