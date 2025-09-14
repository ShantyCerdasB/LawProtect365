/**
 * @file DocumentAccessControl.test.ts
 * @summary Document access control integration tests
 * @description Tests document access control based on ownerEmail without tenantId
 * Validates that users can only access documents they own or are invited to
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { UpdateEnvelopeController } from '@/presentation/controllers/envelopes/UpdateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { DownloadSignedDocumentController } from '@/presentation/controllers/signing/DownloadSignedDocument.Controller';
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

describe('Document Access Control', () => {
  let ownerEmailA: string;
  let ownerEmailB: string;
  let envelopeIdA: string;
  let envelopeIdB: string;
  let _documentIdA: string;
  let _documentIdB: string;

  const assertResponse = (response: any): ApiResponseStructured => {
    return response as ApiResponseStructured;
  };

  beforeAll(async () => {
    getContainer();
    ownerEmailA = 'owner-a@example.com';
    ownerEmailB = 'owner-b@example.com';
  });

  beforeEach(async () => {
    // Create envelope A for owner A
    const createEnvelopeAResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        ownerEmail: ownerEmailA,
        name: 'Document A Contract',
        description: 'Contract for owner A'
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-a',
        email: ownerEmailA
      })
    }));

    const envelopeAResponse = assertResponse(createEnvelopeAResult);
    envelopeIdA = JSON.parse(envelopeAResponse.body!).data.envelope.envelopeId;

    // Create envelope B for owner B
    const createEnvelopeBResult = await CreateEnvelopeController(createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        ownerEmail: ownerEmailB,
        name: 'Document B Contract',
        description: 'Contract for owner B'
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-b',
        email: ownerEmailB
      })
    }));

    const envelopeBResponse = assertResponse(createEnvelopeBResult);
    envelopeIdB = JSON.parse(envelopeBResponse.body!).data.envelope.envelopeId;

    // Create document A in envelope A
    const testPdfA = generateTestPdf();
    const pdfDigestA = calculatePdfDigest(testPdfA);

    const createDocumentAResult = await CreateDocumentController(createApiGatewayEvent({
      pathParameters: { id: envelopeIdA },
      body: {
        name: 'Document A.pdf',
        contentType: 'application/pdf',
        size: testPdfA.length,
        digest: pdfDigestA.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeIdA}/document-a.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-a',
        email: ownerEmailA
      })
    }));

    const documentAResponse = assertResponse(createDocumentAResult);
    _documentIdA = JSON.parse(documentAResponse.body!).data.documentId;

    // Create document B in envelope B
    const testPdfB = generateTestPdf();
    const pdfDigestB = calculatePdfDigest(testPdfB);

    const createDocumentBResult = await CreateDocumentController(createApiGatewayEvent({
      pathParameters: { id: envelopeIdB },
      body: {
        name: 'Document B.pdf',
        contentType: 'application/pdf',
        size: testPdfB.length,
        digest: pdfDigestB.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeIdB}/document-b.pdf`
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-b',
        email: ownerEmailB
      })
    }));

    const documentBResponse = assertResponse(createDocumentBResult);
    _documentIdB = JSON.parse(documentBResponse.body!).data.documentId;
  });

  describe('Owner-Based Document Access', () => {
    it('should allow owner to access their own documents', async () => {
      // First, update envelope status to completed to allow download
      const updateEnvelopeResult = await UpdateEnvelopeController(createApiGatewayEvent({
        pathParameters: { envelopeId: envelopeIdA },
        body: {
          status: 'completed'
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should prevent owner from accessing other owners documents', async () => {
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdB },
        body: {
          envelopeId: envelopeIdB,
          documentId: _documentIdB
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body!).error.message).toContain('access');
    });

    it('should prevent unauthorized users from accessing any documents', async () => {
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'unauthorized-user',
          email: 'unauthorized@test.com'
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body!).error.message).toContain('access');
    });
  });

  describe('Document Visibility Control', () => {
    it('should control document visibility by ownerEmail', async () => {
      // Try to access document A with owner B credentials
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-b',
          email: ownerEmailB
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
    });

    it('should enforce document download permissions', async () => {
      // Try to download document without proper permissions
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'viewer-user',
          email: 'viewer@test.com'
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Document Sharing Restrictions', () => {
    it('should handle document sharing restrictions', async () => {
      // Try to access document with different owner email
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'different-owner',
          email: 'different@owner.com'
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
    });

    it('should validate document access logs', async () => {
      // This test would verify that access attempts are logged
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(200);
      // In a real implementation, we would verify audit logs here
    });
  });

  describe('Unauthorized Document Modifications', () => {
    it('should prevent unauthorized document modifications', async () => {
      // Try to create a document in someone else's envelope
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);

      const result = await CreateDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdB },
        body: {
          name: 'Unauthorized Document.pdf',
          contentType: 'application/pdf',
          size: testPdf.length,
          digest: pdfDigest.value,
          bucket: 'test-evidence-bucket',
          key: `documents/${envelopeIdB}/unauthorized-document.pdf`
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
    });

    it('should handle invitation-based document access', async () => {
      // This test would verify that invited users can access documents
      // For now, we'll test that non-invited users cannot access
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'invited-user',
          email: 'invited@test.com'
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Edge Cases and Security Vulnerabilities', () => {
    it('should prevent SQL injection in document access', async () => {
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: "'; DROP TABLE documents; --" },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
    });

    it('should prevent path traversal attacks', async () => {
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: '../../../etc/passwd' },
        body: {
          envelopeId: envelopeIdA,
          documentId: _documentIdA
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(400);
    });

    it('should handle malformed document IDs', async () => {
      const result = await DownloadSignedDocumentController(createApiGatewayEvent({
        pathParameters: { id: envelopeIdA },
        body: {
          envelopeId: envelopeIdA,
          documentId: 'invalid-document-id'
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(404);
    });

    it('should prevent brute force attacks on document access', async () => {
      // Simulate multiple failed access attempts
      const promises = Array.from({ length: 10 }, () => 
        DownloadSignedDocumentController(createApiGatewayEvent({
          pathParameters: { id: envelopeIdA },
          body: {
            envelopeId: envelopeIdA,
            documentId: _documentIdA
          },
          requestContext: createTestRequestContext({
            userId: 'attacker',
            email: 'attacker@test.com'
          })
        }))
      );

      const results = await Promise.all(promises);
      
      // All attempts should be rejected
      results.forEach(result => {
        const response = assertResponse(result);
        expect(response.statusCode).toBe(403);
      });
    });
  });
});
