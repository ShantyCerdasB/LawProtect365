/**
 * @file securityValidations.ts
 * @summary Common security validation helpers for signing flow tests
 * @description Provides reusable security validation functions to eliminate
 * code duplication across test files.
 */

import { CreateEnvelopeController } from '../../../src/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CompleteSigningController } from '../../../src/presentation/controllers/signing/CompleteSigning.Controller';
import { CompleteSigningWithTokenController } from '../../../src/presentation/controllers/signing/CompleteSigningWithToken.Controller';
import { ValidateInvitationTokenController } from '../../../src/presentation/controllers/signing/ValidateInvitationToken.Controller';
import { FinaliseEnvelopeController } from '../../../src/presentation/controllers/requests/FinaliseEnvelope.Controller';
import {
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent,
  generateTestJwtToken
} from './testHelpers';
import { assertResponse } from './signingFlowFactory';

/**
 * Tests unauthorized access to envelope operations
 */
export async function testUnauthorizedAccess(
  _ownerToken: string,
  operation: (token: string) => Promise<any>
): Promise<void> {
  // Test with no token
  const resultNoToken = await operation('');
  const responseNoToken = assertResponse(resultNoToken);
  expect(responseNoToken.statusCode).toBe(401);

  // Test with invalid token
  const resultInvalidToken = await operation('invalid-token');
  const responseInvalidToken = assertResponse(resultInvalidToken);
  expect(responseInvalidToken.statusCode).toBe(401);
}

/**
 * Tests cross-user access (different user trying to access another user's envelope)
 */
export async function testCrossUserAccess(
  _ownerToken: string,
  _ownerEmail: string,
  operation: (token: string, email: string) => Promise<any>
): Promise<void> {
  // Generate token for different user
  const otherUserToken = await generateTestJwtToken({
    sub: 'other-user-456',
    email: 'other@test.com',
    roles: ['customer'],
    scopes: []
  });

  const result = await operation(otherUserToken, 'other@test.com');
  const response = assertResponse(result);
  
  // This should fail for operations that require ownership validation
  expect(response.statusCode).toBe(403);
}

/**
 * Tests invalid envelope ID scenarios
 */
export async function testInvalidEnvelopeId(
  ownerToken: string,
  operation: (envelopeId: string, token: string) => Promise<any>
): Promise<void> {
  console.log('🔍 [DEBUG] testInvalidEnvelopeId called with:', {
    ownerToken: ownerToken ? `${ownerToken.substring(0, 20)}...` : 'undefined'
  });
  
  const result = await operation('invalid-envelope-id', ownerToken);
  const response = assertResponse(result);
  
  console.log('🔍 [DEBUG] testInvalidEnvelopeId response:', {
    statusCode: response.statusCode,
    body: response.body
  });
  
  expect(response.statusCode).toBe(400);
}

/**
 * Tests token security validations
 */
export async function testTokenSecurity(
  envelopeId: string,
  validToken: string,
  _validPartyId: string,
  invalidPartyId: string = 'invalid-party-id'
): Promise<void> {
  // Test token with wrong party ID
  const resultWrongParty = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: invalidPartyId,
      token: validToken,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const responseWrongParty = assertResponse(resultWrongParty);
  expect(responseWrongParty.statusCode).toBe(200);
  expect(JSON.parse(responseWrongParty.body!).data.signed).toBe(false);
  expect(JSON.parse(responseWrongParty.body!).data.error).toContain('party');

  // Test invalid token format
  const resultInvalidToken = await ValidateInvitationTokenController(createApiGatewayEvent({
    pathParameters: { token: 'invalid-token-format' }
  }));

  const responseInvalidToken = assertResponse(resultInvalidToken);
  expect(responseInvalidToken.statusCode).toBe(200);
  expect(JSON.parse(responseInvalidToken.body!).data.valid).toBe(false);
  expect(JSON.parse(responseInvalidToken.body!).data.error).toContain('Invalid');
}

/**
 * Tests token reuse scenarios
 */
export async function testTokenReuse(
  envelopeId: string,
  partyId: string,
  token: string
): Promise<void> {
  // First, complete signing successfully
  const firstResult = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: partyId,
      token: token,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const firstResponse = assertResponse(firstResult);
  expect(firstResponse.statusCode).toBe(200);
  expect(JSON.parse(firstResponse.body!).data.signed).toBe(true);

  // Try to use the same token again
  const secondResult = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: partyId,
      token: token,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const secondResponse = assertResponse(secondResult);
  expect(secondResponse.statusCode).toBe(200);
  expect(JSON.parse(secondResponse.body!).data.signed).toBe(false);
  expect(JSON.parse(secondResponse.body!).data.error).toContain('not active');
}

/**
 * Tests cross-envelope token usage
 */
export async function testCrossEnvelopeTokenUsage(
  ownerToken: string,
  _originalEnvelopeId: string,
  originalPartyId: string,
  originalToken: string
): Promise<void> {
  // Create another envelope
  const anotherEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
    pathParameters: createTestPathParams({}),
    body: {
      name: 'Another Contract',
      description: 'Another contract',
      ownerEmail: 'owner@test.com'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: 'owner@test.com'
    })
  }));

  const anotherEnvelopeResponse = assertResponse(anotherEnvelopeResult);
  const anotherEnvelopeId = JSON.parse(anotherEnvelopeResponse.body!).data.envelope.envelopeId;

  // Try to use token from original envelope on different envelope
  const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: anotherEnvelopeId }, // Different envelope
    body: {
      signerId: originalPartyId,
      token: originalToken, // Token from original envelope
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body!).data.signed).toBe(false);
  expect(JSON.parse(response.body!).data.error).toContain('envelope');
}

/**
 * Tests signing without invitation
 */
export async function testSigningWithoutInvitation(
  ownerToken: string,
  envelopeId: string,
  partyId: string
): Promise<void> {
  const result = await CompleteSigningController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      envelopeId: envelopeId,
      signerId: partyId,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: 'owner@test.com'
    })
  }));

  const response = assertResponse(result);
  expect(response.statusCode).toBe(400);
}

/**
 * Tests signing without consent
 */
export async function testSigningWithoutConsent(
  envelopeId: string,
  partyId: string,
  token: string
): Promise<void> {
  const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: partyId,
      token: token,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body!).data.signed).toBe(false);
  expect(JSON.parse(response.body!).data.error).toContain('consent');
}

/**
 * Tests envelope cancellation scenarios
 */
export async function testEnvelopeCancellation(
  envelopeId: string,
  ownerToken: string,
  partyId: string,
  token: string
): Promise<void> {
  // Cancel the envelope first
  const cancelResult = await FinaliseEnvelopeController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      message: 'Envelope cancelled'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: createTestRequestContext({
      userId: 'owner-user-123',
      email: 'owner@test.com'
    })
  }));

  const cancelResponse = assertResponse(cancelResult);
  expect(cancelResponse.statusCode).toBe(200);

  // Try to sign after cancellation
  const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: partyId,
      token: token,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: 'test-digest'
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body!).data.signed).toBe(false);
  expect(JSON.parse(response.body!).data.error).toContain('cancelled');
}

/**
 * Tests concurrent signing attempts
 */
export async function testConcurrentSigning(
  envelopeId: string,
  partyId: string,
  token: string,
  expectedSuccessful: number = 1
): Promise<void> {
  // Attempt to sign concurrently
  const promises = Array(3).fill(null).map(() => 
    CompleteSigningWithTokenController(createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        signerId: partyId,
        token: token,
        finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
        digest: {
          alg: 'sha256',
          value: 'test-digest'
        },
        algorithm: 'RSASSA_PSS_SHA_256',
        keyId: 'test-key-id'
      }
    }))
  );

  const results = await Promise.all(promises);
  
  // Count successful and failed results
  const successfulResults = results.filter(r => JSON.parse(assertResponse(r).body!).data.signed === true);
  const failedResults = results.filter(r => JSON.parse(assertResponse(r).body!).data.signed === false);
  
  expect(successfulResults).toHaveLength(expectedSuccessful);
  expect(failedResults).toHaveLength(3 - expectedSuccessful);
  
  // Failed results should indicate token already used
  failedResults.forEach(result => {
    expect(JSON.parse(assertResponse(result).body!).data.error).toContain('not active');
  });
}

/**
 * Tests IP and User Agent validation
 */
export async function testIpAndUserAgentValidation(token: string): Promise<void> {
  const result = await ValidateInvitationTokenController(createApiGatewayEvent({
    pathParameters: { token },
    requestContext: createTestRequestContext({
      sourceIp: '192.168.1.100',
      userAgent: 'test-agent/1.0'
    })
  }));

  const response = assertResponse(result);
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body!).data.valid).toBe(true);
}
