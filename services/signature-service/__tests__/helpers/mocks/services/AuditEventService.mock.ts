/**
 * @fileoverview AuditEventService Mock - Reusable mock for AuditEventService
 * @summary Mock implementation for AuditEventService in tests
 * @description Provides mock implementations for AuditEventService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock AuditEventService with default implementations
 * @returns Mock AuditEventService with jest functions
 */
export function createAuditEventServiceMock() {
  return {
    getByEnvelope: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock AuditEventService with successful getByEnvelope
 * @param events - Optional events to return (defaults to empty array)
 * @returns Mock AuditEventService with successful getByEnvelope
 */
export function createAuditEventServiceMockWithSuccess(events: any[] = []) {
  const mockService = createAuditEventServiceMock();
  
  mockService.getByEnvelope.mockResolvedValue(events);
  
  return mockService;
}

/**
 * Creates a mock AuditEventService with failing getByEnvelope
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock AuditEventService with failing getByEnvelope
 */
export function createAuditEventServiceMockWithFailure(error: Error = new Error('Audit events retrieval failed')) {
  const mockService = createAuditEventServiceMock();
  
  mockService.getByEnvelope.mockRejectedValue(error);
  
  return mockService;
}
