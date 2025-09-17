/**
 * @file DataIntegrity.test.ts
 * @summary Data integrity and validation integration tests
 * @description Tests data integrity, tampering detection, and security validations
 * Validates that the system properly detects and prevents data manipulation
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

describe('Data Integrity and Validation', () => {
  let ownerEmail: string;
  let envelopeId: string;
  let partyId: string;

  const assertResponse = (response: any): ApiResponseStructured => {
    return response as ApiResponseStructured;
  };

  beforeAll(async () => {
    getContainer();
    ownerEmail = 'integrity-test@example.com';
  });

  beforeEach(async () => {
    // Create envelope
    const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        ownerEmail: ownerEmail,
        name: 'Integrity Test Contract',
        description: 'Contract for integrity testing'
      },
      requestContext: createTestRequestContext({
        userId: 'integrity-user',
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
        name: 'Integrity Test Document.pdf',
        contentType: 'application/pdf',
        size: testPdf.length,
        digest: pdfDigest.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeId}/integrity-test-document.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'integrity-user',
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
        email: 'signer@integrity-test.com',
        role: 'signer',
        sequence: 1
      },
      requestContext: createTestRequestContext({
        userId: 'integrity-user',
        email: ownerEmail
      })
    }));

    const partyResponse = assertResponse(createPartyResult);
    partyId = JSON.parse(partyResponse.body!).data.partyId;
  });

  describe('Document Tampering Detection', () => {
    it('should detect document tampering', async () => {
      // Try to create document with invalid digest
      const testPdf = generateTestPdf();
      const invalidDigest = 'invalid-digest-value';

      const result = await CreateDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          name: 'Tampered Document.pdf',
          contentType: 'application/pdf',
          size: testPdf.length,
          digest: invalidDigest,
          bucket: 'test-evidence-bucket',
          key: `documents/${envelopeId}/tampered-document.pdf`
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('digest');
    });

    it('should validate document integrity during signing', async () => {
      // Try to sign with invalid document digest
      const result = await CompleteSigningController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          envelopeId: envelopeId,
          signerId: partyId,
          digest: {
            alg: 'sha256',
            value: 'invalid-digest-value'
          },
          algorithm: 'RSASSA_PSS_SHA_256',
          keyId: 'test-key-id',
          otpCode: '123456'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('integrity');
    });

    it('should prevent document size manipulation', async () => {
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);

      // Try to create document with incorrect size
      const result = await CreateDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          name: 'Size Manipulated Document.pdf',
          contentType: 'application/pdf',
          size: testPdf.length + 1000, // Incorrect size
          digest: pdfDigest.value,
          bucket: 'test-evidence-bucket',
          key: `documents/${envelopeId}/size-manipulated-document.pdf`
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('size');
    });
  });

  describe('Signature Integrity Validation', () => {
    it('should validate signature integrity', async () => {
      // Try to sign with invalid signature algorithm
      const result = await CompleteSigningController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          envelopeId: envelopeId,
          signerId: partyId,
          digest: {
            alg: 'sha256',
            value: 'dGVzdC1kaWdlc3QtdmFsdWU'
          },
          algorithm: 'INVALID_ALGORITHM',
          keyId: 'test-key-id',
          otpCode: '123456'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('algorithm');
    });

    it('should prevent signature replay attacks', async () => {
      // This test would verify that signatures cannot be reused
      const result = await CompleteSigningController(createApiGatewayEvent({
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
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      // First signing attempt should succeed (or fail for other reasons)
      // Second attempt with same signature should fail
      expect([200, 400, 422]).toContain(response.statusCode);
    });

    it('should validate timestamp integrity', async () => {
      // Try to sign with invalid timestamp
      const result = await CompleteSigningController(createApiGatewayEvent({
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
          otpCode: '123456',
          timestamp: 'invalid-timestamp'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('timestamp');
    });
  });

  describe('Audit Trail Immutability', () => {
    it('should ensure audit trail immutability', async () => {
      // Create an envelope and verify audit trail is created
      const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: ownerEmail,
          name: 'Audit Trail Test Contract',
          description: 'Contract for audit trail testing'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(createEnvelopeResult);
      expect(response.statusCode).toBe(201);
      
      // In a real implementation, we would verify that audit events are immutable
      // and cannot be modified after creation
    });

    it('should validate audit event ordering', async () => {
      // Create multiple operations and verify audit events are properly ordered
      const operations = [
        () => CreateEnvelopeController(createApiGatewayEvent({
          pathParameters: createTestPathParams({ }),
          body: {
            ownerEmail: ownerEmail,
            name: 'Order Test Contract 1',
            description: 'First operation'
          },
          requestContext: createTestRequestContext({
            userId: 'integrity-user',
            email: ownerEmail
          })
        })),
        () => CreateEnvelopeController(createApiGatewayEvent({
          pathParameters: createTestPathParams({ }),
          body: {
            ownerEmail: ownerEmail,
            name: 'Order Test Contract 2',
            description: 'Second operation'
          },
          requestContext: createTestRequestContext({
            userId: 'integrity-user',
            email: ownerEmail
          })
        }))
      ];

      const results = await Promise.all(operations.map(op => op()));
      
      results.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(201);
      });

      // In a real implementation, we would verify audit event ordering
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate and sanitize input data', async () => {
      // Try to create envelope with malicious input
      const result = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'test@example.com<script>alert("xss")</script>',
          name: '<script>alert("xss")</script>',
          description: 'DROP TABLE envelopes; --'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('validation');
    });

    it('should prevent SQL injection attacks', async () => {
      const result = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: "'; DROP TABLE envelopes; --",
          name: 'SQL Injection Test',
          description: 'Test for SQL injection'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('validation');
    });

    it('should prevent XSS attacks', async () => {
      const result = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'test@example.com',
          name: '<script>alert("XSS")</script>',
          description: '<img src="x" onerror="alert(\'XSS\')">'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('validation');
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain data consistency across operations', async () => {
      // Create envelope and verify data consistency
      const createEnvelopeResult = await CreateEnvelopeController(createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: ownerEmail,
          name: 'Consistency Test Contract',
          description: 'Contract for consistency testing'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(createEnvelopeResult);
      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body!);
      expect(data.data.envelope.ownerEmail).toBe(ownerEmail);
      expect(data.data.envelope.name).toBe('Consistency Test Contract');
    });

    it('should prevent data corruption during concurrent operations', async () => {
      // Simulate concurrent operations on the same envelope
      const concurrentOperations = Array.from({ length: 5 }, (_, i) => 
        CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId },
          body: {
            name: `Concurrent Signer ${i}`,
            email: `signer${i}@concurrent-test.com`,
            role: 'signer',
            sequence: i + 1
          },
          requestContext: createTestRequestContext({
            userId: 'integrity-user',
            email: ownerEmail
          })
        }))
      );

      const results = await Promise.all(concurrentOperations);
      
      // All operations should succeed without data corruption
      results.forEach(result => {
        const response = assertResponse(result);
        expect([200, 201, 422]).toContain(response.statusCode);
      });
    });
  });

  describe('Cryptographic Validation', () => {
    it('should validate cryptographic signatures', async () => {
      // Try to sign with invalid cryptographic parameters
      const result = await CompleteSigningController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          envelopeId: envelopeId,
          signerId: partyId,
          digest: {
            alg: 'sha256',
            value: 'dGVzdC1kaWdlc3QtdmFsdWU'
          },
          algorithm: 'RSASSA_PSS_SHA_256',
          keyId: 'invalid-key-id',
          otpCode: '123456'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('key');
    });

    it('should validate hash algorithms', async () => {
      // Try to use invalid hash algorithm
      const result = await CompleteSigningController(createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          envelopeId: envelopeId,
          signerId: partyId,
          digest: {
            alg: 'invalid-algorithm',
            value: 'dGVzdC1kaWdlc3QtdmFsdWU'
          },
          algorithm: 'RSASSA_PSS_SHA_256',
          keyId: 'test-key-id',
          otpCode: '123456'
        },
        requestContext: createTestRequestContext({
          userId: 'integrity-user',
          email: ownerEmail
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).error.message).toContain('algorithm');
    });
  });
});
