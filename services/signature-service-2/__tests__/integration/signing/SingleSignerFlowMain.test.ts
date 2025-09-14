/**
 * SingleSignerFlowMain.test.ts
 * 
 * Description: Main single signer signing flow integration test
 * Summary: Tests the complete happy path workflow where the owner creates and signs the envelope.
 * This is the core test that validates the main business flow.
 */

import { 
  createSingleSignerFlow,
  type SigningFlowResult
} from '../helpers/signingFlowFactory';

describe('Single Signer Flow - Main Happy Path', () => {
  let flowResult: SigningFlowResult;

  beforeAll(async () => {
    // Test setup - no tenant ID needed
  });

  beforeEach(async () => {
    // Test isolation handled by DynamoDB Local
  });

  describe('Happy Path - Single Signer Workflow', () => {
    it('should complete single signer workflow with authenticated owner', async () => {
      // Use the factory to create the complete flow
      flowResult = await createSingleSignerFlow('Single Signer Test Contract');
      
      // Verify the flow was completed successfully
      expect(flowResult.envelope.name).toBe('Single Signer Test Contract');
      expect(flowResult.parties).toHaveLength(1);
      expect(flowResult.parties[0].email).toBe('owner@test.com');
      expect(flowResult.owner.email).toBe('owner@test.com');
      expect(flowResult.invitedUsers).toHaveLength(0);
      
      // Verify envelope was created successfully
      expect(flowResult.envelope.id).toBeDefined();
      expect(flowResult.envelope.name).toBe('Single Signer Test Contract');
      
      // Verify party was created successfully
      expect(flowResult.parties[0].id).toBeDefined();
      expect(flowResult.parties[0].role).toBe('signer');
      expect(flowResult.parties[0].email).toBe('owner@test.com');
      
      // Verify owner was created successfully
      expect(flowResult.owner.id).toBeDefined();
      expect(flowResult.owner.email).toBe('owner@test.com');
      expect(flowResult.owner.token).toBeDefined();
      
      // Verify no invited users (single signer flow)
      expect(flowResult.invitedUsers).toHaveLength(0);
      expect(flowResult.invitationTokens).toEqual({});

      // Download signed PDF
      const { downloadSignedDocument } = await import('../helpers/signingFlowFactory');
      const body = await downloadSignedDocument(flowResult.envelope.id, flowResult.owner.token);
      expect(body).toBeDefined();

      // Validate outbox and audit records
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
      const { S3Client, HeadObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const dynamoClient = new DynamoDBClient({
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
        region: 'us-east-1',
        credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' }
      });
      const doc = DynamoDBDocumentClient.from(dynamoClient);

      // Helper: tiny retry to handle eventual consistency
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

      // Outbox: consent recorded (supporting underscore and dot variants)
      {
        let found = false;
        for (let i = 0; i < 10 && !found; i++) {
          const res1 = await doc.send(new ScanCommand({
            TableName: process.env.OUTBOX_TABLE || 'test-outbox',
            FilterExpression: '#eventType = :t AND #payload.#envelopeId = :id',
            ExpressionAttributeNames: { '#eventType': 'eventType', '#payload': 'payload', '#envelopeId': 'envelopeId' },
            ExpressionAttributeValues: { ':t': 'signing.consent_recorded', ':id': flowResult.envelope.id }
          }));

          const res2 = await doc.send(new ScanCommand({
            TableName: process.env.OUTBOX_TABLE || 'test-outbox',
            FilterExpression: '#eventType = :t AND #payload.#envelopeId = :id',
            ExpressionAttributeNames: { '#eventType': 'eventType', '#payload': 'payload', '#envelopeId': 'envelopeId' },
            ExpressionAttributeValues: { ':t': 'signing.consent.recorded', ':id': flowResult.envelope.id }
          }));

          found = ((res1.Items || []).length > 0) || ((res2.Items || []).length > 0);
          if (!found) await wait(150);
        }
        expect(found).toBe(true);
      }

      // Outbox: signing completed
      {
        let found = false;
        for (let i = 0; i < 10 && !found; i++) {
          const res = await doc.send(new ScanCommand({
            TableName: process.env.OUTBOX_TABLE || 'test-outbox',
            FilterExpression: '#eventType = :t AND #payload.#envelopeId = :id',
            ExpressionAttributeNames: { '#eventType': 'eventType', '#payload': 'payload', '#envelopeId': 'envelopeId' },
            ExpressionAttributeValues: { ':t': 'signing.completed', ':id': flowResult.envelope.id }
          }));
          found = ((res.Items || []).length > 0);
          if (!found) await wait(150);
        }
        expect(found).toBe(true);
      }

      // Audit: signing completed
      {
        let found = false;
        for (let i = 0; i < 10 && !found; i++) {
          const res = await doc.send(new ScanCommand({
            TableName: process.env.AUDIT_TABLE || 'test-audit',
            FilterExpression: '#envelopeId = :id',
            ExpressionAttributeNames: { '#envelopeId': 'envelopeId' },
            ExpressionAttributeValues: { ':id': flowResult.envelope.id }
          }));
          found = ((res.Items || []).length > 0);
          if (!found) await wait(150);
        }
        expect(found).toBe(true);
      }

      // S3: verify final signed artifact exists and is readable from LocalStack
      {
        const bucketName = process.env.SIGNED_BUCKET || 'test-signed';
        const objectKey = `envelopes/${flowResult.envelope.id}/signed/document.pdf`;
        const s3 = new S3Client({
          endpoint: 'http://localhost:4566',
          region: 'us-east-1',
          credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
          forcePathStyle: true
        });

        const head = await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: objectKey }));
        expect(head.$metadata.httpStatusCode).toBe(200);
        expect((head.ContentLength ?? 0) > 0).toBe(true);

        const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
        // Node stream: ensure Body exists
        expect(obj.Body).toBeDefined();
      }

      // Certificate: verify certificate endpoint returns data
      {
        const { GetCertificateController } = await import('../../../src/presentation/controllers/certificate/GetCertificate.Controller');
        const { createApiGatewayEvent } = await import('../helpers/testHelpers');
        const { assertResponse } = await import('../helpers/signingFlowFactory');
        const res = await GetCertificateController(await createApiGatewayEvent({
          pathParameters: { id: flowResult.envelope.id },
          queryStringParameters: { limit: '10' }
        }));
        const r = assertResponse(res);
        expect(r.statusCode).toBe(200);
        expect(r.body).toBeDefined();
      }

      // Audit trail endpoint is validated indirectly via DDB assertions above
    });
  });
});
