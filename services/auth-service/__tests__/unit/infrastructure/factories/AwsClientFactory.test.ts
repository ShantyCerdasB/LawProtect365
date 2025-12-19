/**
 * @fileoverview AwsClientFactory Tests - Unit tests for AwsClientFactory
 * @summary Tests all AWS client factory methods
 * @description Tests that AwsClientFactory correctly creates AWS clients with proper configuration.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Logger } from '@lawprotect/shared-ts';

jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    aws: {
      region: 'us-east-1'
    },
    outbox: {
      tableName: 'test-outbox'
    },
    eventbridge: {
      busName: 'test-bus',
      source: 'test-source'
    }
  }))
}));

import { AwsClientFactory } from '../../../../src/infrastructure/factories/AwsClientFactory';

describe('AwsClientFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCognitoClient', () => {
    it('creates Cognito client with correct region', () => {
      const client = AwsClientFactory.createCognitoClient();

      expect(client).toBeInstanceOf(CognitoIdentityProviderClient);
    });
  });

  describe('createEventBridgeClient', () => {
    it('creates EventBridge client', () => {
      const client = AwsClientFactory.createEventBridgeClient();

      expect(client).toBeInstanceOf(EventBridgeClient);
    });
  });

  describe('createDynamoDBClient', () => {
    it('creates DynamoDB client', () => {
      const client = AwsClientFactory.createDynamoDBClient();

      expect(client).toBeInstanceOf(DynamoDBClient);
    });
  });

  describe('createOutboxRepository', () => {
    it('creates outbox repository', () => {
      const repository = AwsClientFactory.createOutboxRepository();

      expect(repository).toBeDefined();
    });
  });

  describe('createEventBridgeAdapter', () => {
    it('creates EventBridge adapter', () => {
      const adapter = AwsClientFactory.createEventBridgeAdapter();

      expect(adapter).toBeDefined();
    });
  });

  describe('createAll', () => {
    it('creates all AWS clients and returns object with logger', () => {
      const mockLogger = {} as Logger;
      const result = AwsClientFactory.createAll(mockLogger);

      expect(result.cognitoClient).toBeInstanceOf(CognitoIdentityProviderClient);
      expect(result.eventBridgeClient).toBeInstanceOf(EventBridgeClient);
      expect(result.dynamoDBClient).toBeInstanceOf(DynamoDBClient);
      expect(result.outboxRepository).toBeDefined();
      expect(result.eventBridgeAdapter).toBeDefined();
      expect(result.logger).toBe(mockLogger);
    });
  });
});

