/**
 * @file OutboxWorker.ts
 * @summary Lambda worker for processing outbox events
 * @description Processes pending outbox events and publishes them to EventBridge
 */

import { logger } from "../../index.js";

/**
 * @summary Configuration for outbox processing
 */
interface OutboxWorkerConfig {
  /** Maximum number of events to process in a single run */
  maxBatchSize: number;
  /** Whether to continue processing if errors occur */
  continueOnError: boolean;
}

/**
 * @summary Default configuration for outbox worker
 */
const DEFAULT_CONFIG: OutboxWorkerConfig = {
  maxBatchSize: 100,
  continueOnError: true};

/**
 * @summary Lambda handler for outbox event processing
 * @description Processes pending outbox events and publishes them to EventBridge
 * @param event - Lambda event (can be empty for scheduled execution)
 * @param context - Lambda context
 * @returns Processing result with statistics
 */
export const outboxProcessor = async (
  _event: any = {},
  context: any = {}
): Promise<{
  statusCode: number;
  body: {
    processed: number;
    failed: number;
    duration: number;
    timestamp: string;
  };
}> => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    logger.info("Starting outbox processing", {
      requestId: context.awsRequestId,
      timestamp,
      config: DEFAULT_CONFIG});

    // Note: This worker needs to be customized per service to get the container
    // Implementation should inject the event publisher via the constructor
    // For now, we'll simulate successful processing
    logger.warn("OutboxWorker using default implementation - should be customized per service");
    
    // Simulate processing
    const processedCount = 0; // Would be actual count from dispatch
    const failedCount = 0;
    
    const duration = Date.now() - startTime;
    
    logger.info("Outbox processing completed", {
      requestId: context.awsRequestId,
      duration,
      timestamp});

    return {
      statusCode: 200,
      body: {
        processed: processedCount,
        failed: failedCount,
        duration,
        timestamp}};

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Outbox processing failed", {
      requestId: context.awsRequestId,
      error: error instanceof Error ? error.message : String(error),
      duration,
      timestamp});

    if (DEFAULT_CONFIG.continueOnError) {
      return {
        statusCode: 500,
        body: {
          processed: 0,
          failed: 1,
          duration,
          timestamp}};
    }

    throw error;
  }
};

/**
 * @summary Handler for manual testing and development
 * @description Allows manual execution of outbox processing
 */
export const handler = outboxProcessor;

