/**
 * @fileoverview AwsClientAdapters - Adapters for AWS clients in Lambda functions
 * @summary Adapters that wrap native AWS clients to implement required interfaces
 * @description Provides adapters for AWS clients used in Lambda functions,
 * implementing the interfaces required by the outbox pattern and event publishing.
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand, QueryCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DdbClientLike } from '../../aws/ddb.js';
import type { 
  EventBridgeAdapterClient, 
  EventBridgeAdapterEntry, 
  EventBridgeAdapterPutEventsResponse 
} from '../../aws/eventbridge/EventBridgeConfig.js';

/**
 * DynamoDB client adapter that implements DdbClientLike interface
 * 
 * This adapter wraps the native DynamoDBClient to provide the interface
 * expected by the OutboxRepository and other DynamoDB operations.
 */
export class DynamoDBClientAdapter implements DdbClientLike {
  constructor(private readonly client: DynamoDBClient) {}

  async get(params: {
    TableName: string;
    Key: Record<string, AttributeValue>;
    ConsistentRead?: boolean;
  }): Promise<{ Item?: Record<string, AttributeValue> }> {
    const command = new GetItemCommand({
      TableName: params.TableName,
      Key: params.Key,
      ConsistentRead: params.ConsistentRead
    });
    const result = await this.client.send(command);
    return { Item: result.Item };
  }

  async put(params: {
    TableName: string;
    Item: Record<string, AttributeValue>;
    ConditionExpression?: string;
  }): Promise<void> {
    const command = new PutItemCommand({
      TableName: params.TableName,
      Item: params.Item,
      ConditionExpression: params.ConditionExpression
    });
    await this.client.send(command);
  }

  async delete(params: {
    TableName: string;
    Key: Record<string, AttributeValue>;
    ConditionExpression?: string;
  }): Promise<void> {
    const command = new DeleteItemCommand({
      TableName: params.TableName,
      Key: params.Key,
      ConditionExpression: params.ConditionExpression
    });
    await this.client.send(command);
  }

  async update(params: {
    TableName: string;
    Key: Record<string, AttributeValue>;
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, AttributeValue>;
    ConditionExpression?: string;
  }): Promise<{ Attributes?: Record<string, AttributeValue> }> {
    const command = new UpdateItemCommand({
      TableName: params.TableName,
      Key: params.Key,
      UpdateExpression: params.UpdateExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: params.ExpressionAttributeValues,
      ConditionExpression: params.ConditionExpression
    });
    const result = await this.client.send(command);
    return { Attributes: result.Attributes };
  }

  async query(params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, AttributeValue>;
    IndexName?: string;
    Limit?: number;
    ExclusiveStartKey?: Record<string, AttributeValue>;
  }): Promise<{ Items?: Record<string, AttributeValue>[]; LastEvaluatedKey?: Record<string, AttributeValue> }> {
    const command = new QueryCommand({
      TableName: params.TableName,
      KeyConditionExpression: params.KeyConditionExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: params.ExpressionAttributeValues,
      IndexName: params.IndexName,
      Limit: params.Limit,
      ExclusiveStartKey: params.ExclusiveStartKey
    });
    const result = await this.client.send(command);
    return { 
      Items: result.Items, 
      LastEvaluatedKey: result.LastEvaluatedKey 
    };
  }
}

/**
 * EventBridge client adapter that implements EventBridgeAdapterClient interface
 * 
 * This adapter wraps the native EventBridgeClient to provide the interface
 * expected by the EventBridgeAdapter.
 */
export class EventBridgeClientAdapter implements EventBridgeAdapterClient {
  constructor(private readonly client: EventBridgeClient) {}

  async putEvents(params: {
    Entries: EventBridgeAdapterEntry[];
  }): Promise<EventBridgeAdapterPutEventsResponse> {
    const command = new PutEventsCommand({
      Entries: params.Entries
    });
    const result = await this.client.send(command);
    return {
      FailedEntryCount: result.FailedEntryCount,
      Entries: result.Entries?.map(entry => ({
        ErrorCode: entry.ErrorCode,
        ErrorMessage: entry.ErrorMessage
      }))
    };
  }
}
