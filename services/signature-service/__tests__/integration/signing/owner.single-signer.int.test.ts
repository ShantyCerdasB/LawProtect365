/**
 * @file owner.single-signer.int.test.ts
 * @description End-to-end integration test for single-signer (owner) flow using JWT.
 * Flow: create envelope → get envelope → upload PDF to S3 → sign via JWT → complete → download → history.
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { createApiGatewayEvent, generateTestPdf } from '../helpers/testHelpers';
import { createEnvelopeHandler } from '../../../src/handlers/envelopes/CreateEnvelopeHandler';
import { getEnvelopeHandler } from '../../../src/handlers/envelopes/GetEnvelopeHandler';
import { signDocumentHandler } from '../../../src/handlers/signing/SignDocumentHandler';
import { downloadSignedDocumentHandler } from '../../../src/handlers/envelopes/DownloadSignedDocumentHandler';
import { getDocumentHistoryHandler } from '../../../src/handlers/audit/GetDocumentHistoryHandler';
import { ServiceFactory } from '../../../src/infrastructure/factories/ServiceFactory';
import { EnvelopeService } from '../../../src/services/EnvelopeService';
import { ConsentService } from '../../../src/services/ConsentService';
import { ConsentRepository } from '../../../src/repositories/ConsentRepository';
import { AuditService } from '../../../src/services/AuditService';
import { AuditRepository } from '../../../src/repositories/AuditRepository';
import { SignerRepository } from '../../../src/repositories/SignerRepository';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../../../src/domain/enums/EnvelopeStatus';

describe('Integration: Single-signer (owner) flow', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({ region: cfg.region, endpoint: process.env.AWS_ENDPOINT_URL });

  const ownerUser = {
    userId: 'test-owner-123',
    email: 'owner@example.com'
  };

  const makeAuthEvent = async (overrides?: any) => {
    const base = await createApiGatewayEvent({ includeAuth: true });
    // Override authorizer with owner identity
    (base.requestContext as any).authorizer.userId = ownerUser.userId;
    (base.requestContext as any).authorizer.email = ownerUser.email;
    (base.requestContext as any).authorizer.actor = {
      userId: ownerUser.userId,
      email: ownerUser.email,
      ip: '127.0.0.1',
      userAgent: 'jest-test/1.0',
      roles: ['customer'],
      scopes: []
    };
    return { ...base, ...(overrides || {}) } as any;
  };

  it('should create, get, sign (JWT), complete, download, and show history', async () => {
    // Pre-flight: ensure owner listing works (diagnostic)
    const preEnvService: EnvelopeService = ServiceFactory.createEnvelopeService();
    await preEnvService.getUserEnvelopes(ownerUser.userId, 1).catch(() => Promise.resolve());

    // Seed document in Documents table (shared) matching Document Service schema
    const documentsTable = process.env.DOCUMENTS_TABLE || 'test-documents';
    const seedClient = (ServiceFactory as any).ddbClient;
    const documentId = randomUUID();
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

    // 1) Create envelope with a single owner signer
    const envelopeTitle = `Test Envelope ${Date.now()}`;

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

    const createEvt = await makeAuthEvent({ body: JSON.stringify(createBody) });
    const createRes = await createEnvelopeHandler(createEvt);
    const createResObj = typeof createRes === 'string' ? JSON.parse(createRes) : createRes;
    if (createResObj.statusCode !== 201) {
      // Debug body to see validation issues
      // eslint-disable-next-line no-console
      console.log('CreateEnvelope response debug:', createResObj);
    }
    expect(createResObj.statusCode).toBe(201);
    const createData = JSON.parse(createResObj.body).data;
    const envelopeId = createData.envelope.id as string;
    expect(envelopeId).toBeTruthy();

    // 2) Get envelope and verify signer
    const getEvt = await makeAuthEvent({
      pathParameters: { envelopeId }
    });
    const getRes = await getEnvelopeHandler(getEvt);
    const getResObj = typeof getRes === 'string' ? JSON.parse(getRes) : getRes;
    expect(getResObj.statusCode).toBe(200);
    const getData = JSON.parse(getResObj.body).data;
    expect(getData.envelope.id).toBe(envelopeId);
    const signer = getData.envelope.signers[0];
    expect(signer.email).toBe(ownerUser.email);

    // 3) Upload flattened.pdf to S3 with the same s3Key expected by sign handler
    const pdfBuffer = generateTestPdf();
    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
    const s3Key = `envelopes/${envelopeId}/signed.pdf`; // overwrite strategy path used by KmsService
    await s3.send(new PutObjectCommand({
      Bucket: cfg.s3.signedBucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }));

    // 4) Sign via JWT (owner path)
    // Create consent before signing (required by SignatureService)
    const consentService: ConsentService = (() => {
      const config = loadConfig();
      const ddb = (ServiceFactory as any).ddbClient;
      const consentRepo = new ConsentRepository(config.ddb.consentTable, ddb);
      const signerRepo = new SignerRepository(config.ddb.signersTable, ddb);
      const auditRepo = new AuditRepository(config.ddb.auditTable, ddb);
      const auditSvc = new AuditService(auditRepo);
      // Minimal event service; ConsentService requires it but our createConsent path uses Audit + Repo
      const dummyEventService = { publishEvent: async () => {} } as any;
      return new ConsentService(consentRepo, signerRepo, auditSvc, dummyEventService);
    })();

    await consentService.createConsent({
      envelopeId: new EnvelopeId(envelopeId),
      signerId: new SignerId(signer.id),
      signatureId: new EnvelopeId(randomUUID()) as any, // placeholder link
      consentGiven: true,
      consentTimestamp: new Date(),
      consentText: 'I agree to sign electronically',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-test/1.0'
    }, ownerUser.email);

    const signBody = {
      envelopeId,
      signerId: signer.id,
      documentHash: sha256,
      signatureHash: `mock-signature-${Date.now()}`,
      s3Key,
      kmsKeyId: cfg.kms.signerKeyId,
      algorithm: cfg.kms.signingAlgorithm,
      reason: 'Approved',
      location: 'Test Suite'
    };
    const signEvt = await makeAuthEvent({ body: JSON.stringify(signBody) });
    const signRes = await signDocumentHandler(signEvt);
    const signResObj = typeof signRes === 'string' ? JSON.parse(signRes) : signRes;
    expect(signResObj.statusCode).toBe(200);
    const signData = JSON.parse(signResObj.body).data;
    expect(signData.signature.id).toBeTruthy();
    expect(signData.envelope.id).toBe(envelopeId);

    // 5) Mark envelope as COMPLETED to allow download
    const envelopeService: EnvelopeService = ServiceFactory.createEnvelopeService();
    await envelopeService.changeEnvelopeStatus(new EnvelopeId(envelopeId), EnvelopeStatus.COMPLETED, ownerUser.userId, {
      userId: ownerUser.userId,
      ipAddress: '127.0.0.1',
      userAgent: 'jest-test/1.0',
      accessType: 'USER',
      permission: 'MANAGE',
      timestamp: new Date()
    } as any);

    // 6) Download via handler
    const downloadEvt = await makeAuthEvent({
      pathParameters: { envelopeId },
      queryStringParameters: { expiresIn: '900' }
    });
    const downloadRes = await downloadSignedDocumentHandler(downloadEvt);
    const downloadResObj = typeof downloadRes === 'string' ? JSON.parse(downloadRes) : downloadRes;
    expect(downloadResObj.statusCode).toBe(200);
    const downloadData = JSON.parse(downloadResObj.body).data;
    expect(downloadData.downloadUrl).toContain('http');
    expect(downloadData.filename).toBe('signed.pdf');

    // 7) Get document history
    const historyEvt = await makeAuthEvent({
      pathParameters: { envelopeId },
      queryStringParameters: { limit: '50' }
    });
    const historyRes = await getDocumentHistoryHandler(historyEvt);
    const historyResObj = typeof historyRes === 'string' ? JSON.parse(historyRes) : historyRes;
    expect(historyResObj.statusCode).toBe(200);
    const historyData = JSON.parse(historyResObj.body).data;
    expect(historyData.envelopeId).toBe(envelopeId);
    expect(Array.isArray(historyData.history.events)).toBe(true);
  }, 120000);
});


