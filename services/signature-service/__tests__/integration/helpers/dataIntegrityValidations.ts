/**
 * @file dataIntegrityValidations.ts
 * @summary Data integrity validation helpers for signing flow tests
 * @description Provides reusable data integrity validation functions to eliminate
 * code duplication across test files.
 */

import { CompleteSigningController } from '../../../src/presentation/controllers/signing/CompleteSigning.Controller';
import { CompleteSigningWithTokenController } from '../../../src/presentation/controllers/signing/CompleteSigningWithToken.Controller';
import { FinaliseEnvelopeController } from '../../../src/presentation/controllers/requests/FinaliseEnvelope.Controller';
import { createApiGatewayEvent } from './testHelpers';
import { assertResponse } from './signingFlowFactory';
import { generateTestPdf, calculatePdfDigest } from './testHelpers';

/**
 * Tests invalid digest scenarios
 */
export async function testInvalidDigest(
  envelopeId: string,
  partyId: string,
  ownerToken: string,
  useToken: boolean = false,
  token?: string
): Promise<void> {
  const signingBody = {
    envelopeId: envelopeId,
    signerId: partyId,
    finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
    digest: {
      alg: 'sha256',
      value: 'invalid-digest-value'
    },
    algorithm: 'RSASSA_PSS_SHA_256',
    keyId: 'test-key-id'
  };

  let result;
  if (useToken && token) {
    result = await CompleteSigningWithTokenController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        ...signingBody,
        token: token
      }
    }));
  } else {
    result = await CompleteSigningController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: signingBody,
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: {
        userId: 'owner-user-123',
        email: 'owner@test.com'
      },
      includeAuth: false,
      authToken: ownerToken
    }));
  }

  const response = assertResponse(result);
  expect(response.statusCode).toBe(400);
}

/**
 * Tests unsupported algorithm scenarios
 */
export async function testUnsupportedAlgorithm(
  envelopeId: string,
  partyId: string,
  ownerToken: string,
  useToken: boolean = false,
  token?: string
): Promise<void> {
  const testPdf = generateTestPdf();
  const pdfDigest = calculatePdfDigest(testPdf);

  const signingBody = {
    envelopeId: envelopeId,
    signerId: partyId,
    finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
    digest: {
      alg: 'sha256',
      value: pdfDigest.value
    },
    algorithm: 'UNSUPPORTED_ALGORITHM',
    keyId: 'test-key-id'
  };

  let result;
  if (useToken && token) {
    result = await CompleteSigningWithTokenController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        ...signingBody,
        token: token
      }
    }));
  } else {
    result = await CompleteSigningController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: signingBody,
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: {
        userId: 'owner-user-123',
        email: 'owner@test.com'
      },
      includeAuth: false,
      authToken: ownerToken
    }));
  }

  const response = assertResponse(result);
  expect(response.statusCode).toBe(400);
}

/**
 * Tests document integrity validation
 */
export async function testDocumentIntegrity(
  envelopeId: string,
  partyId: string,
  ownerToken: string,
  useToken: boolean = false,
  token?: string
): Promise<void> {
  // Generate two different PDFs
  const modifiedPdf = generateTestPdf(); // This will be different
  const modifiedDigest = calculatePdfDigest(modifiedPdf);

  const signingBody = {
    envelopeId: envelopeId,
    signerId: partyId,
    finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
    digest: {
      alg: 'sha256',
      value: modifiedDigest.value // Using digest from different PDF
    },
    algorithm: 'RSASSA_PSS_SHA_256',
    keyId: 'test-key-id'
  };

  let result;
  if (useToken && token) {
    result = await CompleteSigningWithTokenController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        ...signingBody,
        token: token
      }
    }));
  } else {
    result = await CompleteSigningController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: signingBody,
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: {
        userId: 'owner-user-123',
        email: 'owner@test.com'
      },
      includeAuth: false,
      authToken: ownerToken
    }));
  }

  const response = assertResponse(result);
  expect(response.statusCode).toBe(400);
}

/**
 * Tests missing consent scenarios
 */
export async function testMissingConsent(
  envelopeId: string,
  partyId: string,
  ownerToken: string,
  useToken: boolean = false,
  token?: string
): Promise<void> {
  console.log('🔍 [DEBUG] testMissingConsent called with:', {
    envelopeId,
    partyId,
    ownerToken: ownerToken ? `${ownerToken.substring(0, 20)}...` : 'undefined',
    useToken,
    token: token ? `${token.substring(0, 20)}...` : 'undefined'
  });

  const testPdf = generateTestPdf();
  const pdfDigest = calculatePdfDigest(testPdf);

  const signingBody = {
    envelopeId: envelopeId,
    signerId: partyId,
    finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
    digest: {
      alg: 'sha256',
      value: pdfDigest.value
    },
    algorithm: 'RSASSA_PSS_SHA_256',
    keyId: 'test-key-id'
  };

  console.log('🔍 [DEBUG] testMissingConsent signingBody:', signingBody);

  let result;
  if (useToken && token) {
    console.log('🔍 [DEBUG] testMissingConsent using CompleteSigningWithTokenController');
    result = await CompleteSigningWithTokenController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        ...signingBody,
        token: token
      }
    }));
  } else {
    console.log('🔍 [DEBUG] testMissingConsent using CompleteSigningController');
    const event = await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: signingBody,
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: {
        userId: 'owner-user-123',
        email: 'owner@test.com'
      },
      includeAuth: false,
      authToken: ownerToken
    });
    console.log('🔍 [DEBUG] testMissingConsent event headers:', event.headers);
    result = await CompleteSigningController(event);
  }

  const response = assertResponse(result);
  console.log('🔍 [DEBUG] testMissingConsent response:', {
    statusCode: response.statusCode,
    body: response.body
  });
  expect(response.statusCode).toBe(400);
}

/**
 * Tests signing order validation
 */
export async function testSigningOrder(
  envelopeId: string,
  partyId: string,
  token: string,
  expectedSuccess: boolean = true
): Promise<void> {
  const testPdf = generateTestPdf();
  const pdfDigest = calculatePdfDigest(testPdf);

  const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      signerId: partyId,
      token: token,
      finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
      digest: {
        alg: 'sha256',
        value: pdfDigest.value
      },
      algorithm: 'RSASSA_PSS_SHA_256',
      keyId: 'test-key-id'
    }
  }));

  const response = assertResponse(result);
  
  if (expectedSuccess) {
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body!).data.signed).toBe(true);
  } else {
    expect(response.statusCode).toBe(400);
  }
}

/**
 * Tests finalise envelope requirements
 */
export async function testFinaliseEnvelopeRequirements(
  envelopeId: string,
  ownerToken: string,
  expectedSuccess: boolean = false
): Promise<void> {
  const result = await FinaliseEnvelopeController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      message: 'Attempting to finalise without all signatures'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: {
      userId: 'owner-user-123',
      email: 'owner@test.com'
    }
  }));

  const response = assertResponse(result);
  
  if (expectedSuccess) {
    expect(response.statusCode).toBe(200);
  } else {
    expect(response.statusCode).toBe(400);
  }
}

/**
 * Tests partial signing scenarios
 */
export async function testPartialSigning(
  envelopeId: string,
  ownerToken: string,
  expectedSuccess: boolean = false
): Promise<void> {
  const result = await FinaliseEnvelopeController(createApiGatewayEvent({
    pathParameters: { id: envelopeId },
    body: {
      message: 'Attempting to finalise with partial signatures'
    },
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    requestContext: {
      userId: 'owner-user-123',
      email: 'owner@test.com'
    }
  }));

  const response = assertResponse(result);
  
  if (expectedSuccess) {
    expect(response.statusCode).toBe(200);
  } else {
    expect(response.statusCode).toBe(400);
  }
}
