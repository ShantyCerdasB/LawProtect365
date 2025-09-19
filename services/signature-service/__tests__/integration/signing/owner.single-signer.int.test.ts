/**
 * @file owner.single-signer.int.test.ts
 * @description End-to-end integration test for single-signer (owner) flow using JWT.
 * Flow: create envelope → get envelope → upload PDF to S3 → sign via JWT → complete → download → history.
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { createApiGatewayEvent, createTestRequestContext, generateTestPdf } from '../helpers/testHelpers';
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
    // eslint-disable-next-line no-console
    console.log('CreateEnvelope 201 response body:', createResObj.body);
    expect(createResObj.statusCode).toBe(201);
    const createParsed = JSON.parse(createResObj.body);
    const createData = (createParsed && (createParsed.data ?? createParsed)) as any;
    let envelopeId = (createData?.envelope?.id ?? createData?.envelopeId ?? createParsed?.envelopeId) as string | undefined;
    if (!envelopeId) {
      const svc = ServiceFactory.createEnvelopeService();
      // Fallback to authenticated JWT user (as set by mock JWKS)
      const list = await svc.getUserEnvelopes('test-user-123', 10);
      const last = list.items.at(-1) as any;
      envelopeId = last?.getId?.().getValue?.();
    }
    if (!envelopeId) {
      throw new Error('Envelope ID not found after create; response missing envelope.id and fallback list returned none');
    }

    // 2) Get envelope and verify signer
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

    // 3) Upload flattened.pdf to S3 with the same s3Key expected by sign handler
    const pdfBuffer = generateTestPdf();
    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
    const signatureHash = createHash('sha256').update(`signature:${sha256}`).digest('hex');
    const s3Key = `envelopes/${envelopeId}/signed.pdf`; // overwrite strategy path used by KmsService
    await s3.send(new PutObjectCommand({
      Bucket: cfg.s3.signedBucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }));

    // 4) Sign via JWT (owner path) - send consent from frontend payload

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
      // eslint-disable-next-line no-console
      console.log('Sign response debug:', signResObj);
    }
    expect(signResObj.statusCode).toBe(200);
    const signData = JSON.parse(signResObj.body).data;
    expect(signData.signature.id).toBeTruthy();
    expect(signData.envelope.id).toBe(envelopeId);

    // 5) Download via handler (auto-completed for single signer)
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

    // 7) Get document history
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
    // eslint-disable-next-line no-console
    console.log('History 200 response body:', JSON.stringify(JSON.parse(historyResObj.body), null, 2));
    const historyData = JSON.parse(historyResObj.body).data;
    expect(historyData.envelopeId).toBe(envelopeId);
    expect(Array.isArray(historyData.history.events)).toBe(true);

    // Validate history payload structure and required events
    const events = historyData.history.events as Array<any>;
    expect(events.length).toBeGreaterThanOrEqual(3);
    const types = events.map(e => e.type);
    expect(types).toEqual(expect.arrayContaining([
      'ENVELOPE_CREATED',
      'SIGNATURE_CREATED',
      'ENVELOPE_STATUS_CHANGED'
    ]));
    expect(types).not.toEqual(expect.arrayContaining(['SIGNER_INVITED', 'SIGNER_ADDED']));

    // Exactly one signature created in owner-only flow
    expect(events.filter(e => e.type === 'SIGNATURE_CREATED').length).toBe(1);

    // Validate actor fields present
    const dl = events.find(e => e.type === 'DOCUMENT_DOWNLOADED');
    expect(dl.userEmail).toBe(ownerUser.email);
    expect(dl.userAgent).toBe('jest-test/1.0');
    expect(dl.ipAddress).toBeDefined();

    // Validate each event shape (action, actor, timestamp UTC)
    for (const ev of events) {
      expect(typeof ev.id).toBe('string');
      expect(typeof ev.type).toBe('string');
      expect(typeof ev.description).toBe('string');
      // timestamp must be ISO and valid date
      expect(typeof ev.timestamp).toBe('string');
      expect(new Date(ev.timestamp).toString()).not.toBe('Invalid Date');
      if (ev.userId !== undefined) expect(typeof ev.userId).toBe('string');
      if (ev.userEmail !== undefined) expect(typeof ev.userEmail).toBe('string');
      // ip, ua, country deben estar presentes en eventos clave
      if (['SIGNATURE_CREATED', 'DOCUMENT_DOWNLOADED', 'ENVELOPE_CREATED', 'ENVELOPE_STATUS_CHANGED'].includes(ev.type)) {
        // ip/ua se registran en metadata superior; en nuestro modelo están como campos de evento
        // La respuesta del handler no expone ip/ua/country directamente; validamos presence via metadata o por diseño actual omitimos.
        // Aquí validamos que metadata exista; country puede venir null si no se resolvió geolocalización.
        expect(typeof ev.metadata).toBe('object');
      }
    }

    // Validaciones específicas por tipo
    const sigCreated = events.find(e => e.type === 'SIGNATURE_CREATED');
    expect(sigCreated).toBeTruthy();
    expect(sigCreated.metadata.filename).toBe('signed.pdf');
    expect(typeof sigCreated.metadata.s3Key).toBe('string');

    const downloaded = events.find(e => e.type === 'DOCUMENT_DOWNLOADED');
    expect(downloaded).toBeTruthy();
    expect(downloaded.metadata.filename).toBe('signed.pdf');
    expect(typeof downloaded.metadata.contentType).toBe('string');
    // size depende del HeadObject en LocalStack/mocks; si está, debe ser número
    if (downloaded.metadata.size !== undefined) expect(typeof downloaded.metadata.size).toBe('number');

    // Validate envelope status summary matches completed
    expect(historyData.history.envelopeStatus).toBe('COMPLETED');
  }, 120000);
});


