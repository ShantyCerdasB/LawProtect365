/**
 * @fileoverview InvitationTokenService Mock - Reusable mock for InvitationTokenService
 * @summary Mock implementation for InvitationTokenService in tests
 * @description Provides mock implementations for InvitationTokenService methods
 * to be used across different test scenarios. Includes both success and failure
 * mock configurations for comprehensive testing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock InvitationTokenService with default implementations
 * @returns Mock InvitationTokenService with jest functions
 */
export function createInvitationTokenServiceMock() {
  return {
    generateInvitationTokensForSigners: jest.fn() as jest.MockedFunction<any>
  };
}

/**
 * Creates a mock InvitationTokenService with successful generateInvitationTokensForSigners
 * @param tokens - Optional tokens to return (defaults to generated test tokens)
 * @returns Mock InvitationTokenService with successful generateInvitationTokensForSigners
 */
export function createInvitationTokenServiceMockWithSuccess(tokens: any[] = []) {
  const mockService = createInvitationTokenServiceMock();
  
  mockService.generateInvitationTokensForSigners.mockResolvedValue(tokens);
  
  return mockService;
}

/**
 * Creates a mock InvitationTokenService with failing generateInvitationTokensForSigners
 * @param error - Error to throw (defaults to generic error)
 * @returns Mock InvitationTokenService with failing generateInvitationTokensForSigners
 */
export function createInvitationTokenServiceMockWithFailure(error: Error = new Error('Token generation failed')) {
  const mockService = createInvitationTokenServiceMock();
  
  mockService.generateInvitationTokensForSigners.mockRejectedValue(error);
  
  return mockService;
}