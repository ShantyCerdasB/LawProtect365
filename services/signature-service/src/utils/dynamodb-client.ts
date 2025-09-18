/**
 * @fileoverview DynamoDB client factory - Creates DynamoDB client from config
 * @summary Factory for creating DynamoDB client instances
 * @description Creates DynamoDB client instances based on configuration
 * for different environments (local, development, production).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { DdbClientLike } from '@lawprotect/shared-ts';
import type { DynamoDBConfig } from '../config/AppConfig';

/**
 * Creates a DynamoDB client from configuration
 * 
 * @param config - DynamoDB configuration
 * @returns DynamoDB client instance
 */
export function createDynamoDBClient(config: DynamoDBConfig): DdbClientLike {
  const clientConfig: any = {
    region: config.region
  };

  // Add local configuration if needed
  if (config.useLocal && config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.credentials = config.credentials;
  }

  // Create low-level client
  const client = new DynamoDBClient(clientConfig);
  
  // Create document client (higher-level) with safer marshalling to strip undefineds
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true
    }
  });

  // Adapter that implements DdbClientLike API using DocumentClient commands
  const adapter: DdbClientLike = {
    async get(params: { TableName: string; Key: Record<string, unknown>; ConsistentRead?: boolean; }) {
      const res = await docClient.send(new GetCommand(params as any));
      return { Item: res.Item as Record<string, unknown> | undefined };
    },
    async put(params: { TableName: string; Item: Record<string, unknown>; ConditionExpression?: string; }) {
      await docClient.send(new PutCommand(params as any));
      return {};
    },
    async delete(params: { TableName: string; Key: Record<string, unknown>; ConditionExpression?: string; }) {
      await docClient.send(new DeleteCommand(params as any));
      return {};
    },
    async update(params: { TableName: string; Key: Record<string, unknown>; UpdateExpression: string; ExpressionAttributeNames?: Record<string, string>; ExpressionAttributeValues?: Record<string, unknown>; ConditionExpression?: string; ReturnValues?: 'ALL_NEW' | 'ALL_OLD' | 'UPDATED_NEW' | 'UPDATED_OLD' | 'NONE'; }) {
      const res = await docClient.send(new UpdateCommand(params as any));
      return { Attributes: res.Attributes as Record<string, unknown> | undefined };
    },
    async query(params: { TableName: string; IndexName?: string; KeyConditionExpression: string; ExpressionAttributeNames?: Record<string, string>; ExpressionAttributeValues?: Record<string, unknown>; Limit?: number; ScanIndexForward?: boolean; ExclusiveStartKey?: Record<string, unknown>; FilterExpression?: string; }) {
      const res = await docClient.send(new QueryCommand(params as any));
      return {
        Items: (res.Items as Array<Record<string, unknown>> | undefined) ?? [],
        LastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined
      };
    }
  };

  return adapter;
}
