/**
 * @fileoverview Handler Test Helpers - Utilities for testing handlers
 * @summary Helper functions and utilities for handler testing
 * @description Provides utilities for testing handlers with proper mocking and setup.
 */

import { jest } from '@jest/globals';
import { setupHandlerMocks, resetHandlerMocks, mockServiceFactory } from './mocks/handlers/HandlerMocks';

/**
 * Test configuration for handlers
 */
export interface HandlerTestConfig {
  mockOrchestrator?: boolean;
  mockServices?: boolean;
  mockConfig?: boolean;
  mockAws?: boolean;
}

/**
 * Setup handler test environment
 * @param config - Configuration for the test setup
 */
export const setupHandlerTest = (config: HandlerTestConfig = {}) => {
  const {
    mockOrchestrator = true,
    mockServices = true,
    mockConfig = true,
    mockAws = true
  } = config;

  if (mockConfig) {
    setupHandlerMocks();
  }

  if (mockOrchestrator) {
    // Mock orchestrator methods
    const mockOrchestrator = mockServiceFactory.createSignatureOrchestrator();
    mockOrchestrator.getAuditTrail = jest.fn();
    mockOrchestrator.createEnvelope = jest.fn();
    mockOrchestrator.cancelEnvelope = jest.fn();
    mockOrchestrator.updateEnvelope = jest.fn();
    mockOrchestrator.sendEnvelope = jest.fn();
    mockOrchestrator.getEnvelope = jest.fn();
    mockOrchestrator.listEnvelopesByUser = jest.fn();
    mockOrchestrator.downloadDocument = jest.fn();
    mockOrchestrator.declineSigner = jest.fn();
    mockOrchestrator.shareDocumentView = jest.fn();
    mockOrchestrator.signDocument = jest.fn();
    mockOrchestrator.sendReminders = jest.fn();
  }

  if (mockServices) {
    // Mock individual services
    mockServiceFactory.createSignatureEnvelopeService.mockReturnValue({
      createEnvelope: jest.fn(),
      getEnvelope: jest.fn(),
      updateEnvelope: jest.fn(),
      cancelEnvelope: jest.fn(),
      sendEnvelope: jest.fn(),
      getEnvelopeWithSigners: jest.fn(),
      validateUserAccess: jest.fn(),
      updateSignedDocument: jest.fn(),
      updateHashes: jest.fn(),
      completeEnvelope: jest.fn()
    });

    mockServiceFactory.createEnvelopeSignerService.mockReturnValue({
      createSignersForEnvelope: jest.fn(),
      getPendingSigners: jest.fn(),
      markSignerAsSigned: jest.fn(),
      deleteSigner: jest.fn(),
      createViewerParticipant: jest.fn()
    });

    mockServiceFactory.createInvitationTokenService.mockReturnValue({
      generateInvitationTokensForSigners: jest.fn(),
      getTokensBySigner: jest.fn(),
      markTokenAsSigned: jest.fn(),
      markTokenAsViewed: jest.fn(),
      generateViewerInvitationToken: jest.fn(),
      updateTokenSent: jest.fn()
    });

    mockServiceFactory.createAuditEventService.mockReturnValue({
      create: jest.fn(),
      getByEnvelope: jest.fn()
    });

    mockServiceFactory.createEnvelopeNotificationService.mockReturnValue({
      sendSignerInvitations: jest.fn(),
      publishReminder: jest.fn(),
      sendViewerInvitation: jest.fn(),
      publishSignerDeclined: jest.fn()
    });

    mockServiceFactory.createKmsService.mockReturnValue({
      sign: jest.fn()
    });

    mockServiceFactory.createS3Service.mockReturnValue({
      upload: jest.fn(),
      download: jest.fn(),
      delete: jest.fn(),
      getSignedUrl: jest.fn(),
      copyObject: jest.fn(),
      headObject: jest.fn(),
      assertExists: jest.fn()
    });

    mockServiceFactory.createConsentService.mockReturnValue({
      createConsent: jest.fn(),
      linkConsentWithSignature: jest.fn()
    });

    mockServiceFactory.createSignerReminderTrackingService.mockReturnValue({
      canSendReminder: jest.fn(),
      recordReminderSent: jest.fn()
    });
  }
};

/**
 * Reset handler test environment
 */
export const resetHandlerTest = () => {
  resetHandlerMocks();
};

/**
 * Create mock request data for handlers
 */
export const createMockRequest = (overrides: any = {}) => ({
  path: { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
  body: {},
  query: {},
  context: {
    auth: {
      userId: 'test-user-id'
    }
  },
  ...overrides
});

/**
 * Create mock response data for handlers
 */
export const createMockResponse = (overrides: any = {}) => ({
  envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  events: [
    {
      id: 'event-1',
      eventType: 'ENVELOPE_CREATED',
      description: 'Envelope created',
      userEmail: 'test@example.com',
      userName: 'Test User',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      metadata: { source: 'test' }
    }
  ],
  ...overrides
});

/**
 * Create mock envelope data
 */
export const createMockEnvelope = (overrides: any = {}) => ({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  title: 'Test Document',
  status: 'DRAFT',
  createdBy: 'test-user-id',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides
});

/**
 * Create mock signer data
 */
export const createMockSigner = (overrides: any = {}) => ({
  id: 'signer-123',
  email: 'signer@example.com',
  fullName: 'John Signer',
  order: 1,
  status: 'PENDING',
  signingOrder: 1,
  ...overrides
});

/**
 * Test handler configuration
 */
export const testHandlerConfiguration = (handler: any) => {
  expect(handler).toBeDefined();
  expect(typeof handler).toBe('object');
  
  // Test that handler has required properties
  if (handler.pathSchema) {
    expect(handler.pathSchema).toBeDefined();
  }
  if (handler.querySchema) {
    expect(handler.querySchema).toBeDefined();
  }
  if (handler.bodySchema) {
    expect(handler.bodySchema).toBeDefined();
  }
  if (handler.requireAuth !== undefined) {
    expect(typeof handler.requireAuth).toBe('boolean');
  }
  if (handler.requiredRoles) {
    expect(Array.isArray(handler.requiredRoles)).toBe(true);
  }
  if (handler.includeSecurityContext !== undefined) {
    expect(typeof handler.includeSecurityContext).toBe('boolean');
  }
  if (handler.responseType) {
    expect(handler.responseType).toBeDefined();
  }
};

/**
 * Test handler execution
 */
export const testHandlerExecution = async (handler: any, request: any, expectedResult?: any) => {
  if (handler.appServiceClass) {
    const serviceInstance = new handler.appServiceClass();
    const params = handler.extractParams(request.path, request.body, request.query, request.context);
    const result = await serviceInstance.execute(params);
    
    if (expectedResult) {
      expect(result).toEqual(expectedResult);
    }
    
    return result;
  }
  
  throw new Error('Handler does not have appServiceClass');
};

/**
 * Test handler parameter extraction
 */
export const testHandlerParameterExtraction = (handler: any, request: any, expectedParams?: any) => {
  if (handler.extractParams) {
    const params = handler.extractParams(request.path, request.body, request.query, request.context);
    
    if (expectedParams) {
      expect(params).toEqual(expectedParams);
    }
    
    return params;
  }
  
  throw new Error('Handler does not have extractParams');
};

/**
 * Test handler response transformation
 */
export const testHandlerResponseTransformation = async (handler: any, result: any, expectedTransformed?: any) => {
  if (handler.transformResult) {
    const transformed = await handler.transformResult(result);
    
    if (expectedTransformed) {
      expect(transformed).toEqual(expectedTransformed);
    }
    
    return transformed;
  }
  
  throw new Error('Handler does not have transformResult');
};
