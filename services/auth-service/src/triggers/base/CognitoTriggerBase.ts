/**
 * @fileoverview CognitoTriggerBase - Base class for Cognito trigger handlers
 * @summary Abstract base class providing common functionality for all Cognito triggers
 * @description
 * Provides a template method pattern implementation for Cognito trigger handlers,
 * centralizing common concerns like dependency injection, logging, error handling,
 * and event data extraction. Subclasses implement the specific orchestration logic.
 */

import { LambdaTriggerBase, type LambdaTriggerEvent } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../factories/OrchestratorFactory';
import { mapPreAuthEvent, mapPostAuthEvent, mapPostConfirmationEvent, mapPreTokenGenEvent } from '../mappers/CognitoEventMapper';
import { CognitoEventData } from '../../domain/value-objects/CognitoEventData';
import type { PreAuthEvent } from '../../types/cognito/PreAuthEvent';
import type { PostAuthEvent } from '../../types/cognito/PostAuthEvent';
import type { PostConfirmationEvent } from '../../types/cognito/PostConfirmationEvent';
import type { PreTokenGenEvent } from '../../types/cognito/PreTokenGenEvent';

/**
 * @description Base class for Cognito trigger handlers with common functionality.
 * @template TEvent - Type of the Cognito trigger event (must extend LambdaTriggerEvent)
 * @template TResult - Type of the trigger result
 */
export abstract class CognitoTriggerBase<TEvent extends LambdaTriggerEvent, TResult> extends LambdaTriggerBase<TEvent, TResult> {
  protected compositionRoot!: CompositionRoot;
  protected orchestratorFactory!: OrchestratorFactory;

  /**
   * @description Template method that processes the Cognito trigger event.
   * @param {TEvent} event - The Cognito trigger event
   * @returns {Promise<TResult>} Promise that resolves to the processed result
   */
  protected async processEvent(event: TEvent): Promise<TResult> {
    this.compositionRoot = await CompositionRoot.build();
    this.orchestratorFactory = new OrchestratorFactory(this.compositionRoot);

    const eventData = this.mapEvent(event);
    this.logger.info(`Processing ${this.getTriggerName()} for user: ${eventData.cognitoSub}`, {
      cognitoSub: eventData.cognitoSub,
      requestId: eventData.requestId
    });

    try {
      const result = await this.processOrchestration(event, eventData);
      
      this.logger.info(`${this.getTriggerName()} completed for user: ${eventData.cognitoSub}`, {
        cognitoSub: eventData.cognitoSub,
        requestId: eventData.requestId
      });

      return result;
    } catch (error) {
      this.logger.error(`${this.getTriggerName()} failed for user: ${eventData.cognitoSub}`, {
        cognitoSub: eventData.cognitoSub,
        requestId: eventData.requestId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * @description Extracts request ID from the event for tracing.
   * @param {TEvent} event - The Cognito trigger event
   * @returns {string | undefined} Request ID if available
   */
  protected getRequestId(event: TEvent): string | undefined {
    const eventData = this.mapEvent(event);
    return eventData.requestId;
  }

  /**
   * @description Maps the Cognito event to CognitoEventData value object.
   * @param {TEvent} event - The Cognito trigger event
   * @returns {CognitoEventData} Extracted event data
   */
  protected mapEvent(event: TEvent): CognitoEventData {
    if (this.isPreAuthEvent(event)) {
      return mapPreAuthEvent(event as unknown as PreAuthEvent);
    }
    if (this.isPostAuthEvent(event)) {
      return mapPostAuthEvent(event as unknown as PostAuthEvent);
    }
    if (this.isPostConfirmationEvent(event)) {
      return mapPostConfirmationEvent(event as unknown as PostConfirmationEvent);
    }
    if (this.isPreTokenGenEvent(event)) {
      return mapPreTokenGenEvent(event as unknown as PreTokenGenEvent);
    }
    throw new Error('Unknown event type');
  }

  /**
   * @description Processes the orchestration logic for the specific trigger.
   * @param {TEvent} event - The Cognito trigger event
   * @param {CognitoEventData} eventData - Extracted event data
   * @returns {Promise<TResult>} Promise that resolves to the processed result
   */
  protected abstract processOrchestration(event: TEvent, eventData: CognitoEventData): Promise<TResult>;

  /**
   * @description Gets the name of the trigger for logging purposes.
   * @returns {string} Trigger name
   */
  protected abstract getTriggerName(): string;

  /**
   * @description Type guard to check if event is a PreAuthEvent.
   * @param {TEvent} event - Event to check
   * @returns {boolean} True if event is PreAuthEvent
   */
  private isPreAuthEvent(event: TEvent): boolean {
    return 'request' in (event as Record<string, unknown>) && 
           'userAttributes' in ((event as Record<string, unknown>).request as Record<string, unknown>);
  }

  /**
   * @description Type guard to check if event is a PostAuthEvent.
   * @param {TEvent} event - Event to check
   * @returns {boolean} True if event is PostAuthEvent
   */
  private isPostAuthEvent(event: TEvent): boolean {
    const e = event as Record<string, unknown>;
    return 'triggerSource' in e && typeof e.triggerSource === 'string' && e.triggerSource.includes('PostAuthentication');
  }

  /**
   * @description Type guard to check if event is a PostConfirmationEvent.
   * @param {TEvent} event - Event to check
   * @returns {boolean} True if event is PostConfirmationEvent
   */
  private isPostConfirmationEvent(event: TEvent): boolean {
    const e = event as Record<string, unknown>;
    return 'request' in e && 'userAttributes' in (e.request as Record<string, unknown>);
  }

  /**
   * @description Type guard to check if event is a PreTokenGenEvent.
   * @param {TEvent} event - Event to check
   * @returns {boolean} True if event is PreTokenGenEvent
   */
  private isPreTokenGenEvent(event: TEvent): boolean {
    const e = event as Record<string, unknown>;
    return 'request' in e && 'groupConfiguration' in (e.request as Record<string, unknown>);
  }

  /**
   * @description Gets the logger instance from composition root.
   * @returns Logger instance
   */
  protected get logger() {
    return this.compositionRoot.logger;
  }
}

