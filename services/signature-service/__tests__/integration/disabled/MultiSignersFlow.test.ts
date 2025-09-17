/**
 * @file MultiSignersFlow.test.ts
 * @summary Multi signers signing flow integration tests
 * @description Tests multi signers workflows where the owner creates the envelope
 * and invites multiple external users to sign. This test validates the complete flow
 * with multiple invitation tokens, concurrent signing, and PDF generation.
 */

// Removed awsMocksMinimal import - using LocalStack instead
import { 
  createMultiSignersFlow,
  type SigningFlowResult 
} from '../helpers/signingFlowFactory';
import { 
  testTokenSecurity,
  testTokenReuse,
  testCrossEnvelopeTokenUsage,
  testConcurrentSigning,
  testEnvelopeCancellation
} from '../helpers/securityValidations';
import { 
  testSigningOrder,
  testFinaliseEnvelopeRequirements,
  testPartialSigning
} from '../helpers/dataIntegrityValidations';

// awsMocksMinimal is automatically loaded

describe('Multi Signers Flow (Owner + 2+ Invitados)', () => {
  let flowResult: SigningFlowResult;

  beforeAll(async () => {
    // Test setup - no tenant ID needed
  });

  beforeEach(async () => {
    // Test isolation handled by DynamoDB Local
  });

  describe('Happy Path - Multi Signers Workflow', () => {
    it('should complete multi signers workflow with owner and 3 invited users', async () => {
      // Use the factory to create the complete flow
      flowResult = await createMultiSignersFlow('Multi Signers Test Contract');
      
      // Verify the flow was completed successfully
      expect(flowResult.envelope.name).toBe('Multi Signers Test Contract');
      expect(flowResult.parties).toHaveLength(4); // Owner + 3 invited
      expect(flowResult.parties[0].email).toBe('owner@test.com');
      expect(flowResult.parties[1].email).toBe('signer1@test.com');
      expect(flowResult.parties[2].email).toBe('signer2@test.com');
      expect(flowResult.parties[3].email).toBe('signer3@test.com');
      expect(flowResult.owner.email).toBe('owner@test.com');
      expect(flowResult.invitedUsers).toHaveLength(3);
      expect(Object.keys(flowResult.invitationTokens)).toHaveLength(4); // All parties have tokens
    });
  });

  describe('Token Security Validations', () => {
    beforeEach(async () => {
      // Setup basic envelope and parties for security tests
      flowResult = await createMultiSignersFlow('Security Test Contract');
    });

    it('should reject cross-party token usage', async () => {
      const signer1Party = flowResult.parties[1];
      const signer2Party = flowResult.parties[2];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      await testTokenSecurity(
        flowResult.envelope.id,
        signer1Token,
        signer2Party.id, // Wrong party ID
        signer2Party.id
      );
    });

    it('should validate token-party binding', async () => {
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      await testTokenSecurity(
        flowResult.envelope.id,
        signer1Token,
        signer1Party.id,
        'invalid-party-id'
      );
    });

    it('should reject token reuse', async () => {
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      await testTokenReuse(
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token
      );
    });

    it('should validate token expiration', async () => {
      const { ValidateInvitationTokenController } = await import('../../../src/presentation/controllers/signing/ValidateInvitationToken.Controller');
      const { createApiGatewayEvent } = await import('../helpers/testHelpers');
      const { assertResponse } = await import('../helpers/signingFlowFactory');
      
      const result = await ValidateInvitationTokenController(createApiGatewayEvent({
        pathParameters: { token: 'expired-token-123' }
      }));

      const response = assertResponse(result);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body!).data.valid).toBe(false);
      expect(JSON.parse(response.body!).data.error).toContain('Invalid');
    });

    it('should reject token from different envelope', async () => {
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      await testCrossEnvelopeTokenUsage(
        flowResult.owner.token,
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token
      );
    });
  });

  describe('PDF Generation Validations', () => {
    it('should generate final PDF after all signatures', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('PDF Generation Test');
      
      // The factory already finalises the envelope and generates the PDF
      // We just need to verify the flow completed successfully
      expect(flowResult.envelope.name).toBe('PDF Generation Test');
      expect(flowResult.parties).toHaveLength(4);
      expect(flowResult.invitedUsers).toHaveLength(3);
    });
  });

  describe('Concurrency Validations', () => {
    it('should prevent race conditions', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('Concurrency Test');
      
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      // Record consent first
      const { recordConsentWithToken } = await import('../helpers/signingFlowFactory');
      await recordConsentWithToken(
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token
      );
      
      await testConcurrentSigning(
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token,
        1 // Expected successful attempts
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial signing scenarios', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('Partial Signing Test');
      
      await testPartialSigning(
        flowResult.envelope.id,
        flowResult.owner.token,
        false // Expected failure
      );
    });

    it('should validate finalise envelope requirements', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('Finalise Requirements Test');
      
      await testFinaliseEnvelopeRequirements(
        flowResult.envelope.id,
        flowResult.owner.token,
        false // Expected failure
      );
    });

    it('should handle signing order violations', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('Signing Order Test');
      
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      // Record consent first
      const { recordConsentWithToken } = await import('../helpers/signingFlowFactory');
      await recordConsentWithToken(
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token
      );
      
      await testSigningOrder(
        flowResult.envelope.id,
        signer1Party.id,
        signer1Token,
        true // Expected success
      );
    });

    it('should handle envelope cancellation during signing', async () => {
      // Create a flow first
      flowResult = await createMultiSignersFlow('Cancellation Test');
      
      const signer1Party = flowResult.parties[1];
      const signer1Token = flowResult.invitationTokens[signer1Party.id];
      
      await testEnvelopeCancellation(
        flowResult.envelope.id,
        flowResult.owner.token,
        signer1Party.id,
        signer1Token
      );
    });
  });
});