/**
 * @file SingleSignerFlowNew.test.ts
 * @summary Single signer signing flow integration tests
 * @description Tests single signer workflows where the owner creates and signs the envelope.
 * This test validates the complete flow for authenticated users who own the envelope.
 */

import '../helpers/awsMocksMinimal';
import { 
  createSingleSignerFlow,
  type SigningFlowResult,
  assertResponse
} from '../helpers/signingFlowFactory';
import { 
  testUnauthorizedAccess,
  testCrossUserAccess,
  testInvalidEnvelopeId
} from '../helpers/securityValidations';
import { 
  testInvalidDigest,
  testUnsupportedAlgorithm,
  testDocumentIntegrity,
  testMissingConsent
} from '../helpers/dataIntegrityValidations';

// awsMocksMinimal is automatically loaded

describe('Single Signer Flow (Owner Autenticado)', () => {
  let flowResult: SigningFlowResult;

  beforeAll(async () => {
    // Test setup - no tenant ID needed
  });

  beforeEach(async () => {
    // Test isolation handled by DynamoDB Local
  });

  describe('Happy Path - Single Signer Workflow', () => {
    it('should complete single signer workflow with authenticated owner', async () => {
      // Use the factory to create the complete flow
      flowResult = await createSingleSignerFlow('Single Signer Test Contract');
      
      // Verify the flow was completed successfully
      expect(flowResult.envelope.name).toBe('Single Signer Test Contract');
      expect(flowResult.parties).toHaveLength(1);
      expect(flowResult.parties[0].email).toBe('owner@test.com');
      expect(flowResult.owner.email).toBe('owner@test.com');
      expect(flowResult.invitedUsers).toHaveLength(0);
    });
  });

  describe('Security Validations', () => {
    it('should reject unauthorized access to envelope', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('Security Test Contract');
      
      // Test unauthorized access
      await testUnauthorizedAccess(flowResult.owner.token, async (token) => {
        const { CreatePartyController } = await import('../../../src/presentation/controllers/parties/CreateParty.Controller');
        const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
        
        return await CreatePartyController(createApiGatewayEvent({
          pathParameters: { envelopeId: flowResult.envelope.id },
          body: {
            name: 'Unauthorized User',
            email: 'unauthorized@test.com',
            role: 'signer',
            sequence: 1
          },
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          requestContext: createTestRequestContext({
            userId: 'unauthorized-user',
            email: 'unauthorized@test.com'
          })
        }));
      });
    });

    it('should require valid JWT token', async () => {
      await testUnauthorizedAccess('', async (token) => {
        const { CreateEnvelopeController } = await import('../../../src/presentation/controllers/envelopes/CreateEnvelope.Controller');
        const { createApiGatewayEvent, createTestRequestContext, createTestPathParams } = await import('../helpers/testHelpers');
        
        return await CreateEnvelopeController(createApiGatewayEvent({
          pathParameters: createTestPathParams({}),
          body: {
            name: 'Invalid Token Test',
            description: 'Test with invalid token',
            ownerEmail: 'owner@test.com'
          },
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          requestContext: createTestRequestContext({
            userId: 'owner-user-123',
            email: 'owner@test.com'
          })
        }));
      });
    });

    it('should validate owner permissions', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('Owner Permission Test');
      
      // Test cross-user access with CompleteSigningController which should validate ownership
      await testCrossUserAccess(flowResult.owner.token, flowResult.owner.email, async (token, email) => {
        const { CompleteSigningController } = await import('../../../src/presentation/controllers/signing/CompleteSigning.Controller');
        const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
        
        return await CompleteSigningController(await createApiGatewayEvent({
          pathParameters: { id: flowResult.envelope.id },
          body: {
            signerId: flowResult.parties[0].id,
            finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
            digest: {
              alg: 'sha256',
              value: 'test-digest'
            },
            algorithm: 'RSASSA_PSS_SHA_256',
            keyId: 'test-key-id'
          },
          headers: { 'Authorization': `Bearer ${token}` },
          requestContext: createTestRequestContext({
            userId: 'other-user-456',
            email: email
          }),
          includeAuth: false,
          authToken: token
        }));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid envelope ID', async () => {
      // Create a flow first to get the owner token
      flowResult = await createSingleSignerFlow('Invalid Envelope ID Test');
      
      await testInvalidEnvelopeId(flowResult.owner.token, async (envelopeId, token) => {
        const { CompleteSigningController } = await import('../../../src/presentation/controllers/signing/CompleteSigning.Controller');
        const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
        
        return await CompleteSigningController(await createApiGatewayEvent({
          pathParameters: { id: envelopeId },
          body: {
            signerId: 'test-party-id',
            finalPdfUrl: 'https://test-bucket.s3.amazonaws.com/test-document.pdf',
            digest: {
              alg: 'sha256',
              value: 'test-digest'
            },
            algorithm: 'RSASSA_PSS_SHA_256',
            keyId: 'test-key-id'
          },
          headers: { 'Authorization': `Bearer ${token}` },
          requestContext: createTestRequestContext({
            userId: 'owner-user-123',
            email: 'owner@test.com'
          }),
          includeAuth: false,
          authToken: token
        }));
      });
    });

    it('should handle missing consent', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('No Consent Test');
      
      // Create a separate party for this test to avoid conflict
      const { CreatePartyController } = await import('../../../src/presentation/controllers/parties/CreateParty.Controller');
      const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
      
      const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: flowResult.envelope.id },
        body: {
          name: 'Test Party for Missing Consent',
          email: 'test-missing-consent@test.com',
          role: 'signer',
          sequence: 2
        },
        headers: { 'Authorization': `Bearer ${flowResult.owner.token}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user-123',
          email: 'owner@test.com'
        }),
        includeAuth: false,
        authToken: flowResult.owner.token
      }));
      
      const createPartyResponse = assertResponse(createPartyResult);
      console.log('🔍 [DEBUG] CreateParty response:', {
        statusCode: createPartyResponse.statusCode,
        body: createPartyResponse.body
      });
      const responseData = JSON.parse(createPartyResponse.body!);
      console.log('🔍 [DEBUG] CreateParty responseData:', responseData);
      const testPartyId = responseData.data.party.partyId;
      
      // Test missing consent with the new party
      await testMissingConsent(
        flowResult.envelope.id,
        testPartyId,
        flowResult.owner.token
      );
    });

    it('should handle invalid digest', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('Invalid Digest Test');
      
      // Create a separate party for this test to avoid conflict
      const { CreatePartyController } = await import('../../../src/presentation/controllers/parties/CreateParty.Controller');
      const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
      
      const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: flowResult.envelope.id },
        body: {
          name: 'Test Party for Invalid Digest',
          email: 'test-invalid-digest@test.com',
          role: 'signer',
          sequence: 2
        },
        headers: { 'Authorization': `Bearer ${flowResult.owner.token}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user-123',
          email: 'owner@test.com'
        }),
        includeAuth: false,
        authToken: flowResult.owner.token
      }));
      
      const createPartyResponse = assertResponse(createPartyResult);
      console.log('🔍 [DEBUG] CreateParty response:', {
        statusCode: createPartyResponse.statusCode,
        body: createPartyResponse.body
      });
      const responseData = JSON.parse(createPartyResponse.body!);
      console.log('🔍 [DEBUG] CreateParty responseData:', responseData);
      const testPartyId = responseData.data.party.partyId;
      
      // Test invalid digest with the new party
      await testInvalidDigest(
        flowResult.envelope.id,
        testPartyId,
        flowResult.owner.token
      );
    });

    it('should handle unsupported algorithm', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('Unsupported Algorithm Test');
      
      // Create a separate party for this test to avoid conflict
      const { CreatePartyController } = await import('../../../src/presentation/controllers/parties/CreateParty.Controller');
      const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
      
      const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: flowResult.envelope.id },
        body: {
          name: 'Test Party for Unsupported Algorithm',
          email: 'test-unsupported-algorithm@test.com',
          role: 'signer',
          sequence: 2
        },
        headers: { 'Authorization': `Bearer ${flowResult.owner.token}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user-123',
          email: 'owner@test.com'
        }),
        includeAuth: false,
        authToken: flowResult.owner.token
      }));
      
      const createPartyResponse = assertResponse(createPartyResult);
      console.log('🔍 [DEBUG] CreateParty response:', {
        statusCode: createPartyResponse.statusCode,
        body: createPartyResponse.body
      });
      const responseData = JSON.parse(createPartyResponse.body!);
      console.log('🔍 [DEBUG] CreateParty responseData:', responseData);
      const testPartyId = responseData.data.party.partyId;
      
      // Test unsupported algorithm with the new party
      await testUnsupportedAlgorithm(
        flowResult.envelope.id,
        testPartyId,
        flowResult.owner.token
      );
    });
  });

  describe('Data Integrity Validations', () => {
    it('should validate document integrity', async () => {
      // Create a flow first
      flowResult = await createSingleSignerFlow('Document Integrity Test');
      
      // Create a separate party for this test to avoid conflict
      const { CreatePartyController } = await import('../../../src/presentation/controllers/parties/CreateParty.Controller');
      const { createApiGatewayEvent, createTestRequestContext } = await import('../helpers/testHelpers');
      
      const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: flowResult.envelope.id },
        body: {
          name: 'Test Party for Document Integrity',
          email: 'test-document-integrity@test.com',
          role: 'signer',
          sequence: 2
        },
        headers: { 'Authorization': `Bearer ${flowResult.owner.token}` },
        requestContext: createTestRequestContext({
          userId: 'owner-user-123',
          email: 'owner@test.com'
        }),
        includeAuth: false,
        authToken: flowResult.owner.token
      }));
      
      const createPartyResponse = assertResponse(createPartyResult);
      console.log('🔍 [DEBUG] CreateParty response:', {
        statusCode: createPartyResponse.statusCode,
        body: createPartyResponse.body
      });
      const responseData = JSON.parse(createPartyResponse.body!);
      console.log('🔍 [DEBUG] CreateParty responseData:', responseData);
      const testPartyId = responseData.data.party.partyId;
      
      // Test document integrity with the new party
      await testDocumentIntegrity(
        flowResult.envelope.id,
        testPartyId,
        flowResult.owner.token
      );
    });
  });
});
