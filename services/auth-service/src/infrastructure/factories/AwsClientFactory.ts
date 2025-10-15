/**
 * @fileoverview AwsClientFactory - Factory for AWS service clients
 * @summary Creates and configures AWS service clients
 * @description Manages AWS client creation and configuration for external service dependencies.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * AWS client instantiation and configuration.
 */

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  EventServiceFactory,
  OutboxRepository,
  EventBridgeAdapter,
  EventPublisherService,
  DynamoDBClientAdapter,
  EventBridgeClientAdapter,
  Logger,
} from '@lawprotect/shared-ts';

import { loadConfig } from '../../config/AppConfig';

/**
 * Factory responsible for creating all AWS service clients.
 * Follows the Single Responsibility Principle by focusing exclusively on AWS client creation.
 */
export class AwsClientFactory {
  private static readonly config = loadConfig();

  /**
   * Creates Cognito Identity Provider client
   * @returns Configured CognitoIdentityProviderClient instance
   */
  static createCognitoClient(): CognitoIdentityProviderClient {
    return new CognitoIdentityProviderClient({
      region: this.config.aws.region,
    });
  }

  /**
   * Creates EventBridge client
   * @returns Configured EventBridgeClient instance
   */
  static createEventBridgeClient(): EventBridgeClient {
    return new EventBridgeClient({
      region: this.config.aws.region,
    });
  }

  /**
   * Creates DynamoDB client
   * @returns Configured DynamoDBClient instance
   */
  static createDynamoDBClient(): DynamoDBClient {
    return new DynamoDBClient({
      region: this.config.aws.region,
    });
  }

  /**
   * Creates outbox repository for event publishing
   * @returns Configured OutboxRepository instance
   */
  static createOutboxRepository(): OutboxRepository {
    const dynamoDbClient = this.createDynamoDBClient();
    const ddbAdapter = new DynamoDBClientAdapter(dynamoDbClient);
    return EventServiceFactory.createOutboxRepository(this.config.outbox.tableName, ddbAdapter);
  }

  /**
   * Creates EventBridge adapter for integration events
   * @returns Configured EventBridgeAdapter instance
   */
  static createEventBridgeAdapter(): EventBridgeAdapter {
    const eventBridgeClient = this.createEventBridgeClient();
    const eventBridgeAdapter = new EventBridgeClientAdapter(eventBridgeClient);
    return EventServiceFactory.createEventBridgeAdapter(
      {
        busName: this.config.eventbridge.busName,
        source: this.config.eventbridge.source,
      },
      eventBridgeAdapter
    );
  }

  /**
   * Creates EventPublisherService using Outbox and EventBridge
   * @returns Configured EventPublisherService instance
   */
  static createEventPublisherService(): EventPublisherService {
    return EventServiceFactory.createEventPublisherService({
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
    });
  }

  /**
   * Creates all AWS clients in a single operation
   * @returns Object containing all AWS client instances
   */
  static createAll(logger: Logger) {
    return {
      cognitoClient: this.createCognitoClient(),
      eventBridgeClient: this.createEventBridgeClient(),
      dynamoDBClient: this.createDynamoDBClient(),
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
      eventPublisherService: this.createEventPublisherService(),
      logger,
    };
  }
}
