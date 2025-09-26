/**
 * @fileoverview OutboxRepositoryMock - Mock for OutboxRepository in integration tests
 * @summary Centralized mock for OutboxRepository to test event publishing
 * @description Provides a mock for OutboxRepository that tracks events without
 * actually persisting them, allowing integration tests to verify event publishing
 * behavior without external dependencies.
 */

/**
 * Mock configuration for OutboxRepository
 */
export interface OutboxRepositoryMockConfig {
  /** Whether to log events to console */
  logEvents?: boolean;
  /** Custom event tracking */
  trackEvents?: boolean;
}

/**
 * Default mock configuration
 */
const DEFAULT_CONFIG: OutboxRepositoryMockConfig = {
  logEvents: true,
  trackEvents: true
};

/**
 * Global event storage for verification
 */
export const mockEventStorage = {
  events: new Map<string, any[]>(),
  eventCount: 0,
  
  /**
   * Clear all stored events
   */
  clear(): void {
    this.events.clear();
    this.eventCount = 0;
  },
  
  /**
   * Get events for a specific envelope
   */
  getEvents(envelopeId: string): any[] {
    return this.events.get(envelopeId) || [];
  },
  
  /**
   * Get all events
   */
  getAllEvents(): any[] {
    const allEvents: any[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events);
    }
    return allEvents;
  },
  
  /**
   * Get event count
   */
  getEventCount(): number {
    return this.eventCount;
  }
};

/**
 * Creates a mock implementation of OutboxRepository
 * @param config - Mock configuration
 * @returns Mocked OutboxRepository instance
 */
function createOutboxRepositoryMock(config: OutboxRepositoryMockConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return {
    /**
     * Mock implementation of save method
     * @param event - Event to save
     * @param dedupId - Deduplication ID
     * @returns Promise that resolves when event is "saved"
     */
    async save(event: any, dedupId?: string): Promise<void> {
      if (finalConfig.trackEvents) {
        // Extract envelope ID from event
        const envelopeId = event?.payload?.envelopeId || event?.envelopeId || 'unknown';
        
        // Initialize events array for this envelope if not exists
        if (!mockEventStorage.events.has(envelopeId)) {
          mockEventStorage.events.set(envelopeId, []);
        }
        
        // Store the event
        const eventRecord = {
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          envelopeId,
          event,
          dedupId,
          timestamp: new Date().toISOString(),
          eventType: event?.name || event?.type || 'UNKNOWN'
        };
        
        mockEventStorage.events.get(envelopeId)!.push(eventRecord);
        mockEventStorage.eventCount++;
        
        if (finalConfig.logEvents) {
          console.log('🔧 Mocked OutboxRepository.save called:', {
            envelopeId,
            eventType: eventRecord.eventType,
            dedupId,
            totalEvents: mockEventStorage.eventCount
          });
        }
      }
      
      // Simulate successful save
      return Promise.resolve();
    },
    
    /**
     * Mock implementation of other methods (if any)
     */
    async findById(id: string): Promise<any> {
      return Promise.resolve(null);
    },
    
    async findByEnvelopeId(envelopeId: string): Promise<any[]> {
      return Promise.resolve(mockEventStorage.getEvents(envelopeId));
    },
    
    async delete(id: string): Promise<void> {
      return Promise.resolve();
    }
  };
}

/**
 * Jest mock setup for OutboxRepository
 * @param config - Mock configuration
 */
export function setupOutboxRepositoryMock(config: OutboxRepositoryMockConfig = {}) {
  // Clear previous events
  mockEventStorage.clear();
  
  // Mock the OutboxRepository class directly
  jest.mock('@lawprotect/shared-ts', () => {
    const actual = jest.requireActual('@lawprotect/shared-ts');
    return {
      ...actual,
      OutboxRepository: jest.fn().mockImplementation(() => {
        return createOutboxRepositoryMock(config);
      })
    };
  });
}

/**
 * Helper functions for test verification
 */
export const OutboxRepositoryTestHelpers = {
  /**
   * Get all events stored in the mock
   */
  getAllEvents(): any[] {
    return mockEventStorage.getAllEvents();
  },
  
  /**
   * Get events for a specific envelope
   */
  getEventsForEnvelope(envelopeId: string): any[] {
    return mockEventStorage.getEvents(envelopeId);
  },
  
  /**
   * Get event count
   */
  getEventCount(): number {
    return mockEventStorage.getEventCount();
  },
  
  /**
   * Clear all events
   */
  clearEvents(): void {
    mockEventStorage.clear();
  },
  
  /**
   * Verify that an event was published
   */
  verifyEventPublished(envelopeId: string, eventType: string): boolean {
    const events = mockEventStorage.getEvents(envelopeId);
    return events.some(event => event.eventType === eventType);
  },
  
  /**
   * Verify that multiple events were published
   */
  verifyEventsPublished(envelopeId: string, eventTypes: string[]): boolean {
    const events = mockEventStorage.getEvents(envelopeId);
    const publishedTypes = events.map(event => event.eventType);
    return eventTypes.every(type => publishedTypes.includes(type));
  }
};
