/**
 * @file SecurityAuthorization.test.ts
 * @summary Security and authorization integration tests
 * @description Tests critical security validations including cross-owner access,
 * unauthorized operations, and authentication/authorization edge cases
 * Updated for Rocket Lawyer model without tenantId
 */

import { getContainer } from '@/core/Container';
import { CreateEnvelopeController } from '@/presentation/controllers/envelopes/CreateEnvelope.Controller';
import { CreateDocumentController } from '@/presentation/controllers/documents/CreateDocument.Controller';
import { CreatePartyController } from '@/presentation/controllers/parties/CreateParty.Controller';
import { CreateInputsController } from '@/presentation/controllers/inputs/CreateInputs.Controller';
import { InvitePartiesController } from '@/presentation/controllers/requests/InviteParties.Controller';
import { CompleteSigningController } from '@/presentation/controllers/signing/CompleteSigning.Controller';
import { DownloadSignedDocumentController } from '@/presentation/controllers/signing/DownloadSignedDocument.Controller';
// Using real repositories with DynamoDB Local - no need for repository mocks
import {
  generateTestPdf,
  calculatePdfDigest,
  createTestRequestContext,
  createTestPathParams,
  createApiGatewayEvent,
  generateTestJwtToken
} from '../helpers/testHelpers';
// Using real repositories with DynamoDB Local - no need to mock AWS services

describe('Security and Authorization', () => {
  let ownerEmailA: string;
  let ownerEmailB: string;
  let envelopeId: string;
  let partyId: string;

  beforeAll(async () => {
    getContainer();
    ownerEmailA = 'owner-a@example.com';
    ownerEmailB = 'owner-b@example.com';
  });

  beforeEach(async () => {
    // Create envelope for owner A
    const authToken = await generateTestJwtToken({
      sub: 'user-owner-a',
      email: ownerEmailA,
      roles: ['customer'],
      scopes: []
    });
    
    const createEnvelopeResult = await CreateEnvelopeController(await createApiGatewayEvent({
      pathParameters: createTestPathParams({ }),
      body: {
        ownerEmail: ownerEmailA,
        name: 'Security Test Contract'
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-a',
        email: ownerEmailA
      }),
      authToken: authToken
    }));

    console.log('CreateEnvelope response:', createEnvelopeResult);
    envelopeId = JSON.parse((createEnvelopeResult as any).body!).data.envelope.envelopeId;

    // Create document
    const testPdf = generateTestPdf();
    const pdfDigest = calculatePdfDigest(testPdf);

    const createDocumentResult = await CreateDocumentController(await createApiGatewayEvent({
      pathParameters: { id: envelopeId },
      body: {
        name: 'Security Test Document.pdf',
        contentType: 'application/pdf',
        size: testPdf.length,
        digest: pdfDigest.value,
        bucket: 'test-evidence-bucket',
        key: `documents/${envelopeId}/security-test-document.pdf`
      },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
    }));

    console.log('CreateDocument response:', createDocumentResult);
    // Document created successfully

    // Create party
    const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: {
        name: 'Test Signer',
        email: 'signer@test.com',
        role: 'signer',
        sequence: 1
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-a',
        email: ownerEmailA
      })
    }));

    console.log('CreateParty response:', createPartyResult);
    partyId = JSON.parse((createPartyResult as any).body!).data.party.partyId;

    // Create input field for signing (required before inviting parties)
    await CreateInputsController(await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: {
        documentId: JSON.parse((createDocumentResult as any).body!).data.documentId,
        inputs: [{
          type: 'signature',
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          page: 1,
          partyId: partyId
        }]
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      requestContext: createTestRequestContext({
        userId: 'user-owner-a',
        email: ownerEmailA
      })
    }));

    // Input created successfully
  });

  describe('Cross-Owner Access Prevention', () => {
    it('should prevent cross-owner envelope access', async () => {
      // Generate token for owner A (who should not be able to create envelopes for owner B)
      const authToken = await generateTestJwtToken({
        sub: 'user-owner-a',
        email: ownerEmailA,
        roles: ['customer'],
        scopes: []
      });

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: ownerEmailB,
          name: 'Unauthorized Contract',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA
        })
      }));

      // This should fail due to cross-owner access prevention
      expect((result as any).statusCode).toBe(403);
    });

    it('should prevent cross-owner document access', async () => {
      // Generate token for owner B (who should not be able to create documents in owner A's envelope)
      const authToken = await generateTestJwtToken({
        sub: 'user-owner-b',
        email: ownerEmailB,
        roles: ['customer'],
        scopes: []
      });

      const result = await CreateDocumentController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          name: 'Unauthorized Document.pdf',
          contentType: 'application/pdf',
          size: 1000,
          digest: 'test-digest',
          bucket: 'test-evidence-bucket',
          key: 'unauthorized-document.pdf'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-b',
          email: ownerEmailB
        })
      }));

      // This should fail due to cross-owner access
      expect((result as any).statusCode).toBe(403);
    });

    it('should prevent cross-owner party access', async () => {
      // Generate token for owner B (who should not be able to create parties in owner A's envelope)
      const authToken = await generateTestJwtToken({
        sub: 'user-owner-b',
        email: ownerEmailB,
        roles: ['customer'],
        scopes: []
      });

      const result = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId },
        body: {
          name: 'Unauthorized Signer',
          email: 'unauthorized@test.com',
          role: 'signer',
          sequence: 1
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-b',
          email: ownerEmailB
        })
      }));

      // This should fail due to cross-owner access
      expect((result as any).statusCode).toBe(403);
    });
  });

  describe('Unauthorized Operations', () => {
    it('should reject unauthorized envelope access', async () => {
      // Generate token for unauthorized user
      const authToken = await generateTestJwtToken({
        sub: 'unauthorized-user',
        email: 'unauthorized@test.com',
        roles: ['customer'],
        scopes: []
      });

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'different-owner@test.com', // Different from auth context
          name: 'Unauthorized Contract',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'unauthorized-user',
          email: 'unauthorized@test.com' // Different from ownerEmail
        })
      }));

      // This should fail due to unauthorized access
      expect((result as any).statusCode).toBe(403);
    });

    it('should reject unauthorized document downloads', async () => {
      // Generate token for unauthorized user (different from envelope owner)
      const authToken = await generateTestJwtToken({
        sub: 'unauthorized-user',
        email: 'unauthorized@test.com',
        roles: ['customer'],
        scopes: []
      });

      const result = await DownloadSignedDocumentController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          envelopeId: envelopeId
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'unauthorized-user',
          email: 'unauthorized@test.com'
        })
      }));

      // This should fail due to unauthorized access
      expect((result as any).statusCode).toBe(403);
    });

    it('should reject unauthorized signing attempts', async () => {
      // Generate token for unauthorized user (different from envelope owner)
      const authToken = await generateTestJwtToken({
        sub: 'unauthorized-user',
        email: 'unauthorized@test.com',
        roles: ['customer'],
        scopes: []
      });

      const result = await CompleteSigningController(await createApiGatewayEvent({
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
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'unauthorized-user',
          email: 'unauthorized@test.com'
        })
      }));

      // This should fail due to unauthorized access
      expect((result as any).statusCode).toBe(403);
    });
  });

  describe('Authentication and Authorization Edge Cases', () => {
    it('should handle missing authentication context', async () => {
      // No token provided - should fail with 401
      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'test@example.com',
          name: 'No Auth Contract',
        },
        includeAuth: false, // Explicitly disable auth token generation
        requestContext: createTestRequestContext({
          userId: '',
          email: ''
        })
      }));

      // This should fail due to missing auth context
      expect((result as any).statusCode).toBe(401);
    });

    it('should validate JWT token expiration', async () => {
      // Generate expired token
      const expiredToken = await generateTestJwtToken({
        sub: 'expired-user',
        email: 'expired@test.com',
        roles: ['customer'],
        scopes: []
      }, '-1h'); // Expired 1 hour ago

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'expired@test.com',
          name: 'Expired Token Contract',
        },
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'expired-user',
          email: 'expired@test.com'
        })
      }));

      // This should fail due to expired token
      expect((result as any).statusCode).toBe(401);
      expect((result as any).body).toContain('Token expired');
    });

    it('should handle invalid JWT tokens', async () => {
      // Test with malformed token (not a valid JWT)
      const malformedToken = 'invalid.jwt.token';

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'invalid@test.com',
          name: 'Invalid Token Contract',
        },
        headers: {
          'Authorization': `Bearer ${malformedToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'invalid-user',
          email: 'invalid@test.com'
        })
      }));

      // This should fail due to invalid token format
      expect((result as any).statusCode).toBe(401);
      expect((result as any).body).toContain('Invalid token');
    });

    it('should reject tokens without valid Cognito roles', async () => {
      // Generate token without any roles
      const authToken = await generateTestJwtToken({
        sub: 'no-roles-user',
        email: 'noroles@test.com',
        roles: [], // No roles
        scopes: []
      });

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'noroles@test.com',
          name: 'No Roles Contract',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'no-roles-user',
          email: 'noroles@test.com'
        })
      }));

      expect((result as any).statusCode).toBe(403);
      expect((result as any).body).toContain('Insufficient permissions');
    });

    it('should reject tokens with invalid Cognito roles', async () => {
      // Generate token with invalid role
      const authToken = await generateTestJwtToken({
        sub: 'invalid-role-user',
        email: 'invalidrole@test.com',
        roles: ['invalid_role'], // Invalid role
        scopes: []
      });

      const result = await CreateEnvelopeController(await createApiGatewayEvent({
        pathParameters: createTestPathParams({ }),
        body: {
          ownerEmail: 'invalidrole@test.com',
          name: 'Invalid Role Contract',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'invalid-role-user',
          email: 'invalidrole@test.com'
        })
      }));

      expect((result as any).statusCode).toBe(403);
      expect((result as any).body).toContain('Insufficient permissions');
    });
  });

  describe('Authorization Rules', () => {
    it('should enforce owner-only operations', async () => {
      // Generate token for non-owner user (should not be able to invite parties)
      const authToken = await generateTestJwtToken({
        sub: 'non-owner-user',
        email: 'nonowner@test.com',
        roles: ['customer'],
        scopes: []
      });

      const result = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId]
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'non-owner-user',
          email: 'nonowner@test.com'})
      }));

      // This should fail due to not being the owner
      expect((result as any).statusCode).toBe(403);
    });

    it('should allow owner to access their own envelope', async () => {
      // Generate token for the actual owner
      const authToken = await generateTestJwtToken({
        sub: 'user-owner-a',
        email: ownerEmailA,
        roles: ['customer'],
        scopes: []
      });

      const result = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId]
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'user-owner-a',
          email: ownerEmailA})
      }));

      // This should succeed because user is the owner
      expect((result as any).statusCode).toBe(200);
    });
  });
});
