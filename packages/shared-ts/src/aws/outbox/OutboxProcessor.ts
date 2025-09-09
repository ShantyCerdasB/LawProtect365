/**
 * @file OutboxProcessor.ts
 * @summary Worker for processing outbox events
 * @description Processes pending outbox events and publishes them to EventBridge
 */

import type { OutboxPort, OutboxRecord, EventBusPort } from "../../index.js";

export interface OutboxProcessorOptions {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  maxRetries: number;
  retryDelayMs: number;
  debug: boolean;
}

export interface OutboxProcessingResult {
  eventId: string;
  success: boolean;
  error?: string;
  attempts: number;
  durationMs: number;
}

export interface OutboxBatchProcessingResult {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  results: OutboxProcessingResult[];
  totalDurationMs: number;
}

/**
 * AWS metrics service interface
 */
export interface AwsMetricsService {
  incrementCounter(name: string): Promise<void>;
  recordDuration(name: string, value: number): Promise<void>;
  putMetrics(metrics: Array<{ name: string; value: number; unit: string }>): Promise<void>;
}

export class OutboxProcessor {
  private readonly outboxRepository: OutboxPort;
  private readonly eventBus: EventBusPort;
  private readonly options: OutboxProcessorOptions;
  private readonly metrics: AwsMetricsService;
  private isRunning = false;

  constructor(
    outboxRepository: OutboxPort,
    eventBus: EventBusPort,
    options: OutboxProcessorOptions,
    metrics: AwsMetricsService
  ) {
    this.outboxRepository = outboxRepository;
    this.eventBus = eventBus;
    this.options = options;
    this.metrics = metrics;
  }

  /**
   * Starts the outbox processor in a continuous loop.
   */
  async startProcessing(): Promise<void> {
    if (this.isRunning) {
      throw new Error("OutboxProcessor is already running");
    }

    this.isRunning = true;
    this.log("Starting outbox processor", { options: this.options });

    try {
      while (this.isRunning) {
        await this.processBatch();
        
        // Wait before processing next batch
        if (this.isRunning) {
          await this.sleep(this.options.maxWaitTimeMs);
        }
      }
    } catch (error) {
      this.log("Error in outbox processor loop", { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stops the outbox processor.
   */
  stopProcessing(): void {
    this.isRunning = false;
    this.log("Stopping outbox processor");
  }

  /**
   * Processes a single batch of pending events.
   */
  async processBatch(): Promise<OutboxBatchProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Pull pending events
      const events = await this.outboxRepository.pullPending(this.options.maxBatchSize);
      
      if (events.length === 0) {
        return {
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          results: [],
          totalDurationMs: Date.now() - startTime,
        };
      }

      this.log("Processing batch", { eventCount: events.length });

      // Process each event
      const results: OutboxProcessingResult[] = [];
      let successfulCount = 0;
      let failedCount = 0;

      for (const event of events) {
        const result = await this.processEvent(event);
        results.push(result);
        
        if (result.success) {
          successfulCount++;
        } else {
          failedCount++;
        }
      }

      const totalDuration = Date.now() - startTime;

      // Send metrics
      await this.sendBatchMetrics(events.length, successfulCount, failedCount, totalDuration);

      const batchResult: OutboxBatchProcessingResult = {
        totalEvents: events.length,
        successfulEvents: successfulCount,
        failedEvents: failedCount,
        results,
        totalDurationMs: totalDuration,
      };

      this.log("Batch completed", { ...batchResult });
      return batchResult;

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.log("Batch processing failed", { error, durationMs: totalDuration });
      
      // Send error metrics
      await this.metrics.incrementCounter("outbox.batch.errors");
      
      throw error;
    }
  }

  /**
   * Processes a single outbox event.
   */
  private async processEvent(event: OutboxRecord): Promise<OutboxProcessingResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: string | undefined;

    try {
      // Try to publish the event
      await this.eventBus.publish([{
        type: event.type,
        payload: event.payload,
        id: event.id,
        occurredAt: event.occurredAt,
      }]);

      // Mark as dispatched
      await this.outboxRepository.markDispatched(event.id);

      const duration = Date.now() - startTime;
      
      // Send success metrics
      await this.metrics.incrementCounter("outbox.events.processed");
      await this.metrics.recordDuration("outbox.processing.duration", duration);

      return {
        eventId: event.id,
        success: true,
        attempts: attempts + 1,
        durationMs: duration,
      };

    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error.message : String(error);
      
      // Mark as failed if max retries reached
      if (attempts >= this.options.maxRetries) {
        await this.outboxRepository.markFailed(event.id, lastError);
        
        // Send failure metrics
        await this.metrics.incrementCounter("outbox.events.failed");
        await this.metrics.incrementCounter("outbox.events.max_retries_exceeded");
      }

      const duration = Date.now() - startTime;
      
      // Send retry metrics
      await this.metrics.incrementCounter("outbox.events.retries");
      await this.metrics.recordDuration("outbox.retry.duration", duration);

      return {
        eventId: event.id,
        success: false,
        error: lastError,
        attempts,
        durationMs: duration,
      };
    }
  }

  /**
   * Sends batch processing metrics to CloudWatch.
   */
  private async sendBatchMetrics(
    totalEvents: number,
    successfulEvents: number,
    failedEvents: number,
    durationMs: number
  ): Promise<void> {
    const metrics = [
      { name: "outbox.batch.size", value: totalEvents, unit: "Count" as const },
      { name: "outbox.batch.successful", value: successfulEvents, unit: "Count" as const },
      { name: "outbox.batch.failed", value: failedEvents, unit: "Count" as const },
      { name: "outbox.batch.duration", value: durationMs, unit: "Milliseconds" as const },
    ];

    await this.metrics.putMetrics(metrics);
  }

  /**
   * Logs messages with optional context.
   */
  private log(message: string, context?: Record<string, unknown>): void {
    if (this.options.debug) {
      console.log(`[OutboxProcessor] ${message}`, context);
    }
  }

  /**
   * Sleep utility function.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 






