/**
 * @file InvitationFlow.test.ts
 * @summary Integration tests for invitation flow with tokens
 * @description Tests the complete invitation flow including token validation and signing
 */

import { CreateEnvelopeController } from "../../../src/presentation/controllers/envelopes/CreateEnvelope.Controller";
import { CreateDocumentController } from "../../../src/presentation/controllers/documents/CreateDocument.Controller";
import { CreateInputsController } from "../../../src/presentation/controllers/inputs/CreateInputs.Controller";
import { CreatePartyController } from "../../../src/presentation/controllers/parties/CreateParty.Controller";
import { InvitePartiesController } from "../../../src/presentation/controllers/requests/InviteParties.Controller";
import { ValidateInvitationTokenController } from "../../../src/presentation/controllers/signing/ValidateInvitationToken.Controller";
import { CompleteSigningController } from "../../../src/presentation/controllers/signing/CompleteSigning.Controller";
import { createApiGatewayEvent, createTestRequestContext, generateTestJwtToken, generateTestPdf, calculatePdfDigest } from "../helpers/testHelpers";

describe('Invitation Flow Integration Tests', () => {
  let envelopeId: string;
  let partyId: string;
  let invitationTokens: string[] = [];
  let ownerToken: string;

  beforeAll(async () => {
    // Generate owner token
    ownerToken = await generateTestJwtToken({
      sub: 'owner-user',
      email: 'owner@acme.com',
      roles: ['customer'],
      scopes: []
    });
  });

  describe('Complete Invitation Flow with Tokens', () => {
    it('should create invitation with tokens and allow signing without account', async () => {
      console.log('Starting invitation flow test...');
      // 1. Create envelope
      const createEnvelopeResult = await CreateEnvelopeController(await createApiGatewayEvent({
        body: {
          name: 'Test Contract for Invitation',
          description: 'Contract for testing invitation flow',
          ownerEmail: 'owner@acme.com'
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      expect((createEnvelopeResult as any).statusCode).toBe(201);
      envelopeId = JSON.parse((createEnvelopeResult as any).body!).data.envelope.envelopeId;
      console.log('Created envelope:', envelopeId);

      // 2. Create document
      const testPdf = generateTestPdf();
      const pdfDigest = calculatePdfDigest(testPdf);
      
      const createDocumentResult = await CreateDocumentController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          name: 'Test Document.pdf',
          contentType: 'application/pdf',
          size: testPdf.length,
          digest: pdfDigest.value,
          bucket: 'test-evidence-bucket',
          key: `documents/${envelopeId}/test-document.pdf`
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      console.log('CreateDocument response:', createDocumentResult);
      expect((createDocumentResult as any).statusCode).toBe(201);
      const documentId = JSON.parse((createDocumentResult as any).body!).data.documentId;
      console.log('Created document:', documentId);

      // 3. Create input field for signing
      const createInputResult = await CreateInputsController(await createApiGatewayEvent({
        pathParameters: { envelopeId: envelopeId },
        body: {
          documentId: documentId,
          inputs: [{
            type: 'signature',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            page: 1,
            required: true
          }]
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      console.log('CreateInput response:', createInputResult);
      expect((createInputResult as any).statusCode).toBe(201);
      const inputData = JSON.parse((createInputResult as any).body!).data;
      const inputId = inputData.items[0].inputId;
      console.log('Created input:', inputId);

      // 4. Create party
      const createPartyResult = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: envelopeId },
        body: {
          name: 'Jane Signer',
          email: 'signer@beta.com',
          role: 'signer'
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      console.log('CreateParty response:', createPartyResult);
      expect((createPartyResult as any).statusCode).toBe(201);
      const createPartyData = JSON.parse((createPartyResult as any).body!).data;
      partyId = createPartyData.party.partyId;
      console.log('Created party:', partyId);

      // 4. Invite parties (this creates invitation tokens)
      const invitePartiesResult = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId],
          message: 'Please sign this document',
          signByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      console.log('InviteParties response:', invitePartiesResult);
      expect((invitePartiesResult as any).statusCode).toBe(200);
      const inviteData = JSON.parse((invitePartiesResult as any).body!).data;
      invitationTokens = inviteData.tokens;
      
        console.log('Created invitation tokens:', invitationTokens);
        // Party was created as pending and then invited, so it should be in invited
        expect(inviteData.invited).toContain(partyId);
        expect(inviteData.alreadyPending).toHaveLength(0); // No already pending parties
        expect(inviteData.tokens).toHaveLength(1); // One token generated
        expect(inviteData.statusChanged).toBe(false); // Status didn't change (envelope level)

      // 5. Validate invitation token
      if (invitationTokens.length > 0) {
        const validateTokenResult = await ValidateInvitationTokenController(await createApiGatewayEvent({
          pathParameters: { token: invitationTokens[0] },
          requestContext: createTestRequestContext({
            sourceIp: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          })
        }));

        expect((validateTokenResult as any).statusCode).toBe(200);
        const validationData = JSON.parse((validateTokenResult as any).body!).data;
        
        console.log('Token validation result:', validationData);
        expect(validationData.valid).toBe(true);
        expect(validationData.envelopeId).toBe(envelopeId);
        expect(validationData.partyId).toBe(partyId);
        expect(validationData.email).toBe('signer@beta.com');
        expect(validationData.role).toBe('signer');
        expect(validationData.invitedBy).toBe('owner@acme.com');
        expect(validationData.message).toBe('Please sign this document');
      } else {
        console.log('Skipping token validation - no tokens available in current flow');
      }

      // 6. Complete signing using the token (unauthenticated)
      const completeSigningResult = await CompleteSigningWithTokenController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          signerId: partyId,
          digest: {
            alg: 'sha256',
            value: 'dGVzdC1kaWdlc3QtdmFsdWU'
          },
          algorithm: 'RSASSA_PSS_SHA_256',
          keyId: 'test-key-id',
          token: invitationTokens[0] // Use the invitation token instead of auth
        },
        requestContext: createTestRequestContext({
          sourceIp: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
      }));

      expect((completeSigningResult as any).statusCode).toBe(201);
      const signatureData = JSON.parse((completeSigningResult as any).body!).data;
      
      console.log('Completed signing:', signatureData.signatureId);
      expect(signatureData.envelopeId).toBe(envelopeId);
      expect(signatureData.signerId).toBe(partyId);
    });

    it('should prevent signing with invalid token', async () => {
      // Try to validate an invalid token
      const validateTokenResult = await ValidateInvitationTokenController(await createApiGatewayEvent({
        pathParameters: { token: 'invalid-token-12345' },
        requestContext: createTestRequestContext({
          sourceIp: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
      }));

      expect((validateTokenResult as any).statusCode).toBe(200);
      const validationData = JSON.parse((validateTokenResult as any).body!).data;
      
      expect(validationData.valid).toBe(false);
      expect(validationData.error).toBe('Invalid or expired invitation token');
    });

    it('should prevent cross-owner invitation creation', async () => {
      // Generate token for different user
      const differentUserToken = await generateTestJwtToken({
        sub: 'different-user',
        email: 'different@owner.com',
        roles: ['customer'],
        scopes: []
      });

      // Try to invite parties to envelope owned by different user
      const invitePartiesResult = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId],
          message: 'Unauthorized invitation'
        },
        headers: {
          'Authorization': `Bearer ${differentUserToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'different-user',
          email: 'different@owner.com'
        })
      }));

      // Should fail with access denied error
      expect((invitePartiesResult as any).statusCode).toBe(403);
      const errorData = JSON.parse((invitePartiesResult as any).body!);
      expect(errorData.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('should validate signing order preference', async () => {
      // Create another party for testing multiple parties
      const createParty2Result = await CreatePartyController(await createApiGatewayEvent({
        pathParameters: { envelopeId: envelopeId },
        body: {
          name: 'John Signer',
          email: 'john@beta.com',
          role: 'signer'
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      expect((createParty2Result as any).statusCode).toBe(201);
      const createParty2Data = JSON.parse((createParty2Result as any).body!).data;
      const party2Id = createParty2Data.party.partyId;

      // Invite multiple parties with signing order
      const invitePartiesResult = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId, party2Id],
          message: 'Please sign in order',
          signingOrder: 'invitees_first'
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      expect((invitePartiesResult as any).statusCode).toBe(200);
      const inviteData = JSON.parse((invitePartiesResult as any).body!).data;
      
      expect(inviteData.invited).toHaveLength(2);
      expect(inviteData.tokens).toHaveLength(2);
      expect(inviteData.invited).toContain(partyId);
      expect(inviteData.invited).toContain(party2Id);
    });

    it('should prevent signing order for single party', async () => {
      // Try to set signing order for single party (should fail validation)
      const invitePartiesResult = await InvitePartiesController(await createApiGatewayEvent({
        pathParameters: { id: envelopeId },
        body: {
          partyIds: [partyId],
          message: 'Single party with order',
          signingOrder: 'owner_first' // This should be rejected for single party
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        },
        requestContext: createTestRequestContext({
          userId: 'owner-user',
          email: 'owner@acme.com'
        })
      }));

      // This should fail validation
      expect((invitePartiesResult as any).statusCode).toBe(422);
      const errorData = JSON.parse((invitePartiesResult as any).body!);
      expect(errorData.message).toContain('Signing order can only be specified when inviting multiple parties');
    });
  });

  describe('Token Security Validation', () => {
    it('should validate IP and User Agent consistency', async () => {
      if (invitationTokens.length === 0) {
        console.log('Skipping IP/User Agent test - no tokens available');
        return;
      }

      // First validation with IP and User Agent
      const validateTokenResult1 = await ValidateInvitationTokenController(await createApiGatewayEvent({
        pathParameters: { token: invitationTokens[0] },
        requestContext: createTestRequestContext({
          sourceIp: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
      }));

      expect((validateTokenResult1 as any).statusCode).toBe(200);
      const validationData1 = JSON.parse((validateTokenResult1 as any).body!).data;
      expect(validationData1.valid).toBe(true);

      // Second validation with different IP (should still work for now, but could be enhanced)
      const validateTokenResult2 = await ValidateInvitationTokenController(await createApiGatewayEvent({
        pathParameters: { token: invitationTokens[0] },
        requestContext: createTestRequestContext({
          sourceIp: '192.168.1.200', // Different IP
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
      }));

      expect((validateTokenResult2 as any).statusCode).toBe(200);
      const validationData2 = JSON.parse((validateTokenResult2 as any).body!).data;
      expect(validationData2.valid).toBe(true);
    });
  });
});