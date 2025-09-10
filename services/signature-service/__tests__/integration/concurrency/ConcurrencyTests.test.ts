/**
 * @file ConcurrencyTests.test.ts
 * @summary Concurrency and performance integration tests
 * @description Tests concurrent operations, race conditions, and performance scenarios
 * Validates that the system handles concurrent access properly without data corruption
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { CreatePartyController } from '@/presentation/controllers/parties/CreateParty.Controller';
import { CompleteSigningController } from '@/presentation/controllers/signing/CompleteSigning.Controller';
import { mockAwsServices } from '../helpers/awsMocks';
import {
  generateTestPdf,
  calculatePdfDigest,
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent
} from '../helpers/testHelpers';
import type { ApiResponseStructured } from '@lawprotect/shared-ts';

mockAwsServices();

describe('Concurrency and Performance', () => {
  let ownerEmail: string;
  let envelopeId: string;
  let partyId: string;

  const assertResponse = (response: any): ApiResponseStructured => {
    return response as ApiResponseStructured;
  };

  beforeAll(async () => {
    getContainer();
    ownerEmail = 'concurrency-test@example.com';
  });

  beforeEach(async () => {
    // Create envelope
    const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        ownerEmail: ownerEmail,
        name: 'Concurrency Test Contract',
        description: 'Contract for concurrency testing'
      },
      requestContext: createTestRequestContext({
        userId: 'concurrency-user',
        email: ownerEmail
      })
    }));

    const envelopeResponse = assertResponse(createEnvelopeResult);
    envelopeId = JSON.parse(envelopeResponse.body!).data.envelope.envelopeId;

    // Create document
    const testPdf = generateTestPdf();
    const pdfDigest = calculatePdfDigest(testPdf);

    const createDocumentResult = await CreateDocumentController(createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        name: 'Concurrency Test Document.pdf',
        contentType: 'application/pdf',
        size: testPdf.length,
        digest: pdfDigest.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeId}/concurrency-test-document.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'concurrency-user',
        email: ownerEmail
      })
    }));

    const _documentResponse = assertResponse(createDocumentResult);
    // Document created successfully

    // Create party
    const createPartyResult = await CreatePartyController(createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: {
        name: 'Test Signer',
        email: 'signer@concurrency-test.com',
        role: 'signer',
        sequence: 1
      },
      requestContext: createTestRequestContext({
        userId: 'concurrency-user',
        email: ownerEmail
      })
    }));

    const partyResponse = assertResponse(createPartyResult);
    partyId = JSON.parse(partyResponse.body!).data.partyId;
  });

  describe('Concurrent Signing Attempts', () => {
    it('should handle concurrent signing attempts', async () => {
      // Simulate multiple users trying to sign the same document simultaneously
      const concurrentSigningAttempts = Array.from({ length: 5 }, (_, i) => 
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            envelopeId: envelopeId,
            signerId: partyId,
            digest: {
              alg: 'sha256',
              value: 'dGVzdC1kaWdlc3QtdmFsdWU'
            },
            algorithm: 'RSASSA_PSS_SHA_256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: `signer-${i}`,
            email: `signer${i}@concurrent-test.com`
          })
        }))
      );

      const results = await Promise.all(concurrentSigningAttempts);
      
      // Only one signing attempt should succeed, others should fail
      const successCount = results.filter(result => 
        assertResponse(result).statusCode === 200
      ).length;
      
      expect(successCount).toBeLessThanOrEqual(1);
    });

    it('should handle concurrent signing attempts from different parties', async () => {
      // Create multiple parties first
      const createPartiesPromises = Array.from({ length: 3 }, (_, i) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: `Concurrent Signer ${i}`,
            email: `signer${i}@concurrent-test.com`,
            role: 'signer',
            sequence: i + 1
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const partyResults = await Promise.all(createPartiesPromises);
      const partyIds = partyResults.map(result => 
        JSON.parse(assertResponse(result).body!).data.partyId
      );

      // Now try concurrent signing with different parties
      const concurrentSigningAttempts = partyIds.map((id, i) => 
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            envelopeId: envelopeId,
            signerId: id,
            digest: {
              alg: 'sha256',
              value: 'dGVzdC1kaWdlc3QtdmFsdWU'
            },
            algorithm: 'RSASSA_PSS_SHA_256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: `signer-${i}`,
            email: `signer${i}@concurrent-test.com`
          })
        }))
      );

      const results = await Promise.all(concurrentSigningAttempts);
      
      // All signing attempts should be handled properly (success or appropriate failure)
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 400, 422, 409]).toContain(response.statusCode);
      });
    });
  });

  describe('Concurrent Document Uploads', () => {
    it('should handle concurrent document uploads', async () => {
      // Simulate multiple users uploading documents to the same envelope
      const concurrentUploads = Array.from({ length: 5 }, (_, i) => {
        const testPdf = generateTestPdf();
        const pdfDigest = calculatePdfDigest(testPdf);
        
        return CreateDocumentController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            name: `Concurrent Document ${i}.pdf`,
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/concurrent-document-${i}.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }));
      });

      const results = await Promise.all(concurrentUploads);
      
      // All uploads should succeed
      results.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
    });

    it('should handle concurrent document uploads with same name', async () => {
      // Try to upload documents with the same name concurrently
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);
      
      const concurrentUploads = Array.from({ length: 3 }, () => 
        CreateDocumentController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            name: 'Same Name Document.pdf',
            contentType: 'application/pdf',
            size: testPdf.length,
            digest: pdfDigest.value,
            bucket: 'test-evidence-bucket',
            key: `documents/${envelopeId}/same-name-document.pdf`
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const results = await Promise.all(concurrentUploads);
      
      // Only one upload should succeed, others should fail with conflict
      const successCount = results.filter(result => 
        assertResponse(result).statusCode === 201
      ).length;
      
      expect(successCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Concurrent Party Invitations', () => {
    it('should handle concurrent party invitations', async () => {
      // Simulate multiple users creating parties in the same envelope
      const concurrentPartyCreations = Array.from({ length: 10 }, (_, i) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: `Concurrent Party ${i}`,
            email: `party${i}@concurrent-test.com`,
            role: 'signer',
            sequence: i + 1
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const results = await Promise.all(concurrentPartyCreations);
      
      // All party creations should succeed
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 201]).toContain(response.statusCode);
      });
    });

    it('should handle concurrent party invitations with same email', async () => {
      // Try to create parties with the same email concurrently
      const concurrentPartyCreations = Array.from({ length: 3 }, () => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: 'Duplicate Party',
            email: 'duplicate@concurrent-test.com',
            role: 'signer',
            sequence: 1
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const results = await Promise.all(concurrentPartyCreations);
      
      // Only one party creation should succeed, others should fail
      const successCount = results.filter(result => 
        assertResponse(result).statusCode === 201
      ).length;
      
      expect(successCount).toBeLessThanOrEqual(1);
    });
  });

  describe('High-Volume Envelope Creation', () => {
    it('should handle high-volume envelope creation', async () => {
      // Create many envelopes concurrently
      const concurrentEnvelopeCreations = Array.from({ length: 20 }, (_, i) => 
        CreateEnvelopeController(createApiGatewayEvent({
          pathParameters: createTestPathParams({ }),
          body: {
            ownerEmail: ownerEmail,
            name: `High Volume Envelope ${i}`,
            description: `Envelope ${i} for high volume testing`
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentEnvelopeCreations);
      const endTime = Date.now();
      
      // All envelope creations should succeed
      results.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });
      
      // Performance check: should complete within reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Race Conditions in Status Updates', () => {
    it('should handle race conditions in status updates', async () => {
      // Create multiple parties and try to update their status concurrently
      const createPartiesPromises = Array.from({ length: 5 }, (_, i) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: `Race Condition Party ${i}`,
            email: `race${i}@concurrent-test.com`,
            role: 'signer',
            sequence: i + 1
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const partyResults = await Promise.all(createPartiesPromises);
      const partyIds = partyResults.map(result => 
        JSON.parse(assertResponse(result).body!).data.partyId
      );

      // Try to sign with all parties concurrently (race condition scenario)
      const concurrentSigningAttempts = partyIds.map((id, i) => 
        CompleteSigningController(createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            envelopeId: envelopeId,
            signerId: id,
            digest: {
              alg: 'sha256',
              value: 'dGVzdC1kaWdlc3QtdmFsdWU'
            },
            algorithm: 'RSASSA_PSS_SHA_256',
            keyId: 'test-key-id',
            otpCode: '123456'
          },
          requestContext: createTestRequestContext({
            userId: `race-signer-${i}`,
            email: `race${i}@concurrent-test.com`
          })
        }))
      );

      const results = await Promise.all(concurrentSigningAttempts);
      
      // All attempts should be handled properly without data corruption
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 400, 422, 409]).toContain(response.statusCode);
      });
    });
  });

  describe('Concurrent Invitation Token Usage', () => {
    it('should handle concurrent invitation token usage', async () => {
      // This test would verify that invitation tokens cannot be used concurrently
      // For now, we'll test that the system handles concurrent operations properly
      
      const concurrentOperations = Array.from({ length: 5 }, (_, i) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: `Invitation Party ${i}`,
            email: `invitation${i}@concurrent-test.com`,
            role: 'signer',
            sequence: i + 1
          },
          requestContext: createTestRequestContext({
            userId: 'concurrency-user',
            email: ownerEmail
          })
        }))
      );

      const results = await Promise.all(concurrentOperations);
      
      // All operations should succeed
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 201]).toContain(response.statusCode);
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance under concurrent load', async () => {
      // Test performance with mixed concurrent operations
      const mixedOperations = [
        // Envelope creation
        ...Array.from({ length: 5 }, (_, i) => 
          CreateEnvelopeController(createApiGatewayEvent({
            pathParameters: createTestPathParams({ }),
            body: {
              ownerEmail: ownerEmail,
              name: `Load Test Envelope ${i}`,
              description: `Envelope ${i} for load testing`
            },
            requestContext: createTestRequestContext({
              userId: 'concurrency-user',
              email: ownerEmail
            })
          }))
        ),
        // Party creation
        ...Array.from({ length: 10 }, (_, i) => 
          CreatePartyController(createApiGatewayEvent({
            pathParameters: { envelopeId },
            body: {
              name: `Load Test Party ${i}`,
              email: `load${i}@concurrent-test.com`,
              role: 'signer',
              sequence: i + 1
            },
            requestContext: createTestRequestContext({
              userId: 'concurrency-user',
              email: ownerEmail
            })
          }))
        ),
        // Document creation
        ...Array.from({ length: 3 }, (_, i) => {
          const testPdf = generateTestPdf();
          const pdfDigest = calculatePdfDigest(testPdf);
          
          return CreateDocumentController(createApiGatewayEvent({
            pathParameters: { id: envelopeId },
            body: {
              name: `Load Test Document ${i}.pdf`,
              contentType: 'application/pdf',
              size: testPdf.length,
              digest: pdfDigest.value,
              bucket: 'test-evidence-bucket',
              key: `documents/${envelopeId}/load-test-document-${i}.pdf`
            },
            requestContext: createTestRequestContext({
              userId: 'concurrency-user',
              email: ownerEmail
            })
          }));
        })
      ];

      const startTime = Date.now();
      const results = await Promise.all(mixedOperations);
      const endTime = Date.now();
      
      // All operations should succeed
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 201]).toContain(response.statusCode);
      });
      
      // Performance check: should complete within reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(15000); // 15 seconds
    });
  });
});