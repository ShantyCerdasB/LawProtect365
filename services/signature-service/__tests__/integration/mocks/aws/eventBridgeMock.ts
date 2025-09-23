/**
 * @fileoverview EventBridgeMock - Realistic EventBridge service mock for integration tests
 * @summary Provides comprehensive EventBridge mocking that simulates real AWS EventBridge behavior
 * @description Mock implementation of AWS EventBridge service that provides realistic behavior
 * for event publishing and event bus creation operations. The mock generates
 * realistic event IDs and handles batch event publishing with proper response structure.
 */

// Using global jest - no import needed in setupFiles

/**
 * Mock EventBridge service with realistic behavior
 * 
 * @description Provides comprehensive EventBridge mocking that simulates real AWS EventBridge
 * behavior for event publishing and event bus creation operations. The mock generates
 * realistic event IDs and handles batch event publishing with proper response structure.
 */
jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      if (command && command.constructor && command.constructor.name === 'PutEventsCommand') {
        const entries: any[] = command.input?.Entries || [];
        return {
          Entries: entries.map((_entry: any, index: number) => ({
            EventId: `test-event-id-${index}-${Date.now()}`,
            ErrorCode: undefined,
            ErrorMessage: undefined
          })),
          FailedEntryCount: 0
        } as any;
      }
      
      if (command && command.constructor && command.constructor.name === 'CreateEventBusCommand') {
        return {
          EventBusArn: `arn:aws:events:us-east-1:000000000000:event-bus/${command.input?.Name}`
        } as any;
      }
      
      return {} as any;
    }),
  })),
  
  PutEventsCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateEventBusCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

