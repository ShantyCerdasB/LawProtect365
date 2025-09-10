/**
 * @file ConcurrencyTests.test.ts
 * @summary Concurrency and performance integration tests
 * @description Tests concurrent operations, race conditions, and high-volume scenarios
 * to ensure system stability under load
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { CreatePartyController } from '@/presentation/controllers/parties/CreateParty.Controller';
import { InvitePartiesController } from '@/presentation/controllers/requests/InviteParties.Controller';
import { RecordConsentController } from '@/presentation/controllers/signing/RecordConsent.Controller';
import { CompleteSigningController } from '@/presentation/controllers/signing/CompleteSigning.Controller';
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

describe('Concurrency and Performance', () => {
  let tenantId: string;
  let envelopeId: string;
  let partyIds: string[];
  let documentId: string;

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
        name: 'Concurrency Test Contract',
        description: 'Contract for concurrency testing'
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
        name: 'Concurrency Test Document.pdf',
        contentType: 'application/pdf',
        size: testPdf.length,
        digest: pdfDigest.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeId}/concurrency-test-document.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'user-123',
        email: 'owner@test.com'
      })
    }));

    const documentResponse = assertResponse(createDocumentResult);
    documentId = JSON.parse(documentResponse.body!).data.documentId;

    // Create parties
    const partyEmails = ['concurrent-signer1@test.com', 'concurrent-signer2@test.com', 'concurrent-signer3@test.com'];
    partyIds = [];

    for (const email of partyEmails) {
      const createPartyResult = await CreatePartyController(createApiGatewayEvent({
        pathParameters: { tenantId, envelopeId },
        body: {
          name: `Concurrent Signer ${partyEmails.indexOf(email) + 1}`,
          email,
          role: 'signer',
          sequence: partyEmails.indexOf(email) + 1
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const partyResponse = assertResponse(createPartyResult);
      partyIds.push(JSON.parse(partyResponse.body!).data.partyId);
    }
  });

  describe('Concurrent Signing Attempts', () => {
    it('should handle concurrent signing attempts', async () => {
      // Invite all parties first
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds,
          message: 'Please sign this document'
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Record consent for all parties
      const consentPromises = partyIds.map((partyId, index) => 
        RecordConsentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyId,
            consentGiven: true,
            consentText: 'I agree to sign this document electronically'
          },
          requestContext: createTestRequestContext({
            userId: `concurrent-signer-${index + 1}`,
            email: `concurrent-signer${index + 1}@test.com`
          })
        }))
      );

      const consentResults = await Promise.all(consentPromises);
      consentResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(200);
      });

      // Attempt concurrent signing
      const signingPromises = partyIds.map((partyId, index) => 
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyId,
            digest: 'test-digest',
            algorithm: 'RS256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: `concurrent-signer-${index + 1}`,
            email: `concurrent-signer${index + 1}@test.com`
          })
        }))
      );

      const signingResults = await Promise.all(signingPromises);
      signingResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle concurrent signing attempts with same signer', async () => {
      // Invite party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyIds[0]],
          message: 'Please sign this document'
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Record consent
      const recordConsentResult = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyIds[0],
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'concurrent-signer-1',
          email: 'concurrent-signer1@test.com'
        })
      }));

      const consentResponse = assertResponse(recordConsentResult);
      expect(consentResponse.statusCode).toBe(200);

      // Attempt concurrent signing with same signer
      const signingPromises = [
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyIds[0],
            digest: 'test-digest-1',
            algorithm: 'RS256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: 'concurrent-signer-1',
            email: 'concurrent-signer1@test.com'
          })
        })),
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyIds[0],
            digest: 'test-digest-2',
            algorithm: 'RS256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: 'concurrent-signer-1',
            email: 'concurrent-signer1@test.com'
          })
        }))
      ];

      const signingResults = await Promise.all(signingPromises);
      // One should succeed, one should fail due to concurrent access
      const successCount = signingResults.filter(result => {
        const response = assertResponse(result);
        return response.statusCode === 200;
      }).length;
      
      expect(successCount).toBe(1);
    });
  });

  describe('Concurrent Document Operations', () => {
    it('should handle concurrent document uploads', async () => {
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);

      // Attempt concurrent document uploads
      const uploadPromises = [
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Concurrent Document 1.pdf',
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/concurrent-document-1.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        })),
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Concurrent Document 2.pdf',
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/concurrent-document-2.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      ];

      const uploadResults = await Promise.all(uploadPromises);
      uploadResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });

    it('should handle concurrent document modifications', async () => {
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);

      // Attempt concurrent document modifications
      const modifyPromises = [
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Modified Document 1.pdf',
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/modified-document-1.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        })),
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Modified Document 2.pdf',
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/modified-document-2.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      ];

      const modifyResults = await Promise.all(modifyPromises);
      modifyResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });
  });

  describe('Concurrent Party Operations', () => {
    it('should handle concurrent party invitations', async () => {
      // Attempt concurrent party invitations
      const invitePromises = [
        InvitePartiesController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            partyIds: [partyIds[0]],
            message: 'Please sign this document'
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        })),
        InvitePartiesController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            partyIds: [partyIds[1]],
            message: 'Please sign this document'
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      ];

      const inviteResults = await Promise.all(invitePromises);
      inviteResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle concurrent party creation', async () => {
      // Attempt concurrent party creation
      const createPromises = [
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { tenantId, envelopeId },
          body: {
            name: 'Concurrent Party 1',
            email: 'concurrent-party1@test.com',
            role: 'signer',
            sequence: 4
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        })),
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { tenantId, envelopeId },
          body: {
            name: 'Concurrent Party 2',
            email: 'concurrent-party2@test.com',
            role: 'signer',
            sequence: 5
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      ];

      const createResults = await Promise.all(createPromises);
      createResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });
  });

  describe('High-Volume Scenarios', () => {
    it('should handle high-volume envelope creation', async () => {
      const createPromises = Array.from({ length: 10 }, (_, index) => 
        CreateEnvelopeController(createApiGatewayEvent({
          pathParameters: createTestPathParams({ tenantId }),
          body: {
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            name: `High Volume Contract ${index + 1}`,
            description: `Contract ${index + 1} for high volume testing`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      );

      const createResults = await Promise.all(createPromises);
      createResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });

    it('should handle high-volume party creation', async () => {
      const createPromises = Array.from({ length: 20 }, (_, index) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { tenantId, envelopeId },
          body: {
            name: `High Volume Party ${index + 1}`,
            email: `high-volume-party${index + 1}@test.com`,
            role: 'signer',
            sequence: index + 1
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      );

      const createResults = await Promise.all(createPromises);
      createResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });
  });

  describe('Race Condition Handling', () => {
    it('should handle race conditions in status updates', async () => {
      // Invite party
      const invitePartiesResult = await InvitePartiesController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          partyIds: [partyIds[0]],
          message: 'Please sign this document'
        },
        requestContext: createTestRequestContext({
          userId: 'user-123',
          email: 'owner@test.com'
        })
      }));

      const inviteResponse = assertResponse(invitePartiesResult);
      expect(inviteResponse.statusCode).toBe(200);

      // Record consent
      const recordConsentResult = await RecordConsentController(createApiGatewayEvent({
        pathParameters: { tenantId, id: envelopeId },
        body: {
          signerId: partyIds[0],
          consentGiven: true,
          consentText: 'I agree to sign this document electronically'
        },
        requestContext: createTestRequestContext({
          userId: 'concurrent-signer-1',
          email: 'concurrent-signer1@test.com'
        })
      }));

      const consentResponse = assertResponse(recordConsentResult);
      expect(consentResponse.statusCode).toBe(200);

      // Attempt concurrent status updates
      const statusUpdatePromises = [
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyIds[0],
            digest: 'test-digest-1',
            algorithm: 'RS256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: 'concurrent-signer-1',
            email: 'concurrent-signer1@test.com'
          })
        })),
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            signerId: partyIds[0],
            digest: 'test-digest-2',
            algorithm: 'RS256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: 'concurrent-signer-1',
            email: 'concurrent-signer1@test.com'
          })
        }))
      ];

      const statusUpdateResults = await Promise.all(statusUpdatePromises);
      // One should succeed, one should fail due to race condition
      const successCount = statusUpdateResults.filter(result => {
        const response = assertResponse(result);
        return response.statusCode === 200;
      }).length;
      
      expect(successCount).toBe(1);
    });

    it('should handle race conditions in document access', async () => {
      // Attempt concurrent document access
      const accessPromises = [
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Race Condition Document 1.pdf',
            contentType: 'application/pdf',
            size: 1000,
            digest: 'test-digest-1',
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/race-condition-document-1.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        })),
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { tenantId, id: envelopeId },
          body: {
            name: 'Race Condition Document 2.pdf',
            contentType: 'application/pdf',
            size: 1000,
            digest: 'test-digest-2',
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/race-condition-document-2.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'user-123',
            email: 'owner@test.com'
          })
        }))
      ];

      const accessResults = await Promise.all(accessPromises);
      accessResults.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });
  });
});
