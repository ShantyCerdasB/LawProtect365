/**
 * @fileoverview OutboxRecord entity - Represents an outbox record for reliable event delivery
 * @summary Domain entity for outbox records
 * @description The OutboxRecord entity represents a record in the outbox pattern
 * for reliable event delivery, ensuring that events are published even if
 * the system fails during the publishing process.
 */

import { OutboxId } from '../value-objects/OutboxId';
import { OUTBOX_STATUSES } from '../enums/OutboxStatuses';

/**
 * OutboxRecord entity
 * 
 * Represents a record in the outbox pattern for reliable event delivery,
 * ensuring that events are published even if the system fails during
 * the publishing process.
 */
export class OutboxRecord {
  constructor(
    private readonly id: OutboxId,
    private readonly eventType: string,
    private readonly payload: any,
    private readonly status: OUTBOX_STATUSES,
    private readonly createdAt: Date,
    private readonly processedAt?: Date,
    private readonly errorMessage?: string,
    private readonly retryCount?: number
  ) {}

  /**
   * Gets the outbox record unique identifier
   */
  getId(): OutboxId {
    return this.id;
  }

  /**
   * Gets the event type
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * Gets the event payload
   */
  getPayload(): any {
    return this.payload;
  }

  /**
   * Gets the outbox record status
   */
  getStatus(): OUTBOX_STATUSES {
    return this.status;
  }

  /**
   * Gets the creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the processing timestamp
   */
  getProcessedAt(): Date | undefined {
    return this.processedAt;
  }

  /**
   * Gets the error message
   */
  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  /**
   * Gets the retry count
   */
  getRetryCount(): number | undefined {
    return this.retryCount;
  }
}

