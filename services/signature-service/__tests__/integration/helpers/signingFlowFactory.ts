/**
 * @file signingFlowFactory.ts
 * @summary Factory for creating signing flow test scenarios
 * @description Provides reusable functions for creating common signing flow scenarios
 * to eliminate code duplication across test files.
 */

import { CreateEnvelopeController } from '../../../src/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreatePartyController } from '../../../src/presentation/controllers/parties/CreateParty.Controller';
import { InvitePartiesController } from '../../../src/presentation/controllers/requests/InviteParties.Controller';
import { RecordConsentController } from '../../../src/presentation/controllers/signing/RecordConsent.Controller';
import { RecordConsentWithTokenController } from '../../../src/presentation/controllers/signing/RecordConsentWithToken.Controller';
import { CompleteSigningController } from '../../../src/presentation/controllers/signing/CompleteSigning.Controller';
import { CompleteSigningWithTokenController } from '../../../src/presentation/controllers/signing/CompleteSigningWithToken.Controller';
import { ValidateInvitationTokenController } from '../../../src/presentation/controllers/signing/ValidateInvitationToken.Controller';
import { FinaliseEnvelopeController } from '../../../src/presentation/controllers/requests/FinaliseEnvelope.Controller';
import { DownloadSignedDocumentController } from '../../../src/presentation/controllers/signing/DownloadSignedDocument.Controller';
import { getContainer } from '../../../src/core/Container';
import {
  generateTestPdf,
  calculatePdfDigest,
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent,
  generateTestJwtToken
} from './testHelpers';
import { generateUniqueTestData } from './testIsolation';
import type { ApiResponseStructured } from '@lawprotect/shared-ts';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Helper function to assert response type
export const assertResponse = (response: any): ApiResponseStructured => {
  if (typeof response === 'string') {
    throw new Error('Response is a string, expected structured response');
  }
  return response as ApiResponseStructured;
};

/**
 * Creates a test PDF in LocalStack S3 for testing purposes
 */
export async function createTestPdfInLocalStackS3(
  envelopeId: string,
  bucketName: string = process.env.SIGNED_BUCKET || 'test-signed'
): Promise<string> {
  console.log('🔍 [PDF DEBUG] Starting createTestPdfInLocalStackS3...');
  console.log('🔍 [PDF DEBUG] envelopeId:', envelopeId);
  console.log('🔍 [PDF DEBUG] bucketName:', bucketName);
  
  const s3Client = new S3Client({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    },
    forcePathStyle: true
  });

  console.log('🔍 [PDF DEBUG] S3Client created, generating test PDF...');
  const testPdf = generateTestPdf();
  const key = `signed-${envelopeId}.pdf`;
  console.log('🔍 [PDF DEBUG] Test PDF generated, key:', key);
  
  console.log('🔍 [PDF DEBUG] Uploading to S3...');
  
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: testPdf,
      ContentType: 'application/pdf'
    });
    
    const result = await s3Client.send(putCommand);
    console.log('🔍 [PDF DEBUG] S3 upload completed successfully:', result);
  } catch (error) {
    console.error('🔍 [PDF DEBUG] S3 upload failed:', error);
    throw error;
  }

  const pdfUrl = `http://localhost:4566/${bucketName}/${key}`;
  console.log('🔍 [PDF DEBUG] Created test PDF in LocalStack S3:', pdfUrl);
  return pdfUrl;
}

// Types for test data
export interface TestUser {
  id: string;
  email: string;
  token: string;
}

export interface TestParty {
  id: string;
  name: string;
  email: string;
  role: string;
  sequence: number;
}

export interface TestEnvelope {
  id: string;
  name: string;
  description: string;
  ownerEmail: string;
}

export interface SigningFlowResult {
  envelope: TestEnvelope;
  parties: TestParty[];
  owner: TestUser;
  invitedUsers: TestUser[];
  invitationTokens: { [email: string]: string };
}

/**
 * Create test envelope with unique data for parallel execution
 */
export async function createTestEnvelopeWithUniqueData(
  testData: ReturnType<typeof generateUniqueTestData>
): Promise<TestEnvelope> {
  const resolvedTestData = await testData;
  const { owner, envelope } = resolvedTestData;
  
  const event = await createApiGatewayEvent({
    pathParameters: createTestPathParams({}),
    body: {
      name: envelope.name,
      description: envelope.description,
      ownerEmail: owner.email
    },
    headers: { 'Authorization': `Bearer ${owner.token}` },
    requestContext: createTestRequestContext({
      userId: owner.userId,
      email: owner.email
    })
  });

  const result = await CreateEnvelopeController(event);

  const response = assertResponse(result);
  if (response.statusCode !== 201) {
    console.error('❌ CreateEnvelope failed:', {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers,
      testData: {
        ownerEmail: resolvedTestData.owner.email,
        envelopeName: resolvedTestData.envelope.name,
        tokenPreview: resolvedTestData.owner.token.substring(0, 50) + '...'
      }
    });
    
    // Parse error body for better debugging
    let errorMessage = 'Unknown error';
    try {
      const errorBody = JSON.parse(response.body || '{}');
      errorMessage = errorBody.message || errorBody.error || 'Unknown error';
    } catch (e) {
      errorMessage = response.body || 'Unknown error';
    }
    
    throw new Error(`CreateEnvelope failed with status ${response.statusCode}: ${errorMessage}`);
  }
  
  const envelopeId = JSON.parse(response.body!).data.envelope.envelopeId;
  return {
    id: envelopeId,
    name: envelope.name,
    description: envelope.description,
    ownerEmail: owner.email
  };
}

/**
 * Creates a test envelope with the given parameters (legacy function)
 */
export async function createTestEnvelope(
  name: string,
  description: string,
  ownerEmail: string,
  _ownerToken: string
): Promise<TestEnvelope> {
  // Always generate a valid JWT token using our Cognito mock
  const { generateTestJwtToken } = await import('./testHelpers');
  const validToken = await generateTestJwtToken({
    sub: 'owner-user-123',
    email: ownerEmail,
    roles: ['customer'],
    scopes: []
  });

  return createTestEnvelopeWithToken(name, description, ownerEmail, validToken);
}

/**
 * Creates a test envelope using the provided JWT token
 */
export async function createTestEnvelopeWithToken(
  name: string,
  description: string,
  ownerEmail: string,
  ownerToken: string
): Promise<TestEnvelope> {
  const event = await createApiGatewayEvent({
    pathParameters: createTestPathParams({}),
    body: {
      name,
      description,
      ownerEmail
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: ownerEmail
    })
  });
  
  const result = await CreateEnvelopeController(event);
  const response = assertResponse(result);
  
  // Log detailed error information for debugging
  if (response.statusCode !== 201) {
    console.error('❌ CreateEnvelope failed:', {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers
    });
  }
  
  expect(response.statusCode).toBe(201);
  
  const envelopeId = JSON.parse(response.body!).data.envelope.envelopeId;
  return {
    id: envelopeId,
    name,
    description,
    ownerEmail
  };
}

/**
 * Creates a test party within an envelope
 */
export async function createTestParty(
  envelopeId: string,
  name: string,
  email: string,
  role: string,
  sequence: number,
  _ownerToken: string
): Promise<TestParty> {
  // Always generate a valid JWT token using our Cognito mock
  const { generateTestJwtToken } = await import('./testHelpers');
  const validToken = await generateTestJwtToken({
    sub: 'owner-user-123',
    email: 'owner@test.com',
    roles: ['customer'],
    scopes: []
  });

  return createTestPartyWithToken(envelopeId, name, email, role, sequence, validToken);
}

/**
 * Creates a test party using the provided JWT token
 */
// Helper function to extract JWT claims
export function extractJwtClaims(token: string): { userId: string; email: string } {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      userId: payload.sub,
      email: payload.email
    };
  } catch (error) {
    // Fallback to default values if JWT parsing fails
    return {
      userId: 'owner-user-123',
      email: 'owner@test.com'
    };
  }
}

export async function createTestPartyWithToken(
  envelopeId: string,
  name: string,
  email: string,
  role: string,
  sequence: number,
  ownerToken: string
): Promise<TestParty> {
  // Extract JWT claims to use in requestContext
  const jwtClaims = extractJwtClaims(ownerToken);
  
  const event = await createApiGatewayEvent({
    pathParameters: { envelopeId },
    body: {
      name,
      email,
      role,
      sequence
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: jwtClaims.userId,
      email: jwtClaims.email,
      role: 'customer'
    })
  });
  
  const result = await CreatePartyController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(201);
  
  const partyId = JSON.parse(response.body!).data.party.partyId;
  return {
    id: partyId,
    name,
    email,
    role,
    sequence
  };
}

/**
 * Invites parties and returns invitation tokens
 */
export async function inviteTestParties(
  envelopeId: string,
  partyIds: string[],
  ownerToken: string,
  message: string = 'Please sign this document'
): Promise<{ [partyId: string]: string }> {
  // For testing, we need to provide the actual emails of the parties
  // We'll fetch the actual party emails from the database to ensure accuracy
  const container = getContainer();
  const partiesRepo = container.repos.parties;
  
  const assignedSigners = await Promise.all(
    partyIds.map(async (partyId) => {
      const party = await partiesRepo.getById({ envelopeId, partyId });
      if (!party) {
        throw new Error(`Party not found: ${partyId}`);
      }
      return party.email;
    })
  );

  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      partyIds,
      message,
      signByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      inputs: {
        hasInputs: true,
        inputCount: partyIds.length,
        signatureInputs: partyIds.length,
        assignedSigners: assignedSigners
      }
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: 'owner@test.com',
      role: 'customer'
    })
  });
  
  const result = await InvitePartiesController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  
  const responseData = JSON.parse(response.body!).data;
  const tokens = responseData.tokens;
  const invited = responseData.invited;
  
  const tokenMap: { [partyId: string]: string } = {};
  
  // Map each token to its corresponding partyId
  tokens.forEach((token: string, index: number) => {
    const partyId = invited[index];
    tokenMap[partyId] = token;
  });
  
  return tokenMap;
}

/**
 * Records consent for an authenticated user
 */
export async function recordConsentForAuthenticatedUser(
  envelopeId: string,
  signerId: string,
  ownerToken: string,
  consentText: string = 'I agree to sign this document electronically'
): Promise<void> {
  // Extract JWT claims to use in requestContext
  const jwtClaims = extractJwtClaims(ownerToken);

  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId,
      consentGiven: true,
      consentText
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: jwtClaims.userId,
      email: jwtClaims.email,
      role: 'customer'
    })
  });
  
  const result = await RecordConsentController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
}

/**
 * Records consent for a user with invitation token
 */
export async function recordConsentWithToken(
  envelopeId: string,
  signerId: string,
  token: string,
  consentText: string = 'I agree to sign this document electronically'
): Promise<void> {
  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId,
      token,
      consentGiven: true,
      consentText
    }
  });
  
  
  const result = await RecordConsentWithTokenController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
}

/**
 * Completes signing for an authenticated user
 */
export async function completeSigningForAuthenticatedUser(
  envelopeId: string,
  signerId: string,
  ownerToken: string,
  pdfUrl?: string
): Promise<{ signed: boolean; error?: string }> {
  console.log('🔍 [FACTORY DEBUG] Starting completeSigningForAuthenticatedUser...');
  
  // Extract JWT claims to use in requestContext
  const jwtClaims = extractJwtClaims(ownerToken);
  console.log('🔍 [FACTORY DEBUG] JWT claims extracted:', jwtClaims);

  // Use provided URL or create PDF in S3
  console.log('🔍 [FACTORY DEBUG] pdfUrl provided:', pdfUrl);
  const finalPdfUrl = pdfUrl || await createTestPdfInLocalStackS3(envelopeId);
  console.log('🔍 [FACTORY DEBUG] finalPdfUrl:', finalPdfUrl);
  
  const testPdf = generateTestPdf();
  const pdfDigest = calculatePdfDigest(testPdf);
  
  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId,
      finalPdfUrl: finalPdfUrl,
      digest: {
        alg: 'sha256',
        value: pdfDigest.value
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'alias/test-key-id'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: jwtClaims.userId,
      email: jwtClaims.email,
      role: 'customer'
    })
  });
  
  const result = await CompleteSigningController(event);

  const response = assertResponse(result);
  
  if (response.statusCode !== 200) {
    console.error('❌ [FACTORY ERROR] CompleteSigningController failed:', {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers
    });
  }
  
  expect(response.statusCode).toBe(200);
  
  const body = JSON.parse(response.body!);
  
  return {
    signed: body.data.completed,
    error: body.data.error
  };
}

/**
 * Completes signing for a user with invitation token
 */
export async function completeSigningWithToken(
  envelopeId: string,
  signerId: string,
  token: string,
  pdfUrl: string = 'https://test-bucket.s3.amazonaws.com/test-document.pdf'
): Promise<{ signed: boolean; error?: string }> {
  const testPdf = generateTestPdf();
  const pdfDigest = calculatePdfDigest(testPdf);
  
  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId,
      token,
      finalPdfUrl: pdfUrl,
      digest: {
        alg: 'sha256',
        value: pdfDigest.value
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'alias/test-key-id'
    }
  });
  
  const result = await CompleteSigningWithTokenController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  
  const body = JSON.parse(response.body!);
  return {
    signed: body.data.completed,
    error: body.data.error
  };
}

/**
 * Validates an invitation token
 */
export async function validateInvitationToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  const event = await createApiGatewayEvent({
    pathParameters: { token }
  });
  
  const result = await ValidateInvitationTokenController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  
  const body = JSON.parse(response.body!);
  return {
    valid: body.data.valid,
    email: body.data.email,
    error: body.data.error
  };
}

/**
 * Finalises an envelope
 */
export async function finaliseEnvelope(
  envelopeId: string,
  ownerToken: string,
  message: string = 'All parties have signed'
): Promise<void> {
  // Extract JWT claims to use in requestContext
  const jwtClaims = extractJwtClaims(ownerToken);

  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: { message },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: jwtClaims.userId,
      email: jwtClaims.email,
      role: 'customer'
    })
  });
  
  const result = await FinaliseEnvelopeController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
}

/**
 * Downloads the signed document
 */
export async function downloadSignedDocument(
  envelopeId: string,
  ownerToken: string
): Promise<string> {
  const event = await createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: { envelopeId },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: 'owner@test.com',
      role: 'customer'
    })
  });
  
  const result = await DownloadSignedDocumentController(event);

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();
  
  return response.body!;
}

/**
 * Creates a complete single signer flow
 */
export async function createSingleSignerFlow(
  envelopeName: string,
  ownerEmail: string = 'owner@test.com'
): Promise<SigningFlowResult> {
  console.log('🔍 [FLOW DEBUG] Starting createSingleSignerFlow...');
  console.log('🔍 [FLOW DEBUG] envelopeName:', envelopeName);
  console.log('🔍 [FLOW DEBUG] ownerEmail:', ownerEmail);
  
  // Generate unique owner token for each flow
  const uniqueUserId = `owner-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('🔍 [FLOW DEBUG] uniqueUserId:', uniqueUserId);
  
  const ownerToken = await generateTestJwtToken({
    sub: uniqueUserId,
    email: ownerEmail,
    roles: ['customer'],
    scopes: []
  });
  console.log('🔍 [FLOW DEBUG] ownerToken generated');

  // Create envelope using the same token
  console.log('🔍 [FLOW DEBUG] Creating envelope...');
  const envelope = await createTestEnvelopeWithToken(
    envelopeName,
    'Contract for single signer testing',
    ownerEmail,
    ownerToken
  );
  console.log('🔍 [FLOW DEBUG] Envelope created:', envelope.id);

  // Create owner party with the same email as the authenticated user
  console.log('🔍 [FLOW DEBUG] Creating owner party...');
  const ownerParty = await createTestPartyWithToken(
    envelope.id,
    'Owner Signer',
    ownerEmail, // This matches the email in the JWT token
    'signer',
    1,
    ownerToken
  );
  console.log('🔍 [FLOW DEBUG] Owner party created:', ownerParty.id);

  // Record consent
  console.log('🔍 [FLOW DEBUG] Recording consent...');
  await recordConsentForAuthenticatedUser(envelope.id, ownerParty.id, ownerToken);
  console.log('🔍 [FLOW DEBUG] Consent recorded');

  // Add delay to ensure consent timestamp is before signing timestamp
  console.log('🔍 [FLOW DEBUG] Adding delay...');
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('🔍 [FLOW DEBUG] Delay completed');

  // Complete signing
  console.log('🔍 [FLOW DEBUG] Starting complete signing...');
  const signingResult = await completeSigningForAuthenticatedUser(
    envelope.id,
    ownerParty.id,
    ownerToken
  );
  console.log('🔍 [FLOW DEBUG] Signing completed:', signingResult);

  expect(signingResult.signed).toBe(true);

  return {
    envelope,
    parties: [ownerParty],
    owner: {
      id: uniqueUserId,
      email: ownerEmail,
      token: ownerToken
    },
    invitedUsers: [],
    invitationTokens: {}
  };
}

/**
 * Creates a complete two signers flow
 */
export async function createTwoSignersFlow(
  envelopeName: string,
  ownerEmail: string = 'owner@test.com',
  invitedEmail: string = 'invited@test.com'
): Promise<SigningFlowResult> {
  // Generate owner token
  const ownerToken = await generateTestJwtToken({
    sub: 'owner-user-123',
    email: ownerEmail,
    roles: ['customer'],
    scopes: []
  });

  // Create envelope
  const envelope = await createTestEnvelopeWithToken(
    envelopeName,
    'Contract for two signers testing',
    ownerEmail,
    ownerToken
  );

  // Create parties
  const ownerParty = await createTestPartyWithToken(
    envelope.id,
    'Owner Signer',
    ownerEmail,
    'signer',
    1,
    ownerToken
  );

  const invitedParty = await createTestPartyWithToken(
    envelope.id,
    'Invited Signer',
    invitedEmail,
    'signer',
    2,
    ownerToken
  );

  // Invite parties
  const invitationTokens = await inviteTestParties(
    envelope.id,
    [ownerParty.id, invitedParty.id],
    ownerToken
  );


  // Owner signs (authenticated)
  await recordConsentForAuthenticatedUser(envelope.id, ownerParty.id, ownerToken);
  const ownerSigningResult = await completeSigningForAuthenticatedUser(
    envelope.id,
    ownerParty.id,
    ownerToken
  );
  expect(ownerSigningResult.signed).toBe(true);

  // Invited user signs (with token)
  await recordConsentWithToken(envelope.id, invitedParty.id, invitationTokens[invitedParty.id]);
  const invitedSigningResult = await completeSigningWithToken(
    envelope.id,
    invitedParty.id,
    invitationTokens[invitedParty.id]
  );
  expect(invitedSigningResult.signed).toBe(true);

  // Finalise envelope
  await finaliseEnvelope(envelope.id, ownerToken);

  return {
    envelope,
    parties: [ownerParty, invitedParty],
    owner: {
      id: 'owner-user-123',
      email: ownerEmail,
      token: ownerToken
    },
    invitedUsers: [{
      id: 'invited-user-456',
      email: invitedEmail,
      token: invitationTokens[invitedParty.id]
    }],
    invitationTokens
  };
}

/**
 * Creates a complete multi signers flow
 */
export async function createMultiSignersFlow(
  envelopeName: string,
  ownerEmail: string = 'owner@test.com',
  invitedEmails: string[] = ['signer1@test.com', 'signer2@test.com', 'signer3@test.com']
): Promise<SigningFlowResult> {
  // Generate owner token
  const ownerToken = await generateTestJwtToken({
    sub: 'owner-user-123',
    email: ownerEmail,
    roles: ['customer'],
    scopes: []
  });

  // Create envelope
  const envelope = await createTestEnvelopeWithToken(
    envelopeName,
    'Contract for multi signers testing',
    ownerEmail,
    ownerToken
  );

  // Create parties
  const ownerParty = await createTestPartyWithToken(
    envelope.id,
    'Owner Signer',
    ownerEmail,
    'signer',
    1,
    ownerToken
  );

  const invitedParties: TestParty[] = [];
  for (let i = 0; i < invitedEmails.length; i++) {
    const party = await createTestPartyWithToken(
      envelope.id,
      `Invited Signer ${i + 1}`,
      invitedEmails[i],
      'signer',
      i + 2,
      ownerToken
    );
    invitedParties.push(party);
  }

  const allParties = [ownerParty, ...invitedParties];

  // Invite parties
  const invitationTokens = await inviteTestParties(
    envelope.id,
    allParties.map(p => p.id),
    ownerToken
  );

  // Owner signs (authenticated)
  await recordConsentForAuthenticatedUser(envelope.id, ownerParty.id, ownerToken);
  const ownerSigningResult = await completeSigningForAuthenticatedUser(
    envelope.id,
    ownerParty.id,
    ownerToken
  );
  expect(ownerSigningResult.signed).toBe(true);

  // All invited users sign (with tokens)
  for (const party of invitedParties) {
    await recordConsentWithToken(envelope.id, party.id, invitationTokens[party.id]);
    const signingResult = await completeSigningWithToken(
      envelope.id,
      party.id,
      invitationTokens[party.id]
    );
    expect(signingResult.signed).toBe(true);
  }

  // Finalise envelope
  await finaliseEnvelope(envelope.id, ownerToken);

  return {
    envelope,
    parties: allParties,
    owner: {
      id: 'owner-user-123',
      email: ownerEmail,
      token: ownerToken
    },
    invitedUsers: invitedParties.map((party, index) => ({
      id: `invited-user-${index + 1}`,
      email: party.email,
      token: invitationTokens[party.id]
    })),
    invitationTokens
  };
}
