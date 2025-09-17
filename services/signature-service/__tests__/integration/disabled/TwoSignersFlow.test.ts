/**
 * @file TwoSignersFlow.test.ts
 * @summary Two signers signing flow integration tests
 * @description Tests two signers workflows where the owner creates the envelope
 * and invites one external user to sign. This test validates the complete flow
 * with invitation tokens and mixed authentication (owner authenticated, invited user with token).
 */

// Removed awsMocksMinimal import - using LocalStack instead
import { 
  createTwoSignersFlow,
  type SigningFlowResult 
} from '../helpers/signingFlowFactory';
import { 
  testTokenSecurity,
  testTokenReuse,
  testCrossEnvelopeTokenUsage,
  testSigningWithoutInvitation,
  testSigningWithoutConsent,
  testConcurrentSigning,
  testEnvelopeCancellation,
  testIpAndUserAgentValidation
} from '../helpers/securityValidations';
import { 
  testSigningOrder
} from '../helpers/dataIntegrityValidations';

// awsMocksMinimal is automatically loaded

describe('Two Signers Flow (Owner + 1 Invitado)', () => {
  let flowResult: SigningFlowResult;

  beforeAll(async () => {
    // Test setup - no tenant ID needed
  });

  beforeEach(async () => {
    // Test isolation handled by DynamoDB Local
  });

  describe('Happy Path - Two Signers Workflow', () => {
    it('should complete two signers workflow with owner and invited user', async () => {
      // Use the factory to create the complete flow
      flowResult = await createTwoSignersFlow('Two Signers Test Contract');
      
      // Verify the flow was completed successfully
      expect(flowResult.envelope.name).toBe('Two Signers Test Contract');
      expect(flowResult.parties).toHaveLength(2);
      expect(flowResult.parties[0].email).toBe('owner@test.com');
      expect(flowResult.parties[1].email).toBe('invited@test.com');
      expect(flowResult.owner.email).toBe('owner@test.com');
      expect(flowResult.invitedUsers).toHaveLength(1);
      expect(flowResult.invitedUsers[0].email).toBe('invited@test.com');
      expect(Object.keys(flowResult.invitationTokens)).toHaveLength(2);
    });
  });

  describe('Token Security Validations', () => {
    beforeEach(async () => {
      // Setup basic envelope and parties for security tests
      flowResult = await createTwoSignersFlow('Security Test Contract');
    });

    it('should reject token from different party', async () => {
      const invitedParty = flowResult.parties[1];
      const ownerParty = flowResult.parties[0];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testTokenSecurity(
        flowResult.envelope.id,
        invitedToken,
        ownerParty.id, // Wrong party ID
        ownerParty.id
      );
    });

    it('should reject already used token', async () => {
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testTokenReuse(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken
      );
    });

    it('should reject expired token', async () => {
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

    it('should validate IP and User Agent', async () => {
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testIpAndUserAgentValidation(invitedToken);
    });

    it('should reject token from different envelope', async () => {
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testCrossEnvelopeTokenUsage(
        flowResult.owner.token,
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken
      );
    });
  });

  describe('Authorization Validations', () => {
    it('should reject signing without invitation', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('No Invitation Test');
      
      // Test signing without invitation
      await testSigningWithoutInvitation(
        flowResult.owner.token,
        flowResult.envelope.id,
        flowResult.parties[1].id
      );
    });

    it('should validate party assignment', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('Party Assignment Test');
      
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testTokenSecurity(
        flowResult.envelope.id,
        invitedToken,
        invitedParty.id,
        'invalid-party-id'
      );
    });

    it('should require consent before signing', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('Consent Test');
      
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testSigningWithoutConsent(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent signing attempts', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('Concurrent Signing Test');
      
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      // Record consent first
      const { recordConsentWithToken } = await import('../helpers/signingFlowFactory');
      await recordConsentWithToken(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken
      );
      
      await testConcurrentSigning(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken,
        1 // Expected successful attempts
      );
    });

    it('should handle envelope cancellation during signing', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('Cancellation Test');
      
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      await testEnvelopeCancellation(
        flowResult.envelope.id,
        flowResult.owner.token,
        invitedParty.id,
        invitedToken
      );
    });

    it('should validate signing order', async () => {
      // Create a flow first
      flowResult = await createTwoSignersFlow('Signing Order Test');
      
      const invitedParty = flowResult.parties[1];
      const invitedToken = flowResult.invitationTokens[invitedParty.id];
      
      // Record consent first
      const { recordConsentWithToken } = await import('../helpers/signingFlowFactory');
      await recordConsentWithToken(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken
      );
      
      await testSigningOrder(
        flowResult.envelope.id,
        invitedParty.id,
        invitedToken,
        true // Expected success
      );
    });
  });
});
