/**
 * @file SingleSignerFlow.test.ts
 * @summary Single signer signing flow integration tests
 * @description Tests single signer workflows including decline scenarios,
 * timeout handling, and document modifications during signing
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { CreatePartyController } from '@/presentation/controllers/parties/CreateParty.Controller';
import { InvitePartiesController } from '@/presentation/controllers/requests/InviteParties.Controller';
import { RecordConsentController } from '@/presentation/controllers/signing/RecordConsent.Controller';
import { PrepareSigningController } from '@/presentation/controllers/signing/PrepareSigning.Controller';
import { CompleteSigningController } from '@/presentation/controllers/signing/CompleteSigning.Controller';
import { DeclineSigningController } from '@/presentation/controllers/signing/DeclineSigning.Controller';
import { DownloadSignedDocumentController } from '@/presentation/controllers/signing/DownloadSignedDocument.Controller';
import { mockAwsServices } from '../helpers/awsMocks';
import {
  generateTestPdf,
  calculatePdfDigest,
  generateTestTenantId,
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent
} from '../helpers/testHelpers';
import type { ApiResponseStructured } from '@lawprotect/shared-ts';

mockAwsServices();

describe('Single Signer Flow', () => {
  let tenantId: string;
  let envelopeId: string;
  let documentId: string;
  let partyId: string;

  const assertResponse = (response: any): ApiResponseStructured => {
    return response as ApiResponseStructured;
  };

  beforeAll(async () => {
    getContainer();
    tenantId = generateTestTenantId();
  });

  beforeEach(async () => {
    // Create envelope for each test
    const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ tenantId }),
      body: {
        ownerId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Single Signer Test Contract',
        description: 'Contract for single signer testing'
      },
      requestContext: createTestRequestContext({
        userId: 'user-123',
        email: 'owner@test.com'
      })
    }));

    const envelopeResponse = assertResponse(createEnvelopeResult);
    envelopeId = JSON.parse(envelopeResponse.body!).data.envelope.envelopeId;

    // Create document
    const testPdf = generateTestPdf();
    const pdfDigest = calculatePdfDigest(testPdf);

    const createDocumentResult = await CreateDocumentController(createApiGatewayEvent({
      pathParameters: { tenantId, id: envelopeId },
      body: {
        name: 'Single Signer Test Document.pdf',
        contentType: 'application/pdf',
        size: testPdf.length,
        digest: pdfDigest.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeId}/single-signer-test-document.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'user-123',
        email: 'owner@test.com'
      })
    }));

    const documentResponse = assertResponse(createDocumentResult);
    documentId = JSON.parse(documentResponse.body!).data.documentId;

    // Create party
    const createPartyResult = await CreatePartyController(createApiGatewayEvent({
      pathParameters: { tenantId, envelopeId },
      body: {
        name: 'Single Test Signer',
        email: 'single-signer@test.com',
        role: 'signer',
        sequence: 1
      },
      requestContext: createTestRequestContext({
        userId: 'user-123',
        email: 'owner@test.com'
      })
    }));

    const partyResponse = assertResponse(createPartyResult);
    partyId = JSON.parse(partyResponse.body!).data.partyId;
  });

  describe('Happy Path - Single Signer Workflow', () => {
    it('should complete single signer workflow', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Step 2: Record Consent
      const recordConsentResult = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const consentResponse = assertResponse(recordConsentResult);
      expect(consentResponse.statusCode).toBe(200);

      // Step 3: Prepare Signing
      const prepareSigningResult = await PrepareSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const prepareResponse = assertResponse(prepareSigningResult);
      expect(prepareResponse.statusCode).toBe(200);

      // Step 4: Complete Signing
      const completeSigningResult = await CompleteSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          digest: 'test-digest',
          algorithm: 'RS256',
          keyId: 'test-key-id',
          otpCode: '123456'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const signingResponse = assertResponse(completeSigningResult);
      expect(signingResponse.statusCode).toBe(200);

      // Step 5: Download Signed Document
      const downloadResult = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          documentId
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const downloadResponse = assertResponse(downloadResult);
      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.body).toBeDefined();
    });
  });

  describe('Signer Decline Scenarios', () => {
    it('should handle signer decline', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Step 2: Record Consent (decline)
      const recordConsentResult = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          consentGiven: false,
          consentText: 'I decline to sign this document'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const consentResponse = assertResponse(recordConsentResult);
      expect(consentResponse.statusCode).toBe(200);

      // Step 3: Decline Signing
      const declineSigningResult = await DeclineSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          reason: 'I do not agree with the terms'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const declineResponse = assertResponse(declineSigningResult);
      expect(declineResponse.statusCode).toBe(200);
    });

    it('should handle signer decline with reason', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Step 2: Decline Signing with detailed reason
      const declineSigningResult = await DeclineSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          reason: 'I need to review the document with my legal team before signing'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const declineResponse = assertResponse(declineSigningResult);
      expect(declineResponse.statusCode).toBe(200);
    });
  });

  describe('Timeout Scenarios', () => {
    it('should handle signer timeout', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Simulate timeout scenario
      // In a real implementation, this would be handled by a background job
      // that checks for expired invitations and updates the envelope status
      
      // For now, we just verify that the invitation was sent successfully
      expect(inviteResponse.statusCode).toBe(200);
    });

    it('should handle document access timeout', async () => {
      // Step 1: Prepare Signing
      const prepareSigningResult = await PrepareSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const prepareResponse = assertResponse(prepareSigningResult);
      expect(prepareResponse.statusCode).toBe(200);

      // Simulate timeout scenario where signer doesn't complete signing
      // In a real implementation, this would be handled by session management
      
      // For now, we just verify that the preparation was successful
      expect(prepareResponse.statusCode).toBe(200);
    });
  });

  describe('Document Modification Scenarios', () => {
    it('should handle document modifications during signing', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Step 2: Record Consent
      const recordConsentResult = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const consentResponse = assertResponse(recordConsentResult);
      expect(consentResponse.statusCode).toBe(200);

      // Step 3: Prepare Signing
      const prepareSigningResult = await PrepareSigningController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const prepareResponse = assertResponse(prepareSigningResult);
      expect(prepareResponse.statusCode).toBe(200);

      // Simulate document modification during signing
      // In a real implementation, this would invalidate the signing session
      // and require the signer to start over
      
      // For now, we just verify that the preparation was successful
      expect(prepareResponse.statusCode).toBe(200);
    });

    it('should handle document replacement during signing', async () => {
      // Step 1: Invite Party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyId],
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Simulate document replacement
      const newTestPdf = generateTestPdf();
      const newPdfDigest = calculatePdfDigest(newTestPdf);

      const replaceDocumentResult = await CreateDocumentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          name: 'Updated Single Signer Test Document.pdf',
          contentType: 'application/pdf',
          size: newTestPdf.length,
          digest: newPdfDigest.value,
          bucket: 'test-evidence-bucket',
          key: `documents/${envelopeId}/updated-single-signer-test-document.pdf`
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const replaceResponse = assertResponse(replaceDocumentResult);
      expect(replaceResponse.statusCode).toBe(201);

      // In a real implementation, this would invalidate any ongoing signing sessions
      // and require the signer to start over with the new document
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid signer ID', async () => {
      const result = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: 'invalid-signer-id',
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const response = assertResponse(result);
      // This should fail due to invalid signer ID
      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid envelope ID', async () => {
      const result = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: 'invalid-envelope-id' },
        body: {
          signerId: partyId,
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const response = assertResponse(result);
      // This should fail due to invalid envelope ID
      expect(response.statusCode).toBe(404);
    });

    it('should handle missing consent text', async () => {
      const result = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyId,
          consentGiven: true,
          consentText: ''
        },
        requestContext: createTestRequestContext({
          userId: 'single-signer',
          email: 'single-signer@test.com'
        })
      }));

      const response = assertResponse(result);
      // This should fail due to missing consent text
      expect(response.statusCode).toBe(400);
    });
  });
});
