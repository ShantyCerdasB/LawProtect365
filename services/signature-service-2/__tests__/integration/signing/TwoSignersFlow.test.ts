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
// Note: we intentionally avoid old helper suites to keep this lean
import { waitForOutboxEvents, waitForAuditRecords, expectS3HasFinalPdf } from '../helpers/assertions';

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

  // Security/edge validations moved to unit/contract tests to keep integration fast

  // Authorization edge cases covered in unit; integration focuses on happy paths

  // Keep edge cases minimal here

  describe('Post-signing validations', () => {
    it('should emit outbox/audit and store final PDF', async () => {
      flowResult = await createTwoSignersFlow('Two Signers Validations');
      await waitForOutboxEvents(flowResult.envelope.id, [
        'signing.consent_recorded',
        'signing.completed'
      ]);
      await waitForAuditRecords(flowResult.envelope.id, 1);
      await expectS3HasFinalPdf(flowResult.envelope.id);
    });
  });
});
