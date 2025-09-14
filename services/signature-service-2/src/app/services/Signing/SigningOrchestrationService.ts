/**
 * @file SigningOrchestrationService.ts
 * @summary Orchestration service for complex signing operations
 * @description Handles complex signing workflows that involve multiple services and repositories.
 * This service coordinates between validation, event publishing, audit logging, and data persistence
 * to ensure atomic and consistent signing operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { KmsSigner } from "@lawprotect/shared-ts";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
import { InvitationTokenRepositoryDdb } from "../../../infrastructure/dynamodb/InvitationTokenRepositoryDdb";
import { SigningValidationService } from "./SigningValidationService";
import { SigningEventService } from "./SigningEventService";
import { SigningAuditService } from "./SigningAuditService";
import { SigningPdfService } from "./SigningPdfService";
import { SigningRateLimitService } from "./SigningRateLimitService";
import type { SignaturesCommandsPort } from "../../ports/signatures/SignaturesCommandsPort";
import { PARTY_ROLES, ENVELOPE_STATUSES, SIGNING_DEFAULTS, INVITATION_STATUSES, PARTY_STATUSES } from "../../../domain/values/enums";
import type { CompleteSigningWithTokenCommand, CompleteSigningWithTokenResult } from "../../ports/signing/SigningCommandsPort";

/**
 * Configuration for signing operations
 */
export interface SigningConfig {
  readonly defaultKeyId: string;
  readonly allowedAlgorithms?: readonly string[];
}

/**
 * Orchestration service for complex signing operations
 */
export class SigningOrchestrationService {
  constructor(
    private readonly validationService: SigningValidationService,
    private readonly eventService: SigningEventService,
    private readonly auditService: SigningAuditService,
    private readonly pdfService: SigningPdfService,
    private readonly rateLimitService: SigningRateLimitService,
    private readonly signaturesCommand: SignaturesCommandsPort,
    private readonly partiesRepo: PartyRepositoryDdb,
    private readonly envelopesRepo: Repository<Envelope, EnvelopeId>,
    private readonly invitationTokensRepo: InvitationTokenRepositoryDdb,
    private readonly signer: KmsSigner,
    private readonly signingConfig: SigningConfig,
    private readonly ids: { ulid(): string }
  ) {}

  /**
   * Signs a document using KMS with complete context
   * @param command - The signing command with digest and algorithm
   * @param party - The party information for context
   * @param invitation - The invitation token information for context
   * @returns Promise resolving to signature result with context
   */
  async signWithKms(command: CompleteSigningWithTokenCommand, party: Party, invitation: any): Promise<{ signature: string; contextHash: string; keyId: string }> {
    const completedAt = new Date().toISOString();
    
    const signResult = await this.signaturesCommand.signHashWithContext({
      digest: command.digest,
      algorithm: command.algorithm,
      keyId: command.keyId,
      signerEmail: party.email,
      signerName: party.name,
      signerId: command.signerId,
      ipAddress: command.ip || "unknown",
      userAgent: command.userAgent || "unknown",
      timestamp: completedAt,
      consentGiven: true,
      consentTimestamp: party.consentedAt || party.invitedAt || completedAt,
      consentText: "Consent given for signing",
      invitedBy: invitation.invitedBy,
      invitedByName: invitation.invitedByName,
      invitationMessage: invitation.message,
      envelopeId: command.envelopeId
    });
    
    return {
      signature: signResult.signature,
      contextHash: signResult.contextHash,
      keyId: signResult.keyId
    };
  }

  /**
   * Updates envelope status based on signing progress
   * @param envelopeId - The envelope ID
   * @param completedAt - The completion timestamp
   * @returns Promise resolving to new envelope status
   */
  async updateEnvelopeStatus(envelopeId: EnvelopeId, completedAt: string): Promise<string> {
    const parties = await this.partiesRepo.listByEnvelope({ envelopeId });
    const requiredSigners = parties.items.filter((p: Party) => p.role === PARTY_ROLES[0]).length;
    const signedCount = parties.items.filter((p: Party) => p.role === PARTY_ROLES[0] && p.status === PARTY_STATUSES[3]).length;
    
    
    let newStatus: string;
    if (signedCount >= requiredSigners) {
      newStatus = ENVELOPE_STATUSES[3]; // "completed"
    } else if (signedCount > 0) {
      newStatus = ENVELOPE_STATUSES[2]; // "in_progress"
    } else {
      newStatus = ENVELOPE_STATUSES[1]; // "sent"
    }
    
    
    await this.envelopesRepo.update(envelopeId, {
      status: newStatus as any,
      updatedAt: completedAt as ISODateString
    });
    
    return newStatus;
  }

  /**
   * Updates all signing states atomically
   * @param invitation - The invitation token data
   * @param party - The party data
   * @param envelope - The envelope data
   * @param signature - The generated signature
   * @param command - The signing command
   * @returns Promise resolving to signing result
   */
  async updateSigningStates(
    invitation: { tokenId: string; envelopeId: EnvelopeId; email: string },
    _party: Party,
    _envelope: Envelope,
    signature: string,
    command: CompleteSigningWithTokenCommand
  ): Promise<CompleteSigningWithTokenResult> {
    const completedAt = new Date().toISOString();
    
    
    // Update party status with signature data
    await this.partiesRepo.update({ envelopeId: command.envelopeId, partyId: command.signerId }, {
      status: PARTY_STATUSES[3], // "signed"
      signedAt: completedAt,
      updatedAt: completedAt as ISODateString,
      signature: signature,
      digest: command.digest.value,
      algorithm: command.algorithm,
      keyId: command.keyId || this.signingConfig.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID
    });
    
    
    // Update invitation token status
    await this.invitationTokensRepo.update(
      { tokenId: invitation.tokenId, envelopeId: invitation.envelopeId },
      {
        tokenId: invitation.tokenId,
        status: INVITATION_STATUSES[1], // "used"
        usedAt: completedAt,
        usedFromIp: command.ip,
        usedWithUserAgent: command.userAgent
      }
    );
    
    // Update envelope status based on signing progress
    const newEnvelopeStatus = await this.updateEnvelopeStatus(command.envelopeId, completedAt);
    
    return {
      signed: true,
      signatureId: this.ids.ulid(),
      envelopeStatus: newEnvelopeStatus,
      signedAt: completedAt
    };
  }

  /**
   * Publishes signing completion events
   * @param invitation - The invitation token data
   * @param command - The signing command
   */
  async publishSigningEvents(invitation: { email: string }, command: CompleteSigningWithTokenCommand): Promise<void> {
    await this.eventService.publishSigningCompleted(
      command.envelopeId,
      command.signerId,
      { email: invitation.email, ip: command.ip, userAgent: command.userAgent } as any
    );

    await this.auditService.logSigningCompleted(
      command.envelopeId,
      command.signerId,
      { email: invitation.email, ip: command.ip, userAgent: command.userAgent } as any
    );
  }

  /**
   * Generates the final signed PDF when all parties have signed
   * @param envelopeId - The envelope ID
   * @param finalPdfUrl - The final PDF URL
   * @param parties - Array of parties
   */
  async generateFinalSignedPdf(envelopeId: EnvelopeId, finalPdfUrl: string, parties: Party[]): Promise<void> {
    try {
      // Get all signatures for this envelope
      const signatures = await this.collectAllSignatures(envelopeId, parties);
      
      // Generate the final signed PDF
      const result = await this.pdfService.generateSignedPdf(
        envelopeId,
        finalPdfUrl,
        parties,
        signatures
      );
      
      // Log the successful PDF generation
      console.log(`Final signed PDF generated for envelope ${envelopeId}:`, {
        objectKey: result.objectKey,
        bucket: result.bucket,
        httpUrl: result.httpUrl
      });
    } catch (error) {
      console.error('Failed to generate final signed PDF:', error);
      // PDF generation failure should not fail the signing process
    }
  }

  /**
   * Collects all signatures for an envelope
   * @param envelopeId - The envelope ID
   * @param parties - Array of parties
   * @returns Promise resolving to array of signatures
   */
  async collectAllSignatures(_envelopeId: EnvelopeId, parties: Party[]): Promise<any[]> {
    const signatures: any[] = [];
    
    for (const party of parties) {
      if (party.status === "signed" && party.signedAt) {
        // Get the actual signature from the party record
        const signature = party.signature;
        const digest = party.digest;
        const algorithm = party.algorithm;
        const keyId = party.keyId || this.signingConfig.defaultKeyId;
        
        if (!signature || !digest || !algorithm) {
          console.warn(`Incomplete signature data for party ${party.partyId}`);
          continue;
        }
        
        signatures.push({
          partyId: party.partyId,
          partyName: party.name,
          partyEmail: party.email,
          signedAt: party.signedAt,
          signature: signature,
          digest: digest,
          algorithm: algorithm,
          keyId: keyId
        });
      }
    }
    
    return signatures;
  }

  /**
   * Completes signing using an invitation token (unauthenticated)
   * @param command - The complete signing with token command
   * @returns Promise resolving to signing result
   */
  async completeSigningWithToken(command: CompleteSigningWithTokenCommand): Promise<CompleteSigningWithTokenResult> {
    try {
      const invitation = await this.validationService.validateInvitationTokenWithRepo(command.token, this.invitationTokensRepo);
      const { envelope, party } = await this.validationService.validateEnvelopeAndParty(invitation, this.envelopesRepo, this.partiesRepo);
      
      // Rate limiting for token-based signing
      await this.rateLimitService.checkSigningRateLimit(
        command.envelopeId,
        command.signerId
      );
      
      // Validate actor IP (required for signing)
      this.validationService.validateActorIp({ ip: command.ip });
      
      await this.validationService.validateSigningPrerequisites(party, command, envelope);
      
      // Sign with KMS using complete context
      const signResult = await this.signWithKms(command, party, invitation);
      
      // Verify the signature is valid
      const documentDigestBuffer = Buffer.from(command.digest.value, 'hex');
      const contextHashBuffer = Buffer.from(signResult.contextHash, 'hex');
      const combinedMessage = Buffer.concat([documentDigestBuffer, contextHashBuffer]);
      
      const verifyResult = await this.signer.verify({
        message: combinedMessage,
        signature: Buffer.from(signResult.signature, 'base64'),
        signingAlgorithm: command.algorithm,
        keyId: signResult.keyId
      });

      if (!verifyResult.valid) {
        throw new Error("Generated signature is invalid");
      }
      
      // Update states atomically
      const result = await this.updateSigningStates(invitation, party, envelope, signResult.signature, command);
      
      // Publish events
      await this.publishSigningEvents(invitation, command);
      
      return result;
      
    } catch (error: any) {
      return {
        signed: false,
        error: error.message || "Failed to complete signing with token"
      };
    }
  }
}
