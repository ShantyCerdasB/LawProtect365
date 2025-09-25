/**
 * @fileoverview SignatureOrchestratorMock - Shared mock utilities for SignatureOrchestrator
 * @summary Centralized mock configuration for all integration tests
 * @description Provides a centralized, configurable mock for SignatureOrchestrator
 * that eliminates code duplication across all integration test files.
 * 
 * Features:
 * - Configurable mock methods
 * - Event tracking for verification
 * - Consistent behavior across all tests
 * - Easy maintenance and updates
 */

import { secureRandomString } from '../../helpers/testHelpers';

/**
 * Configuration for SignatureOrchestrator mock
 */
export interface SignatureOrchestratorMockConfig {
  /** Whether to mock publishNotificationEvent */
  mockPublishNotificationEvent?: boolean;
  /** Whether to mock publishReminderNotificationEvent */
  mockPublishReminderNotificationEvent?: boolean;
  /** Whether to mock publishDeclineNotificationEvent */
  mockPublishDeclineNotificationEvent?: boolean;
  /** Whether to mock publishViewerNotificationEvent */
  mockPublishViewerNotificationEvent?: boolean;
  /** Whether to mock publishCancellationNotificationEvent */
  mockPublishCancellationNotificationEvent?: boolean;
  /** Custom console logging level */
  logLevel?: 'none' | 'basic' | 'detailed';
}

/**
 * Default mock configuration
 */
const DEFAULT_CONFIG: SignatureOrchestratorMockConfig = {
  mockPublishNotificationEvent: true,
  mockPublishReminderNotificationEvent: false,
  mockPublishDeclineNotificationEvent: false,
  mockPublishViewerNotificationEvent: false,
  mockPublishCancellationNotificationEvent: false,
  logLevel: 'basic'
};

/**
 * Creates a mock for publishNotificationEvent
 * @param config - Mock configuration
 * @returns Mocked function
 */
function createPublishNotificationEventMock(config: SignatureOrchestratorMockConfig) {
  return jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
    if (config.logLevel === 'detailed') {
      console.log('🔧 Mocked publishNotificationEvent called:', {
        envelopeId: envelopeId?.getValue?.() || envelopeId,
        options,
        tokensCount: tokens?.length || 0
      });
    }

    // Register invitation in outboxMock for verification
    const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
    
    // Simulate invitation registration for each token
    for (const token of tokens || []) {
      const signerId = token.signerId?.getValue?.() || token.signerId;
      if (signerId) {
        // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../../../mocks/aws/outboxMock');
        
        // Get the internal Maps (they are defined at module level)
        const invitationHistory = outboxMockModule.invitationHistory || new Map();
        const publishedEvents = outboxMockModule.publishedEvents || new Map();
        
        // Initialize tracking for this envelope if not exists
        if (!invitationHistory.has(envelopeIdStr)) {
          invitationHistory.set(envelopeIdStr, new Set());
        }
        
        if (!publishedEvents.has(envelopeIdStr)) {
          publishedEvents.set(envelopeIdStr, []);
        }
        
        // Register invitation (allow duplicates for re-send scenarios)
        invitationHistory.get(envelopeIdStr).add(signerId);
        
        // Register event
        publishedEvents.get(envelopeIdStr).push({
          type: 'ENVELOPE_INVITATION',
          payload: {
            envelopeId: envelopeIdStr,
            signerId: signerId,
            eventType: 'ENVELOPE_INVITATION',
            message: options.message || 'You have been invited to sign a document'
          },
          detail: {
            envelopeId: envelopeIdStr,
            signerId: signerId,
            eventType: 'ENVELOPE_INVITATION',
            message: options.message || 'You have been invited to sign a document'
          },
          id: `mock-${Date.now()}-${secureRandomString(8)}`,
          timestamp: new Date().toISOString()
        });
        
        if (config.logLevel === 'detailed') {
          console.log('✅ Mocked invitation registered:', { envelopeId: envelopeIdStr, signerId });
        }
      }
    }
    
    if (config.logLevel === 'detailed') {
      console.log('✅ Mocked publishNotificationEvent completed successfully');
    }
    
    return Promise.resolve();
  });
}

/**
 * Creates a mock for publishReminderNotificationEvent
 * @param config - Mock configuration
 * @returns Mocked function
 */
function createPublishReminderNotificationEventMock(config: SignatureOrchestratorMockConfig) {
  return jest.fn().mockImplementation(async (
    envelopeId: any,
    signerId: any,
    message: string,
    reminderCount: number
  ) => {
    if (config.logLevel === 'detailed') {
      console.log('🔧 Mocked publishReminderNotificationEvent called:', {
        envelopeId: envelopeId?.getValue?.() || envelopeId,
        signerId: signerId?.getValue?.() || signerId,
        message,
        reminderCount
      });
    }

    // Register reminder notification in outboxMock for verification
    const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
    const signerIdStr = signerId?.getValue?.() || signerId;
    
    // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../../../mocks/aws/outboxMock');
    
    // Get the internal Maps (they are defined at module level)
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    
    // Initialize tracking for this envelope if not exists
    if (!publishedEvents.has(envelopeIdStr)) {
      publishedEvents.set(envelopeIdStr, []);
    }
    
    // Register reminder notification event with correct structure
    publishedEvents.get(envelopeIdStr).push({
      type: 'REMINDER_NOTIFICATION',
      payload: {
        envelopeId: envelopeIdStr,
        signerId: signerIdStr,
        message,
        reminderCount,
        eventType: 'REMINDER_NOTIFICATION'
      },
      detail: {
        envelopeId: envelopeIdStr,
        signerId: signerIdStr,
        message,
        reminderCount,
        eventType: 'REMINDER_NOTIFICATION'
      },
      id: `mock-reminder-${Date.now()}-${secureRandomString(8)}`,
      timestamp: new Date().toISOString()
    });
    
    return Promise.resolve();
  });
}

/**
 * Creates a mock for publishDeclineNotificationEvent
 * @param config - Mock configuration
 * @returns Mocked function
 */
function createPublishDeclineNotificationEventMock(config: SignatureOrchestratorMockConfig) {
  return jest.fn().mockImplementation(async (
    envelopeId: any,
    signerId: any,
    reason: any,
    signer: any,
    securityContext: any
  ) => {
    if (config.logLevel === 'detailed') {
      console.log('🔧 Mocked publishDeclineNotificationEvent called:', {
        envelopeId: envelopeId?.getValue?.() || envelopeId,
        signerId: signerId?.getValue?.() || signerId,
        reason,
        signerName: signer?.getFullName?.() || 'Unknown'
      });
    }

    // Register decline notification in outboxMock for verification
    const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
    const signerIdStr = signerId?.getValue?.() || signerId;
    
    // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../../../mocks/aws/outboxMock');
    
    // Get the internal Maps (they are defined at module level)
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    
    // Initialize tracking for this envelope if not exists
    if (!publishedEvents.has(envelopeIdStr)) {
      publishedEvents.set(envelopeIdStr, []);
    }
    
    // Register decline notification event with correct structure
    publishedEvents.get(envelopeIdStr).push({
      type: 'SIGNER_DECLINED',
      payload: {
        envelopeId: envelopeIdStr,
        signerId: signerIdStr,
        signerEmail: signer?.getEmail?.()?.getValue?.() || 'Unknown',
        signerName: signer?.getFullName?.() || 'Unknown',
        declineReason: reason,
        eventType: 'SIGNER_DECLINED'
      },
      detail: {
        envelopeId: envelopeIdStr,
        signerId: signerIdStr,
        signerEmail: signer?.getEmail?.()?.getValue?.() || 'Unknown',
        signerName: signer?.getFullName?.() || 'Unknown',
        declineReason: reason,
        eventType: 'SIGNER_DECLINED'
      },
      id: `mock-decline-${Date.now()}-${secureRandomString(8)}`,
      timestamp: new Date().toISOString()
    });
    
    return Promise.resolve();
  });
}

/**
 * Creates a mock for publishViewerNotificationEvent
 * @param config - Mock configuration
 * @returns Mocked function
 */
function createPublishViewerNotificationEventMock(config: SignatureOrchestratorMockConfig) {
  return jest.fn().mockImplementation(async (
    envelopeId: any, 
    email: string, 
    fullName: string, 
    message: string, 
    token: string, 
    expiresAt: Date
  ) => {
    if (config.logLevel === 'detailed') {
      console.log('🔧 Mocked publishViewerNotificationEvent called:', {
        envelopeId: envelopeId?.getValue?.() || envelopeId,
        email,
        fullName,
        message,
        token: token.substring(0, 20) + '...',
        expiresAt: expiresAt.toISOString()
      });
    }

    // Register viewer invitation in outboxMock for verification
    const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
    
    // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../../../mocks/aws/outboxMock');
    
    // Get the internal Maps (they are defined at module level)
    const invitationHistory = outboxMockModule.invitationHistory || new Map();
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    
    // Initialize tracking for this envelope if not exists
    if (!invitationHistory.has(envelopeIdStr)) {
      invitationHistory.set(envelopeIdStr, new Set());
    }
    
    if (!publishedEvents.has(envelopeIdStr)) {
      publishedEvents.set(envelopeIdStr, []);
    }
    
    // Register viewer invitation
    const viewerId = `external-viewer:${email}:${fullName}`;
    invitationHistory.get(envelopeIdStr).add(viewerId);
    
    // Register viewer notification event with correct structure
    publishedEvents.get(envelopeIdStr).push({
      type: 'DOCUMENT_VIEW_INVITATION',
      payload: {
        envelopeId: envelopeIdStr,
        viewerEmail: email,
        viewerName: fullName,
        message: message,
        invitationToken: token,
        expiresAt: expiresAt.toISOString(),
        participantRole: 'VIEWER',
        eventType: 'DOCUMENT_VIEW_INVITATION'
      },
      detail: {
        envelopeId: envelopeIdStr,
        viewerEmail: email,
        viewerName: fullName,
        message: message,
        invitationToken: token,
        expiresAt: expiresAt.toISOString(),
        participantRole: 'VIEWER',
        eventType: 'DOCUMENT_VIEW_INVITATION'
      },
      id: `mock-viewer-${Date.now()}-${secureRandomString(8)}`,
      timestamp: new Date().toISOString()
    });
    
    return Promise.resolve();
  });
}

/**
 * Creates a mock for publishCancellationNotificationEvent
 * @param config - Mock configuration
 * @returns Mocked function
 */
function createPublishCancellationNotificationEventMock(config: SignatureOrchestratorMockConfig) {
  return jest.fn().mockImplementation(async (
    envelopeId: any,
    userId: string,
    securityContext: any
  ) => {
    if (config.logLevel === 'detailed') {
      console.log('🔧 Mocked publishCancellationNotificationEvent called:', {
        envelopeId: envelopeId?.getValue?.() || envelopeId,
        userId,
        ipAddress: securityContext?.ipAddress || 'Unknown'
      });
    }

    // Register cancellation notification in outboxMock for verification
    const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
    
    // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../../../mocks/aws/outboxMock');
    
    // Get the internal Maps (they are defined at module level)
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    
    // Initialize tracking for this envelope if not exists
    if (!publishedEvents.has(envelopeIdStr)) {
      publishedEvents.set(envelopeIdStr, []);
    }
    
    // Register cancellation notification event with correct structure
    publishedEvents.get(envelopeIdStr).push({
      type: 'ENVELOPE_CANCELLED',
      payload: {
        envelopeId: envelopeIdStr,
        cancelledByUserId: userId,
        eventType: 'ENVELOPE_CANCELLED',
        ipAddress: securityContext?.ipAddress,
        userAgent: securityContext?.userAgent,
        country: securityContext?.country
      },
      detail: {
        envelopeId: envelopeIdStr,
        cancelledByUserId: userId,
        eventType: 'ENVELOPE_CANCELLED',
        ipAddress: securityContext?.ipAddress,
        userAgent: securityContext?.userAgent,
        country: securityContext?.country
      },
      id: `mock-cancellation-${Date.now()}-${secureRandomString(8)}`,
      timestamp: new Date().toISOString()
    });
    
    return Promise.resolve();
  });
}

/**
 * Creates the complete SignatureOrchestrator mock
 * @param config - Mock configuration
 * @returns Jest mock implementation
 */
export function createSignatureOrchestratorMock(config: SignatureOrchestratorMockConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return jest.fn().mockImplementation((...args) => {
    const actual = jest.requireActual('../../../src/services/SignatureOrchestrator');
    const instance = new actual.SignatureOrchestrator(...args);
    
    // Apply configured mocks
    if (finalConfig.mockPublishNotificationEvent) {
      instance.publishNotificationEvent = createPublishNotificationEventMock(finalConfig);
    }
    
    if (finalConfig.mockPublishReminderNotificationEvent) {
      instance.publishReminderNotificationEvent = createPublishReminderNotificationEventMock(finalConfig);
    }
    
    if (finalConfig.mockPublishDeclineNotificationEvent) {
      instance.publishDeclineNotificationEvent = createPublishDeclineNotificationEventMock(finalConfig);
    }
    
    if (finalConfig.mockPublishViewerNotificationEvent) {
      instance.publishViewerNotificationEvent = createPublishViewerNotificationEventMock(finalConfig);
    }
    
    if (finalConfig.mockPublishCancellationNotificationEvent) {
      instance.publishCancellationNotificationEvent = createPublishCancellationNotificationEventMock(finalConfig);
    }
    
    return instance;
  });
}

/**
 * Jest mock setup for SignatureOrchestrator
 * @param config - Mock configuration
 */
export function setupSignatureOrchestratorMock(config: SignatureOrchestratorMockConfig = {}) {
  jest.mock('../../../../src/services/SignatureOrchestrator', () => {
    const actual = jest.requireActual('../../../../src/services/SignatureOrchestrator');
    return {
      ...actual,
      SignatureOrchestrator: jest.fn().mockImplementation((...args) => {
        const instance = new actual.SignatureOrchestrator(...args);
        
        // Mock the publishNotificationEvent method
        instance.publishNotificationEvent = jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
          console.log('🔧 Mocked publishNotificationEvent called:', {
            envelopeId: envelopeId?.getValue?.() || envelopeId,
            options,
            tokensCount: tokens?.length || 0
          });
          // Just return success without actually publishing
          return Promise.resolve();
        });

        // Mock the publishReminderNotificationEvent method
        instance.publishReminderNotificationEvent = jest.fn().mockImplementation(async (
          envelopeId: any,
          signerId: any,
          message: string,
          reminderCount: number
        ) => {
          console.log('🔧 Mocked publishReminderNotificationEvent called:', {
            envelopeId: envelopeId?.getValue?.() || envelopeId,
            signerId: signerId?.getValue?.() || signerId,
            message,
            reminderCount
          });

          // Register reminder notification in outboxMock for verification
          const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
          const signerIdStr = signerId?.getValue?.() || signerId;
          
          // Access the internal Maps directly from the outboxMock module
          const outboxMockModule = require('../../mocks/aws/outboxMock');
          
          // Get the internal Maps (they are defined at module level)
          const publishedEvents = outboxMockModule.publishedEvents || new Map();
          
          // Initialize tracking for this envelope if not exists
          if (!publishedEvents.has(envelopeIdStr)) {
            publishedEvents.set(envelopeIdStr, []);
          }
          
          // Register reminder notification event with correct structure
          publishedEvents.get(envelopeIdStr).push({
            type: 'REMINDER_NOTIFICATION',
            payload: {
              envelopeId: envelopeIdStr,
              signerId: signerIdStr,
              message,
              reminderCount,
              eventType: 'REMINDER_NOTIFICATION'
            },
            detail: {
              envelopeId: envelopeIdStr,
              signerId: signerIdStr,
              message,
              reminderCount,
              eventType: 'REMINDER_NOTIFICATION'
            },
            id: `mock-reminder-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
            timestamp: new Date().toISOString()
          });
          
          return Promise.resolve();
        });

        // Mock the publishDeclineNotificationEvent method
        instance.publishDeclineNotificationEvent = jest.fn().mockImplementation(async (
          envelopeId: any,
          signerId: any,
          reason: string
        ) => {
          console.log('🔧 Mocked publishDeclineNotificationEvent called:', {
            envelopeId: envelopeId?.getValue?.() || envelopeId,
            signerId: signerId?.getValue?.() || signerId,
            reason
          });
          return Promise.resolve();
        });

        // Mock the publishViewerNotificationEvent method
        instance.publishViewerNotificationEvent = jest.fn().mockImplementation(async (
          envelopeId: any,
          viewerId: any,
          message: string
        ) => {
          console.log('🔧 Mocked publishViewerNotificationEvent called:', {
            envelopeId: envelopeId?.getValue?.() || envelopeId,
            viewerId: viewerId?.getValue?.() || viewerId,
            message
          });
          return Promise.resolve();
        });
        
        return instance;
      })
    };
  });
}

/**
 * Predefined mock configurations for common test scenarios
 */
export const MockConfigs = {
  /** Basic mock for most tests */
  BASIC: {
    mockPublishNotificationEvent: true,
    logLevel: 'basic' as const
  },
  
  /** Mock for reminder tests */
  REMINDERS: {
    mockPublishNotificationEvent: true,
    mockPublishReminderNotificationEvent: true,
    logLevel: 'basic' as const
  },
  
  /** Mock for decline tests */
  DECLINES: {
    mockPublishNotificationEvent: true,
    mockPublishDeclineNotificationEvent: true,
    logLevel: 'basic' as const
  },
  
  /** Mock for viewer tests */
  VIEWERS: {
    mockPublishNotificationEvent: true,
    mockPublishViewerNotificationEvent: true,
    logLevel: 'basic' as const
  },
  
  /** Mock for cancellation tests */
  CANCELLATIONS: {
    mockPublishNotificationEvent: true,
    mockPublishCancellationNotificationEvent: true,
    logLevel: 'basic' as const
  },
  
  /** Mock for comprehensive tests */
  COMPREHENSIVE: {
    mockPublishNotificationEvent: true,
    mockPublishReminderNotificationEvent: true,
    mockPublishDeclineNotificationEvent: true,
    mockPublishViewerNotificationEvent: true,
    mockPublishCancellationNotificationEvent: true,
    logLevel: 'detailed' as const
  }
} as const;
