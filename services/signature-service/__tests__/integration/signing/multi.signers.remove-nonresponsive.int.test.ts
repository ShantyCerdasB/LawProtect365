/**
 * @file multi.signers.remove-nonresponsive.int.test.ts
 * @description Integration test: multi-signer flow where a non-responsive signer B is removed after send/reminder.
 * Notes/Expectations:
 * - Create envelope with 3 external signers (A,B,C), then send → publishes notifications (EventBridge PutEvents).
 * - Signer A signs via invitation token (external): should publish signer-related event(s).
 * - Send reminder to signer B: should publish reminder event(s).
 * - Remove signer B (who hasn't signed): allowed → SIGNER_REMOVED appears in audit history.
 * - No assertions around download/view notifications (they should not publish).
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { createApiGatewayEvent, generateTestPdf, generateTestJwtToken } from '../helpers/testHelpers';
import { createEnvelopeHandler } from '../../../src/handlers/envelopes/CreateEnvelopeHandler';
import { sendEnvelopeHandler } from '../../../src/handlers/envelopes/SendEnvelopeHandler';
import { getEnvelopeHandler } from '../../../src/handlers/envelopes/GetEnvelopeHandler';
import { signDocumentHandler } from '../../../src/handlers/signing/SignDocumentHandler';
import { getDocumentHistoryHandler } from '../../../src/handlers/audit/GetDocumentHistoryHandler';
import { ServiceFactory } from '../../../src/infrastructure/factories/ServiceFactory';
import { InvitationTokenService } from '../../../src/services/InvitationTokenService';
import { updateEnvelopeHandler } from '../../../src/handlers/envelopes/UpdateEnvelopeHandler';
import { sendNotificationHandler } from '../../../src/handlers/notifications/SendNotificationHandler';

describe('Integration: Multi-signers remove non-responsive (owner does not sign)', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({
    region: cfg.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test' }
  });

  const owner = { userId: 'test-owner-123', email: 'owner@example.com' };
  const signerA = { email: 'a.signer@example.com', fullName: 'Signer A' };
  const signerB = { email: 'b.signer@example.com', fullName: 'Signer B' };
  const signerC = { email: 'c.signer@example.com', fullName: 'Signer C' };

  const makeAuthEvent = async (overrides?: any) => {
    const token = await generateTestJwtToken({ sub: owner.userId, email: owner.email, roles: ['admin'], scopes: [] });
    const base = await createApiGatewayEvent({ includeAuth: false, authToken: token });
    (base.requestContext as any).authorizer.userId = owner.userId;
    (base.requestContext as any).authorizer.email = owner.email;
    (base.requestContext as any).authorizer.actor = {
      userId: owner.userId,
      email: owner.email,
      ip: '127.0.0.1',
      userAgent: 'jest-test/1.0',
      roles: ['customer'],
      scopes: []
    };
    const merged = { ...base, ...(overrides || {}) } as any;
    merged.headers = { ...(base.headers || {}), 'user-agent': 'jest-test/1.0', 'x-country': 'CO', ...((overrides && overrides.headers) || {}) };
    return merged;
  };

  it('sends, signs A, reminds B, removes B (allowed), verifies events and history', async () => {
    // Seed document metadata entry in Documents table
    const documentId = randomUUID();
    const documentsTable = process.env.DOCUMENTS_TABLE || 'test-documents';
    const ddb = (ServiceFactory as any).ddbClient;
    const createdAt = new Date().toISOString();
    await ddb.put({
      TableName: documentsTable,
      Item: {
        pk: `ENVELOPE#seed-${Date.now()}`,
        sk: `DOCUMENT#${documentId}`,
        type: 'Document',
        documentId,
        envelopeId: `seed-${Date.now()}`,
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
        ownerId: owner.userId
      } as any
    });

    // Upload a PDF that will be overwritten as signed
    const pdfBuffer = generateTestPdf();
    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex');
    const signatureHash = createHash('sha256').update(`signature:${sha256}`).digest('hex');

    // Create envelope with 3 external signers
    const createBody = {
      metadata: { title: `Multi Test ${Date.now()}`, description: 'Multi signers flow' },
      documentId,
      ownerId: owner.userId,
      signingOrder: 'INVITEES_FIRST',
      s3Key: `envelopes/${documentId}/flattened.pdf`,
      signers: [
        { email: signerA.email, fullName: signerA.fullName, order: 1 },
        { email: signerB.email, fullName: signerB.fullName, order: 2 },
        { email: signerC.email, fullName: signerC.fullName, order: 3 }
      ]
    };
    const createEvt = await makeAuthEvent({ body: JSON.stringify(createBody) });
    const createRes = await createEnvelopeHandler(createEvt);
    const createResObj = typeof createRes === 'string' ? JSON.parse(createRes) : createRes;
    expect(createResObj.statusCode).toBe(201);
    const createData = JSON.parse(createResObj.body).data;
    const envelopeId: string = createData.envelope.id;

    // Send envelope (should publish invitations)
    const sendEvt = await makeAuthEvent({ pathParameters: { envelopeId } });
    const sendRes = await sendEnvelopeHandler(sendEvt);
    const sendObj = typeof sendRes === 'string' ? JSON.parse(sendRes) : sendRes;
    // eslint-disable-next-line no-console
    console.log('SendEnvelope response debug:', sendObj);
    expect(sendObj.statusCode).toBe(200);

    // Fetch invitation token for signer A
    const tokenService: InvitationTokenService = ServiceFactory.createInvitationTokenService();
    const tokens = await tokenService.getTokensByEnvelope({ getValue: () => envelopeId } as any);
    const tokenA = tokens.find(t => t.getMetadata().email === signerA.email)?.getToken();
    expect(tokenA).toBeTruthy();

    // Upload initial signed.pdf body so KMS overwrite strategy can pass
    const s3Key = `envelopes/${envelopeId}/signed.pdf`;
    await s3.send(new PutObjectCommand({ Bucket: cfg.s3.signedBucket, Key: s3Key, Body: pdfBuffer, ContentType: 'application/pdf' }));

    // Signer A signs via invitation token
    const signBodyA = {
      invitationToken: tokenA,
      envelopeId,
      documentHash: sha256,
      signatureHash,
      s3Key,
      kmsKeyId: cfg.kms.signerKeyId,
      algorithm: cfg.kms.signingAlgorithm,
      reason: 'Approved',
      location: 'Test Suite',
      consent: { given: true, timestamp: new Date().toISOString(), text: 'I agree', ipAddress: '127.0.0.1', userAgent: 'jest-test/1.0' }
    };
    const signAEvt = await makeAuthEvent({ body: JSON.stringify(signBodyA) });
    const signARes = await signDocumentHandler(signAEvt);
    const signAObj = typeof signARes === 'string' ? JSON.parse(signARes) : signARes;
    expect(signAObj.statusCode).toBe(200);

    // Send reminder to signer B
    const reminderEvt = await makeAuthEvent({ pathParameters: { envelopeId } });
    const reminderRes = await sendNotificationHandler(reminderEvt);
    const reminderObj = typeof reminderRes === 'string' ? JSON.parse(reminderRes) : reminderRes;
    expect(reminderObj.statusCode).toBe(200);

    // Remove non-responsive signer B (allowed since not signed)
    // Lookup signer B id
    const getEvt = await makeAuthEvent({ pathParameters: { envelopeId } });
    const getRes = await getEnvelopeHandler(getEvt);
    const getObj = typeof getRes === 'string' ? JSON.parse(getRes) : getRes;
    expect(getObj.statusCode).toBe(200);
    const getData = JSON.parse(getObj.body).data;
    const bId: string | undefined = (getData.envelope.signers || []).find((s: any) => s.email === signerB.email)?.id;
    expect(bId).toBeTruthy();

    const updateBodyRemoveB = { signerUpdates: [{ action: 'remove', signerId: bId }] };
    const updateEvt = await makeAuthEvent({ pathParameters: { envelopeId }, body: JSON.stringify(updateBodyRemoveB) });
    const updateRes = await updateEnvelopeHandler(updateEvt);
    const updateObj = typeof updateRes === 'string' ? JSON.parse(updateRes) : updateRes;
    expect(updateObj.statusCode).toBe(200);

    // Verify SIGNER_REMOVED appears in history
    const historyEvt = await makeAuthEvent({ pathParameters: { envelopeId }, queryStringParameters: { limit: '100' } });
    const historyRes = await getDocumentHistoryHandler(historyEvt);
    const historyObj = typeof historyRes === 'string' ? JSON.parse(historyRes) : historyRes;
    expect(historyObj.statusCode).toBe(200);
    const events = JSON.parse(historyObj.body).data.history.events as Array<any>;
    const types = events.map(e => e.type);
    expect(types).toEqual(expect.arrayContaining(['ENVELOPE_CREATED', 'SIGNER_INVITED', 'SIGNER_ADDED', 'SIGNATURE_CREATED', 'SIGNER_REMOVED', 'ENVELOPE_STATUS_CHANGED']));

    // Verify EventBridge was used (send, reminder, signer signed)
    const eb = require('@aws-sdk/client-eventbridge');
    const instances = (eb.EventBridgeClient as any).mock?.instances || [];
    const putCalls = instances.flatMap((i: any) => (i.send?.mock?.calls || [])).filter((c: any[]) => c && c[0] && c[0].input && c[0].input.Entries);
    expect(putCalls.length).toBeGreaterThan(0);
  }, 180000);
});


