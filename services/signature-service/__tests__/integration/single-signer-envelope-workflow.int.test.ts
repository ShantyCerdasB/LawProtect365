/**
 * @file single-signer-envelope-workflow.int.test.ts
 * @summary Single-signer envelope workflow integration tests
 * @description End-to-end integration tests for single-signer envelope workflows where the owner
 * is the only signer. Tests complete document lifecycle from creation to completion.
 * 
 * Test Coverage:
 * - Envelope creation and configuration
 * - Document upload and processing
 * - Owner signing workflow
 * - Document completion and status updates
 * - Signed document download
 * - Complete audit trail verification
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../src/config';
import { createApiGatewayEvent, createTestRequestContext, generateTestPdf } from './helpers/testHelpers';
import { createEnvelopeHandler } from '../../src/handlers/envelopes/CreateEnvelopeHandler';
import { getEnvelopeHandler } from '../../src/handlers/envelopes/GetEnvelopeHandler';
import { signDocumentHandler } from '../../src/handlers/signing/SignDocumentHandler';
import { downloadSignedDocumentHandler } from '../../src/handlers/envelopes/DownloadSignedDocumentHandler';
import { getDocumentHistoryHandler } from '../../src/handlers/audit/GetDocumentHistoryHandler';
import { ServiceFactory } from '../../src/infrastructure/factories/ServiceFactory';
import { EnvelopeService } from '../../src/services/EnvelopeService';

describe('Single-Signer Envelope Workflow Integration Tests', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({
    region: cfg.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test' }
  });

  const ownerUser = {
    userId: `test-owner-${randomUUID()}`,
    email: 'owner@example.com'
  };

  const makeAuthEvent = async (overrides?: any) => {
    const base = await createApiGatewayEvent({ includeAuth: true, requestContext: createTestRequestContext({ userId: ownerUser.userId, email: ownerUser.email, userAgent: 'jest-test/1.0' }) });
    // Override authorizer with owner identity
    (base.requestContext as any).authorizer.userId = ownerUser.userId;
    (base.requestContext as any).authorizer.email = ownerUser.email;
    (base.requestContext as any).authorizer.actor = {
      userId: ownerUser.userId,
      email: ownerUser.email,
      ip: '127.0.0.1',
      userAgent: 'jest-test/1.0',
      roles: ['admin'],
      scopes: []
    };
    const merged = { ...base, ...(overrides || {}) } as any;
    merged.headers = { ...(base.headers || {}), ...((overrides && overrides.headers) || {}) };
    return merged;
  };

  // Helper functions for test workflow
  const setupTestDocument = async (documentId: string) => {
    const documentsTable = process.env.DOCUMENTS_TABLE || 'test-documents';
    const seedClient = (ServiceFactory as any).ddbClient;
    const createdAt = new Date().toISOString();
    
    await seedClient.put({
      TableName: documentsTable,
      Item: {
        pk: `ENVELOPE#seed-envelope-${Date.now()}`,
        sk: `DOCUMENT#${documentId}`,
        type: 'Document',
        documentId,
        envelopeId: `seed-envelope-${Date.now()}`,
        name: 'flattened.pdf',
        status: 'FLATTENED',
        contentType: 'application/pdf',
        size: 1024,
        digest: 'sha256:seed',
        s3Bucket: cfg.s3.signedBucket,
        s3Key: `envelopes/${documentId}/flattened.pdf`,
        createdAt,
        updatedAt: createdAt,
        gsi1pk: `DOCUMENT#${documentId}`,
        gsi1sk: createdAt,
        ownerId: ownerUser.userId
      } as any
    });
  };

  const createTestEnvelope = async (documentId: string) => {
    const envelopeTitle = `Test Envelope ${Date.now()}-${randomUUID()}`;
    const createBody = {
      metadata: {
        title: envelopeTitle,
        description: 'Single owner signer test'
      },
      documentId,
      ownerId: ownerUser.userId,
      signingOrder: 'OWNER_FIRST',
      s3Key: `envelopes/${documentId}/flattened.pdf`,
      signers: [
        {
          email: ownerUser.email,
          fullName: 'Owner Test',
          order: 1
        }
      ]
    };

    const createEvt = await makeAuthEvent({
      body: JSON.stringify(createBody),
      headers: {
        'user-agent': 'jest-test/1.0',
        'x-country': 'CO'
      }
    });
    
    const createRes = await createEnvelopeHandler(createEvt);
    const createResObj = typeof createRes === 'string' ? JSON.parse(createRes) : createRes;
    expect(createResObj.statusCode).toBe(201);
    
    const createParsed = JSON.parse(createResObj.body);
    const createData = (createParsed && (createParsed.data ?? createParsed)) as any;
    let envelopeId = (createData?.envelope?.id ?? createData?.envelopeId ?? createParsed?.envelopeId) as string | undefined;
    
    if (!envelopeId) {
      const svc = ServiceFactory.createEnvelopeService();
      const list = await svc.getUserEnvelopes('test-user-123', 10);
      const last = list.items.at(-1) as any;
      envelopeId = last?.getId?.().getValue?.();
    }
    
    if (!envelopeId) {
      throw new Error('Envelope ID not found after create; response missing envelope.id and fallback list returned none');
    }
    
    return envelopeId;
  };

  const validateEnvelopeAndSigner = async (envelopeId: string) => {
    const getEvt = await makeAuthEvent({
      pathParameters: { envelopeId },
      headers: {
        'user-agent': 'jest-test/1.0',
        'x-country': 'CO'
      }
    });
    
    const getRes = await getEnvelopeHandler(getEvt);
    const getResObj = typeof getRes === 'string' ? JSON.parse(getRes) : getRes;
    expect(getResObj.statusCode).toBe(200);
    
    const getData = JSON.parse(getResObj.body).data;
    expect(getData.envelope.id).toBe(envelopeId);
    const signer = getData.envelope.signers[0];
    expect(signer.email).toBe(ownerUser.email);
    
    return signer;
  };

  const uploadTestDocument = async (envelopeId: string) => {
    const pdfBuffer = generateTestPdf();
    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
    const signatureHash = createHash('sha256').update(`signature:${sha256}`).digest('hex');
    const s3Key = `envelopes/${envelopeId}/signed.pdf`;
    
    await s3.send(new PutObjectCommand({
      Bucket: cfg.s3.signedBucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }));
    
    return { sha256, signatureHash, s3Key };
  };

  const signTestDocument = async (envelopeId: string, signer: any, sha256: string, signatureHash: string, s3Key: string) => {
    const signBody = {
      envelopeId,
      signerId: signer.id,
      documentHash: sha256,
      signatureHash,
      s3Key,
      kmsKeyId: cfg.kms.signerKeyId,
      algorithm: cfg.kms.signingAlgorithm,
      reason: 'Approved',
      location: 'Test Suite',
      consent: {
        given: true,
        timestamp: new Date().toISOString(),
        text: 'I agree to sign electronically',
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test/1.0'
      }
    };
    
    const signEvt = await makeAuthEvent({
      body: JSON.stringify(signBody),
      headers: {
        'user-agent': 'jest-test/1.0',
        'x-country': 'CO'
      }
    });
    
    const signRes = await signDocumentHandler(signEvt);
    const signResObj = typeof signRes === 'string' ? JSON.parse(signRes) : signRes;
    if (signResObj.statusCode !== 200) {
      console.error('Sign document failed:', signResObj);
    }
    expect(signResObj.statusCode).toBe(200);
    
    const signData = JSON.parse(signResObj.body).data;
    expect(signData.signature.id).toBeTruthy();
    expect(signData.envelope.id).toBe(envelopeId);
  };

  const downloadSignedDocument = async (envelopeId: string) => {
    const downloadEvt = await makeAuthEvent({
      pathParameters: { envelopeId },
      queryStringParameters: { expiresIn: '900' },
      headers: {
        'user-agent': 'jest-test/1.0',
        'x-country': 'CO'
      }
    });
    
    const downloadRes = await downloadSignedDocumentHandler(downloadEvt);
    const downloadResObj = typeof downloadRes === 'string' ? JSON.parse(downloadRes) : downloadRes;
    expect(downloadResObj.statusCode).toBe(200);
    
    const downloadData = JSON.parse(downloadResObj.body).data;
    expect(downloadData.downloadUrl).toContain('http');
    expect(downloadData.filename).toBe('signed.pdf');
  };

  const validateAuditTrail = async (envelopeId: string) => {
    const historyEvt = await makeAuthEvent({
      pathParameters: { envelopeId },
      queryStringParameters: { limit: '50' },
      headers: {
        'user-agent': 'jest-test/1.0',
        'x-country': 'CO'
      }
    });
    
    const historyRes = await getDocumentHistoryHandler(historyEvt);
    const historyResObj = typeof historyRes === 'string' ? JSON.parse(historyRes) : historyRes;
    expect(historyResObj.statusCode).toBe(200);
    
    const historyData = JSON.parse(historyResObj.body).data;
    expect(historyData.envelopeId).toBe(envelopeId);
    expect(Array.isArray(historyData.history.events)).toBe(true);
    
    return historyData;
  };

  const validateEventStructure = (events: Array<any>) => {
    expect(events.length).toBeGreaterThanOrEqual(3);
    const types = events.map(e => e.type);
    expect(types).toEqual(expect.arrayContaining([
      'ENVELOPE_CREATED',
      'SIGNATURE_CREATED',
      'ENVELOPE_STATUS_CHANGED'
    ]));
    expect(types).not.toEqual(expect.arrayContaining(['SIGNER_INVITED', 'SIGNER_ADDED']));
    expect(events.filter(e => e.type === 'SIGNATURE_CREATED').length).toBe(1);
  };

  const validateEventFields = (events: Array<any>) => {
    for (const ev of events) {
      expect(typeof ev.id).toBe('string');
      expect(typeof ev.type).toBe('string');
      expect(typeof ev.description).toBe('string');
      expect(typeof ev.timestamp).toBe('string');
      expect(new Date(ev.timestamp).toString()).not.toBe('Invalid Date');
      if (ev.userId !== undefined) expect(typeof ev.userId).toBe('string');
      if (ev.userEmail !== undefined) expect(typeof ev.userEmail).toBe('string');
      
      if (['SIGNATURE_CREATED', 'DOCUMENT_DOWNLOADED', 'ENVELOPE_CREATED', 'ENVELOPE_STATUS_CHANGED'].includes(ev.type)) {
        expect(typeof ev.metadata).toBe('object');
      }
    }
  };

  const validateSpecificEvents = (events: Array<any>) => {
    const dl = events.find(e => e.type === 'DOCUMENT_DOWNLOADED');
    expect(dl.userEmail).toBe(ownerUser.email);
    expect(dl.userAgent).toBe('jest-test/1.0');
    expect(dl.ipAddress).toBeDefined();

    const sigCreated = events.find(e => e.type === 'SIGNATURE_CREATED');
    expect(sigCreated).toBeTruthy();
    expect(sigCreated.metadata.filename).toBe('signed.pdf');
    expect(typeof sigCreated.metadata.s3Key).toBe('string');

    const downloaded = events.find(e => e.type === 'DOCUMENT_DOWNLOADED');
    expect(downloaded).toBeTruthy();
    expect(downloaded.metadata.filename).toBe('signed.pdf');
    expect(typeof downloaded.metadata.contentType).toBe('string');
    if (downloaded.metadata.size !== undefined) expect(typeof downloaded.metadata.size).toBe('number');
  };

  it('should handle complete single-signer envelope workflow from creation to completion', async () => {
    // Setup test environment
    const preEnvService: EnvelopeService = ServiceFactory.createEnvelopeService();
    await preEnvService.getUserEnvelopes(ownerUser.userId, 1).catch(() => Promise.resolve());

    const documentId = randomUUID();
    await setupTestDocument(documentId);

    // Create envelope
    const envelopeId = await createTestEnvelope(documentId);

    // Validate envelope and get signer
    const signer = await validateEnvelopeAndSigner(envelopeId);

    // Upload test document
    const { sha256, signatureHash, s3Key } = await uploadTestDocument(envelopeId);

    // Sign document
    await signTestDocument(envelopeId, signer, sha256, signatureHash, s3Key);

    // Download signed document
    await downloadSignedDocument(envelopeId);

    // Validate audit trail
    const historyData = await validateAuditTrail(envelopeId);
    const events = historyData.history.events as Array<any>;
    
    validateEventStructure(events);
    validateEventFields(events);
    validateSpecificEvents(events);

    expect(historyData.history.envelopeStatus).toBe('COMPLETED');
  }, 120000);
});


