/**
 * @fileoverview InMemoryOutboxRepository - In-memory mock of OutboxRepository
 * @summary Mock implementation of OutboxRepository for integration tests
 * @description Provides an in-memory implementation of OutboxRepository that
 * captures events for testing without requiring DynamoDB.
 */

import { type OutboxRecord } from '@lawprotect/shared-ts';

/**
 * In-memory implementation of OutboxRepository for testing
 * 
 * This mock captures all outbox events in memory, allowing tests to:
 * - Verify that events were published
 * - Inspect event data
 * - Test event publishing logic without DynamoDB
 */
export class InMemoryOutboxRepository {
  private events: OutboxRecord[] = [];
  private nextId = 1;

  /**
   * Saves an outbox record to memory
   * @param record - The outbox record to save
   * @returns Promise that resolves when the record is saved
   */
  async save(record: OutboxRecord): Promise<void> {
    const eventWithId = {
      ...record,
      id: record.id || `test-outbox-${this.nextId++}`,
      createdAt: (record as any).createdAt || new Date().toISOString(),
      status: record.status || 'pending'
    };
    
    this.events.push(eventWithId);
  }

  /**
   * Gets an outbox record by ID
   * @param id - The record ID
   * @returns Promise that resolves to the record or null
   */
  async getById(id: string): Promise<OutboxRecord | null> {
    const record = this.events.find(event => event.id === id);
    return record || null;
  }

  /**
   * Checks if a record exists
   * @param id - The record ID
   * @returns Promise that resolves to true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.events.some(event => event.id === id);
  }

  /**
   * Marks a record as processed
   * @param id - The record ID
   * @param processedAt - When it was processed
   * @returns Promise that resolves when marked
   */
  async markAsProcessed(id: string): Promise<void> {
    const record = this.events.find(event => event.id === id);
    if (record) {
      record.status = 'dispatched';
    }
  }

  /**
   * Lists outbox records with pagination
   * @param options - Query options
   * @returns Promise that resolves to paginated results
   */
  async list(options: {
    status?: string;
    limit?: number;
    lastEvaluatedKey?: string;
  } = {}): Promise<{
    items: OutboxRecord[];
    lastEvaluatedKey?: string;
    hasMore: boolean;
  }> {
    let filteredEvents = [...this.events];
    
    if (options.status) {
      filteredEvents = filteredEvents.filter(event => event.status === options.status);
    }
    
    const limit = options.limit || 100;
    const items = filteredEvents.slice(0, limit);
    const hasMore = filteredEvents.length > limit;
    
    return {
      items,
      hasMore,
      lastEvaluatedKey: hasMore ? `last-${limit}` : undefined
    };
  }

  /**
   * Counts records by status
   * @param status - The status to count
   * @returns Promise that resolves to the count
   */
  async countByStatus(status: "pending" | "dispatched" | "failed"): Promise<any> {
    return { count: this.events.filter(event => event.status === status).length };
  }

  /**
   * Gets outbox statistics
   * @returns Promise that resolves to statistics
   */
  async getOutboxStats(): Promise<{
    pending: number;
    dispatched: number;
    failed: number;
  }> {
    const pending = this.events.filter(event => event.status === 'pending').length;
    const dispatched = this.events.filter(event => event.status === 'dispatched').length;
    const failed = this.events.filter(event => event.status === 'failed').length;
    
    return { pending, dispatched, failed };
  }

  /**
   * Deletes a record
   * @param id - The record ID
   * @returns Promise that resolves when deleted
   */
  async delete(id: string): Promise<void> {
    const index = this.events.findIndex(event => event.id === id);
    if (index !== -1) {
      this.events.splice(index, 1);
    }
  }

  /**
   * Gets all captured events (for testing)
   * @returns Array of all captured events
   */
  getEvents(): OutboxRecord[] {
    return [...this.events];
  }

  /**
   * Gets events by type (for testing)
   * @param eventType - The event type to filter by
   * @returns Array of events of the specified type
   */
  getEventsByType(eventType: string): OutboxRecord[] {
    return this.events.filter(event => 
      event.payload &&
      typeof event.payload === 'object' &&
      'type' in event.payload &&
      event.payload.type === eventType
    );
  }

  /**
   * Gets events by source (for testing)
   * @param source - The event source to filter by
   * @returns Array of events from the specified source
   */
  getEventsBySource(source: string): OutboxRecord[] {
    return this.events.filter(event => 
      event.payload &&
      typeof event.payload === 'object' &&
      'source' in event.payload &&
      event.payload.source === source
    );
  }

  /**
   * Clears all captured events (for test cleanup)
   */
  clear(): void {
    this.events = [];
    this.nextId = 1;
  }

  /**
   * Gets the count of captured events
   * @returns Number of captured events
   */
  getEventCount(): number {
    return this.events.length;
  }
}
