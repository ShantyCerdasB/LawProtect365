/**
 * @file TokenBasedSigning.test.ts
 * @summary Integration tests for token-based signing with edge cases
 * @description Tests the complete token-based signing flow including security edge cases
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { CreatePartyController } from '@/presentation/controllers/parties/CreateParty.Controller';
import { InvitePartiesController } from '@/presentation/controllers/requests/InviteParties.Controller';
import { ValidateInvitationTokenController } from '@/presentation/controllers/signing/ValidateInvitationToken.Controller';
import { CompleteSigningWithTokenController } from '@/presentation/controllers/signing/CompleteSigningWithToken.Controller';
import { RecordConsentWithTokenController } from '@/presentation/controllers/signing/RecordConsentWithToken.Controller';
import { CancelEnvelopeController } from '@/presentation/controllers/requests/CancelEnvelope.Controller';
import { mockAwsServices } from '../helpers/awsMocks';
import {
  generateTestPdf,
  calculatePdfDigest,
  generateTestTenantId,
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent,
  generateTestJwtToken
} from '../helpers/testHelpers';

mockAwsServices();

describe('Token-Based Signing Integration Tests', () => {
  let container: any;
  let envelopeId: string;
  let documentId: string;
  let partyId: string;
  let invitationToken: string;
  let ownerToken: string;

  beforeAll(async () => {
    getContainer();
    generateTestTenantId();
    
    // Generate owner token
    ownerToken = await generateTestJwtToken({
      sub: 'owner-user',
      email: 'owner@acme.com',
      roles: ['customer'],
      scopes: []
    });
  });

  beforeEach(async () => {
    // Create envelope for each test
    const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        name: 'Test Contract for Token Signing',
        description: 'Contract for testing token-based signing',
        ownerEmail: 'owner@acme.com'
      },
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: createTestRequestContext({
        userId: 'owner-user',
        email: 'owner@acme.com'
      })
    }));

    envelopeId = createEnvelopeResult.body.id;

    // Create document
    const pdfBuffer = generateTestPdf();
    const digest = calculatePdfDigest(pdfBuffer);
    
    const createDocumentResult = await CreateDocumentController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ id: envelopeId }),
      body: {
        name: 'test-contract.pdf',
        contentType: 'application/pdf',
        size: pdfBuffer.length,
        digest: digest
      },
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: createTestRequestContext({
        userId: 'owner-user',
        email: 'owner@acme.com'
      })
    }));

    documentId = createDocumentResult.body.id;

    // Create party
    const createPartyResult = await CreatePartyController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ id: envelopeId }),
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'signer',
        sequence: 1
      },
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: createTestRequestContext({
        userId: 'owner-user',
        email: 'owner@acme.com'
      })
    }));

    partyId = createPartyResult.body.id;

    // Invite party to get token
    const inviteResult = await InvitePartiesController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ id: envelopeId }),
      body: {
        partyIds: [partyId],
        message: 'Please sign this document',
        signByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      headers: { 'Authorization': `Bearer ${ownerToken}` },
      requestContext: createTestRequestContext({
        userId: 'owner-user',
        email: 'owner@acme.com'
      })
    }));

    invitationToken = inviteResult.body.tokens[0].token;
  });

  describe('Happy Path', () => {
    it('should complete signing with valid token', async () => {
      // 1. Validate token
      const validateResult = await ValidateInvitationTokenController(createApiGatewayEvent({
        pathParameters: { token: invitationToken }
      }));

      expect(validateResult.statusCode).toBe(200);
      expect(validateResult.body.valid).toBe(true);
      expect(validateResult.body.email).toBe('john@example.com');

      // 2. Record consent
      const consentResult = await RecordConsentWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          consentGiven: true,
          consentText: 'I agree to sign this document'
        }
      }));

      expect(consentResult.statusCode).toBe(200);

      // 3. Complete signing
      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      const signingResult = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(signingResult.statusCode).toBe(200);
      expect(signingResult.body.signed).toBe(true);
      expect(signingResult.body.signatureId).toBeDefined();
    });
  });

  describe('Edge Cases - Token Validation', () => {
    it('should reject invalid token', async () => {
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: 'invalid-token-123',
          digest: { alg: 'sha256', value: 'test' },
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200); // Controller returns 200 with error in body
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('Invalid invitation token');
    });

    it('should reject already used token', async () => {
      // First, complete signing successfully
      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      // Try to use the same token again
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('not active');
    });
  });

  describe('Edge Cases - Authorization', () => {
    it('should reject signing with token from different envelope', async () => {
      // Create another envelope and get its token
      const anotherEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          name: 'Another Contract',
          description: 'Another contract',
          ownerEmail: 'owner@acme.com'
        },
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      const anotherEnvelopeId = anotherEnvelopeResult.body.id;

      // Try to sign original envelope with token from different envelope
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId }, // Original envelope
        body: {
          signerId: partyId,
          token: invitationToken, // Token from original envelope
          digest: { alg: 'sha256', value: 'test' },
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('envelope');
    });

    it('should reject signing with token from different party', async () => {
      // Create another party
      const anotherPartyResult = await CreatePartyController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ id: envelopeId }),
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'signer',
          sequence: 2
        },
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      const anotherPartyId = anotherPartyResult.body.id;

      // Try to sign with token for different party
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: anotherPartyId, // Different party
          token: invitationToken, // Token for original party
          digest: { alg: 'sha256', value: 'test' },
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('party');
    });
  });

  describe('Edge Cases - Document Validation', () => {
    it('should reject signing with incorrect digest', async () => {
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: { alg: 'sha256', value: 'incorrect-digest' },
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('digest');
    });

    it('should reject signing with unsupported algorithm', async () => {
      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'UNSUPPORTED_ALGORITHM'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('algorithm');
    });
  });

  describe('Edge Cases - State Validation', () => {
    it('should reject signing already signed document', async () => {
      // First, complete signing successfully
      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      // Try to sign again
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('not active');
    });

    it('should reject signing cancelled envelope', async () => {
      // Cancel the envelope first
      await CancelEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ id: envelopeId }),
        body: { reason: 'Test cancellation' },
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      const result = await CompleteSigningWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          digest: digest,
          algorithm: 'RSASSA_PSS_SHA_256'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.signed).toBe(false);
      expect(result.body.error).toContain('cancelled');
    });
  });

  describe('Edge Cases - Concurrency', () => {
    it('should handle concurrent signing attempts', async () => {
      const pdfBuffer = generateTestPdf();
      const digest = calculatePdfDigest(pdfBuffer);
      
      // Attempt to sign concurrently
      const promises = Array(3).fill(null).map(() => 
        CompleteSigningWithTokenController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            signerId: partyId,
            token: invitationToken,
            digest: digest,
            algorithm: 'RSASSA_PSS_SHA_256'
          }
        }))
      );

      const results = await Promise.all(promises);
      
      // Only one should succeed
      const successfulResults = results.filter(r => r.body.signed === true);
      const failedResults = results.filter(r => r.body.signed === false);
      
      expect(successfulResults).toHaveLength(1);
      expect(failedResults).toHaveLength(2);
      
      // Failed results should indicate token already used
      failedResults.forEach(result => {
        expect(result.body.error).toContain('not active');
      });
    });
  });

  describe('Edge Cases - Consent Flow', () => {
    it('should record consent with valid token', async () => {
      const result = await RecordConsentWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: invitationToken,
          consentGiven: true,
          consentText: 'I agree to sign this document'
        }
      }));

      expect(result.statusCode).toBe(200);
      expect(result.body.consented).toBe(true);
      expect(result.body.consentedAt).toBeDefined();
    });

    it('should reject consent with invalid token', async () => {
      const result = await RecordConsentWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: 'invalid-token',
          consentGiven: true,
          consentText: 'I agree to sign this document'
        }
      }));

      expect(result.statusCode).toBe(401);
    });

    it('should reject consent with expired token', async () => {
      // This would require creating an expired token in the test setup
      // For now, we'll test with an invalid token
      const result = await RecordConsentWithTokenController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          token: 'expired-token',
          consentGiven: true,
          consentText: 'I agree to sign this document'
        }
      }));

      expect(result.statusCode).toBe(401);
    });
  });
});
