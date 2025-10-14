/**
 * @fileoverview LambdaTriggerBase - Generic base class for Lambda triggers
 * @summary Provides common functionality for all Lambda triggers across microservices
 * @description This base class handles common patterns like logging, error handling, and request ID extraction for Lambda triggers
 */

import { LambdaTriggerEvent } from './types/LambdaTriggerEvent';

/**
 * Abstract base class for Lambda triggers that provides common functionality
 * @template TEvent - The input event type
 * @template TResult - The output result type
 */
export abstract class LambdaTriggerBase<TEvent extends LambdaTriggerEvent, TResult> {
  /**
   * Process the Lambda trigger event
   * @param event - The Lambda trigger event
   * @returns Promise that resolves to the trigger result
   */
  protected abstract processEvent(event: TEvent): Promise<TResult>;

  /**
   * Main handler method that wraps the trigger logic
   * @param event - The Lambda trigger event
   * @returns Promise that resolves to the trigger result
   */
  async handler(event: TEvent): Promise<TResult> {
    const logger = this.createLogger(this.getRequestId(event));
    
    try {
      return await this.processEvent(event);
    } catch (error) {
      this.handleError(error, logger);
      throw error; // Re-throw to ensure Lambda knows the trigger failed
    }
  }

  /**
   * Extract request ID from the event for logging purposes
   * @param event - The Lambda trigger event
   * @returns Request ID if available, undefined otherwise
   */
  protected abstract getRequestId(event: TEvent): string | undefined;

  /**
   * Create a logger instance with request ID context
   * @param requestId - Optional request ID for context
   * @returns Logger instance
   */
  private createLogger(requestId?: string) {
    return {
      info: (message: string, ...args: any[]) => 
        console.log(`[INFO] [${requestId || 'N/A'}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => 
        console.warn(`[WARN] [${requestId || 'N/A'}] ${message}`, ...args),
      error: (message: string, ...args: any[]) => 
        console.error(`[ERROR] [${requestId || 'N/A'}] ${message}`, ...args),
    };
  }

  /**
   * Handle errors that occur during trigger processing
   * @param error - The error that occurred
   * @param logger - Logger instance for error reporting
   */
  private handleError(error: unknown, logger: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    logger.error(`Lambda Trigger failed: ${errorMessage}`, { 
      stack: errorStack,
      name: errorName 
    });
    // Optionally, emit CloudWatch metrics or send alerts here
  }
}
