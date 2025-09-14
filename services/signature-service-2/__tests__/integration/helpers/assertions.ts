/**
 * @file assertions.ts
 * @summary Shared assertion helpers for integration tests
 * @description DynamoDB/S3 polling utilities to validate outbox, audit and final artifacts without duplicating code.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const dynamoClient = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' }
});
const doc = DynamoDBDocumentClient.from(dynamoClient);

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function waitForOutboxEvent(envelopeId: string, eventType: string, retries = 10, delayMs = 150): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const res = await doc.send(new ScanCommand({
      TableName: process.env.OUTBOX_TABLE || 'test-outbox',
      FilterExpression: '#eventType = :t AND #payload.#envelopeId = :id',
      ExpressionAttributeNames: { '#eventType': 'eventType', '#payload': 'payload', '#envelopeId': 'envelopeId' },
      ExpressionAttributeValues: { ':t': eventType, ':id': envelopeId }
    }));
    if ((res.Items || []).length > 0) return;
    await wait(delayMs);
  }
  throw new Error(`Outbox event not found: ${eventType} for envelope ${envelopeId}`);
}

export async function waitForOutboxEvents(envelopeId: string, eventTypes: string[], retries = 10, delayMs = 150): Promise<void> {
  for (const type of eventTypes) {
    await waitForOutboxEvent(envelopeId, type, retries, delayMs);
  }
}

export async function waitForAuditRecords(envelopeId: string, minCount = 1, retries = 10, delayMs = 150): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const res = await doc.send(new ScanCommand({
      TableName: process.env.AUDIT_TABLE || 'test-audit',
      FilterExpression: '#envelopeId = :id',
      ExpressionAttributeNames: { '#envelopeId': 'envelopeId' },
      ExpressionAttributeValues: { ':id': envelopeId }
    }));
    if ((res.Items || []).length >= minCount) return;
    await wait(delayMs);
  }
  throw new Error(`Audit records not found for envelope ${envelopeId} (min ${minCount})`);
}

export async function expectS3HasFinalPdf(envelopeId: string): Promise<void> {
  const bucketName = process.env.SIGNED_BUCKET || 'test-signed';
  const objectKey = `envelopes/${envelopeId}/signed/document.pdf`;
  const s3 = new S3Client({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true
  });
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }));
  if (head.$metadata.httpStatusCode !== 200) {
    throw new Error(`HeadObject did not return 200 for ${bucketName}/${objectKey}`);
  }
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
  if (!obj.Body) {
    throw new Error(`GetObject returned no Body for ${bucketName}/${objectKey}`);
  }
}


