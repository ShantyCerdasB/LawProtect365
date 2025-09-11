/**
 * @file makeSigningCommandsPort.adapter.ts
 * @summary Factory for SigningCommandsPort
 * @description Creates and configures the SigningCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signing command operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { SigningCommandsPort, SigningConsentCommand, SigningConsentResult, PrepareSigningCommand, PrepareSigningResult, CompleteSigningCommand, CompleteSigningResult, DeclineSigningCommand, DeclineSigningResult, PresignUploadCommand, PresignUploadResult, DownloadSignedDocumentCommand, DownloadSignedDocumentResult, ValidateInvitationTokenCommand, ValidateInvitationTokenResult, CompleteSigningWithTokenCommand, CompleteSigningWithTokenResult, SigningConsentWithTokenCommand } from "../../ports/signing/SigningCommandsPort";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { IdempotencyRunner, KmsSigner, EventBusPortAdapter } from "@lawprotect/shared-ts";
import { buildEvidencePath } from "../../../domain/rules/Evidence.rules";
import { BadRequestError } from "@lawprotect/shared-ts";
import type { SigningS3Service } from "../../../domain/types/signing/ServiceInterfaces";
import { SigningRateLimitService } from "../../../app/services/Signing/SigningRateLimitService";
import type { SigningPdfService } from "../../../app/services/Signing/SigningPdfService";
import { SigningValidationService } from "../../../app/services/Signing/SigningValidationService";
import { SigningEventService } from "../../../app/services/Signing/SigningEventService";
import { SigningAuditService } from "../../../app/services/Signing/SigningAuditService";
import { SigningOrchestrationService } from "../../../app/services/Signing/SigningOrchestrationService";
import { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
import { InvitationTokenRepositoryDdb } from "../../../infrastructure/dynamodb/InvitationTokenRepositoryDdb";
import { PARTY_ROLES, ENVELOPE_STATUSES, SIGNING_DEFAULTS, SIGNING_FILE_LIMITS, PARTY_STATUSES } from "../../../domain/values/enums";

/**
 * Creates a SigningCommandsPort implementation for document signing operations
 * @param _envelopesRepo - The envelope repository for data persistence
 * @param _partiesRepo - The parties repository for data persistence
 * @param _invitationTokensRepo - The invitation tokens repository for data persistence
 * @param deps - Dependencies including ID generators, time, events, and services
 * @returns Configured SigningCommandsPort implementation
 */
export const makeSigningCommandsPort = (
  _envelopesRepo: Repository<Envelope, EnvelopeId>,
  _partiesRepo: PartyRepositoryDdb,
  _invitationTokensRepo: InvitationTokenRepositoryDdb,
  deps: {
    events: EventBusPortAdapter;
    ids: { ulid(): string };
    time: { now(): number };
    rateLimit: SigningRateLimitService;
    signer: KmsSigner;
    idempotency: IdempotencyRunner;
    signingConfig?: {
      defaultKeyId: string;
      allowedAlgorithms?: readonly string[];
    };
    s3Service?: SigningS3Service;
    uploadConfig?: {
      uploadBucket: string;
      uploadTtlSeconds: number;
    };
    downloadConfig?: {
      signedBucket: string;
      downloadTtlSeconds: number;
    };
    pdfService?: SigningPdfService;
    validationService: SigningValidationService;
    eventService: SigningEventService;
    auditService: SigningAuditService;
    orchestrationService: SigningOrchestrationService;
  }
): SigningCommandsPort => {
  





  return {
    /**
     * Records signing consent for a signer
     * @param command - The signing consent command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to consent result with event data
     */
     async recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult> {
       return await deps.idempotency.run(
         `consent-${command.envelopeId}-${command.signerId}`,
         async () => {
           // Validate actor IP (required for consent)
           deps.validationService.validateActorIp(command.actor);
           
           const envelope = await _envelopesRepo.getById(command.envelopeId);
           const party = await _partiesRepo.getById({ 
             envelopeId: command.envelopeId, 
             partyId: command.signerId 
           });

           await deps.validationService.validateConsent(command, envelope, party);

           await _partiesRepo.update(
             { envelopeId: command.envelopeId, partyId: command.signerId },
             { status: PARTY_STATUSES[2] } as any
           );

           await deps.eventService.publishConsentRecorded(
             command.envelopeId,
             command.signerId,
             command.actor as any
           );

           await deps.auditService.logSigningConsentRecorded(
             command.envelopeId,
             command.signerId,
             command.actor as any
           );

           return {
             consented: true,
             envelopeId: command.envelopeId,
             partyId: command.signerId,
             consentedAt: new Date().toISOString(),
             event: {
               name: "signing.consent.recorded",
               meta: { id: deps.ids.ulid(), ts: new Date().toISOString() as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
               data: {
                 envelopeId: command.envelopeId,
                 partyId: command.signerId,
                 consentedAt: new Date().toISOString(),
                 metadata: {
                   ip: command.actor?.ip,
                   userAgent: command.actor?.userAgent,
                   email: command.actor?.email,
                   userId: command.actor?.userId}}}};
         }
       );
     },

    /**
     * Prepares signing process for a signer
     * @param command - The signing preparation command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to preparation result with event data
     */
    async prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult> {
      
      // Rate limiting for signing preparation
      await deps.rateLimit.checkPrepareSigningRateLimit(
        command.envelopeId,
        command.signerId
      );
      
      // Validate signing operation
      await deps.validationService.validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo,
        command.signerId
      );

      const preparedAt = new Date().toISOString();

      return {
        prepared: true,
        preparedAt: preparedAt,
        event: {
          name: "signing.prepared",
          meta: { id: deps.ids.ulid(), ts: preparedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            preparedAt: preparedAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Completes the signing process for a signer
     * @param command - The signing completion command containing digest, algorithm, and signing context
     * @returns Promise resolving to completion result with signature and event data
     */
    async completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult> {
      
      // Rate limiting for signing completion
      await deps.rateLimit.checkSigningRateLimit(
        command.envelopeId,
        command.signerId
      );
      
      // Validate actor IP (required for signing)
      deps.validationService.validateActorIp(command.actor);
      
      // Validate signing operation
      const { envelope } = await deps.validationService.validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      
      deps.validationService.validateEnvelopeExists(envelope);
      deps.validationService.validatePartyExists(party, command.signerId, command.envelopeId);
      await deps.validationService.validateCompleteSigningBusinessLogic(command, envelope, party);
      deps.validationService.validateKmsAlgorithm(command.algorithm, deps.signingConfig?.allowedAlgorithms);

      // Use KMS to sign the digest
      const signResult = await deps.signer.sign({
        message: Buffer.from(command.digest.value, 'hex'),
        signingAlgorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID});

      const signature = Buffer.from(signResult.signature).toString('base64');
      const completedAt = new Date().toISOString();

      // Validate signature completeness
      if (!deps.validationService.validateSignatureCompleteness(signature, command.digest, command.algorithm)) {
        throw new BadRequestError("Incomplete signature data");
      }

      // Update party status to signed with signature data
      await _partiesRepo.update({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      }, {
        status: "signed",
        signedAt: completedAt,
        updatedAt: completedAt as ISODateString,
        signature: signature,
        digest: command.digest.value,
        algorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID
      });

      // Get updated party and validate signature data
      const updatedParty = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      
      if (!deps.validationService.validatePartySignatureData(updatedParty)) {
        throw new BadRequestError("Invalid party signature data after update");
      }

      // Check if all required signers have now signed
      const parties = await _partiesRepo.listByEnvelope({ 
        envelopeId: command.envelopeId 
      });
      const requiredSigners = parties.items.filter((p: Party) => p.role === PARTY_ROLES[0]).length;
      const signedCount = parties.items.filter((p: Party) => p.role === PARTY_ROLES[0] && p.status === "signed").length;
      
      // Update envelope status based on signing progress
      if (signedCount >= requiredSigners) {
        // All signers have signed - generate final signed PDF
        try {
          await deps.orchestrationService.generateFinalSignedPdf(command.envelopeId, command.finalPdfUrl || `${deps.downloadConfig?.signedBucket}/signed-${command.envelopeId}.pdf`, parties.items);
        } catch (error) {
          console.error('Failed to generate final signed PDF:', error);
          // Continue with completion even if PDF generation fails
        }
        
        // Mark as completed
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[3] as any, // completed
          updatedAt: completedAt as ISODateString});
      } else if (signedCount > 0) {
        // Some signers have signed - mark as in_progress
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[2] as any, // in_progress
          updatedAt: completedAt as ISODateString});
      }

      await deps.eventService.publishSigningCompleted(
        command.envelopeId,
        command.signerId,
        command.actor as any
      );

      await deps.auditService.logSigningCompleted(
        command.envelopeId,
        command.signerId,
        command.actor as any
      );

      return {
        completed: true,
        completedAt: completedAt,
        signature: signature,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID,
        algorithm: command.algorithm,
        event: {
          name: "signing.completed",
          meta: { id: deps.ids.ulid(), ts: completedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            completedAt: completedAt,
            signature: signature,
            keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID,
            algorithm: command.algorithm,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Declines the signing process for a signer
     * @param command - The signing decline command containing envelope ID, signer ID, reason, and actor context
     * @returns Promise resolving to decline result with event data
     */
    async declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult> {
      
      // Validate signing operation
      const { envelope } = await deps.validationService.validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
       const party = await _partiesRepo.getById({ 
         envelopeId: command.envelopeId, 
         partyId: command.signerId 
       });
       
       deps.validationService.validateDeclineOperation(envelope.status, command.reason);
       deps.validationService.validatePartyExists(party, command.signerId, command.envelopeId);

      const declinedAt = new Date().toISOString();

      // Update envelope status to declined
      await _envelopesRepo.update(command.envelopeId, {
        status: ENVELOPE_STATUSES[5] as any,
        updatedAt: declinedAt as ISODateString});

      return {
        declined: true,
        declinedAt: declinedAt,
        reason: command.reason,
        event: {
          name: "signing.declined",
          meta: { id: deps.ids.ulid(), ts: declinedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            declinedAt: declinedAt,
            reason: command.reason,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Creates a presigned URL for file upload
     * @param command - The presign upload command containing envelope ID, filename, content type, and actor context
     * @returns Promise resolving to presign result with upload URL and event data
     */
    async presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult> {
      
      // Validate signing operation
      const { envelope: _envelope } = await deps.validationService.validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
       deps.validationService.validatePresignPolicy(command.contentType, 0, SIGNING_FILE_LIMITS.MAX_FILE_SIZE_BYTES);
       
       buildEvidencePath({
         envelopeId: command.envelopeId,
         file: command.filename
       });

       deps.validationService.validateServiceAvailable(deps.s3Service, "S3 service");
      
      const s3Result = await deps.s3Service!.createPresignedUploadUrl(
        command.envelopeId,
        command.filename,
        command.contentType
      );

      return {
        uploadUrl: s3Result.uploadUrl,
        objectKey: s3Result.objectKey,
        expiresAt: s3Result.expiresAt,
        event: {
          name: "signing.presign_upload",
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            filename: command.filename,
            contentType: command.contentType,
            objectKey: s3Result.objectKey,
            expiresAt: s3Result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Creates a presigned URL for downloading a signed document
     * @param command - The download signed document command containing envelope ID and actor context
     * @returns Promise resolving to download result with download URL and event data
     */
    async downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult> {
      
      // Validate signing operation
      const { envelope } = await deps.validationService.validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
       await deps.validationService.validateDownloadSignedDocumentBusinessLogic(command, envelope);
       deps.validationService.validateDownloadOperation(envelope.status);
       
       // Validate that envelope is in completed state for PDF download
       if (envelope.status !== ENVELOPE_STATUSES[3]) { // ENVELOPE_STATUSES[3] = "completed"
         throw new BadRequestError("Document can only be downloaded when envelope is completed");
       }
       
       deps.validationService.validateServiceAvailable(deps.s3Service, "S3 service");
      
      const s3Result = await deps.s3Service!.createPresignedDownloadUrl(
        command.envelopeId
      );

      return {
        downloadUrl: s3Result.downloadUrl,
        objectKey: s3Result.objectKey,
        expiresAt: s3Result.expiresAt,
        event: {
          name: "signing.download_signed_document",
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            filename: SIGNING_DEFAULTS.DEFAULT_FILENAME,
            contentType: SIGNING_DEFAULTS.DEFAULT_CONTENT_TYPE,
            expiresAt: s3Result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Validates an invitation token for unauthenticated signing
     */
    async validateInvitationToken(command: ValidateInvitationTokenCommand): Promise<ValidateInvitationTokenResult> {
      try {
         const invitationToken = await _invitationTokensRepo.getByToken(command.token);
         
         const validation = deps.validationService.validateInvitationTokenStatus(invitationToken, command);
         if (!validation.valid) {
           return {
             valid: false,
             error: validation.error || "Failed to validate invitation token"
           };
         }

         return {
           valid: true,
           tokenId: invitationToken!.tokenId,
           envelopeId: invitationToken!.envelopeId,
           partyId: invitationToken!.partyId,
           email: invitationToken!.email,
           name: invitationToken!.name,
           role: invitationToken!.role,
           invitedBy: invitationToken!.invitedBy,
           invitedByName: invitationToken!.invitedByName,
           message: invitationToken!.message,
           signByDate: invitationToken!.signByDate,
           signingOrder: invitationToken!.signingOrder,
           expiresAt: invitationToken!.expiresAt
         };

      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : "Failed to validate invitation token"
        };
      }
    },

    /**
     * @summary Completes signing using an invitation token (unauthenticated)
     * @description Allows unauthenticated users to sign documents using invitation tokens
     * @param command - The complete signing with token command
     * @returns Promise resolving to signing result
     */
    async completeSigningWithToken(command: CompleteSigningWithTokenCommand): Promise<CompleteSigningWithTokenResult> {
      return await deps.orchestrationService.completeSigningWithToken(command);
    },

    /**
     * @summary Records signing consent using an invitation token (unauthenticated)
     * @description Allows unauthenticated users to record consent using invitation tokens
     * @param command - The signing consent with token command
     * @returns Promise resolving to consent result
     */
    async recordSigningConsentWithToken(command: SigningConsentWithTokenCommand): Promise<SigningConsentResult> {
      try {
        const invitation = await deps.validationService.validateInvitationTokenWithRepo(command.token, _invitationTokensRepo);
        const { envelope, party } = await deps.validationService.validateEnvelopeAndParty(invitation, _envelopesRepo, _partiesRepo);
        await deps.validationService.validateConsent(command, envelope, party);
        
        const consentedAt = new Date().toISOString();
        
        await _partiesRepo.update(
          { envelopeId: command.envelopeId, partyId: command.signerId },
          { status: PARTY_STATUSES[2] } as any
        );

        await deps.eventService.publishConsentRecorded(
          command.envelopeId,
          command.signerId,
          { email: invitation.email, ip: command.ip, userAgent: command.userAgent } as any
        );

        await deps.auditService.logSigningConsentRecorded(
          command.envelopeId,
          command.signerId,
          { email: invitation.email, ip: command.ip, userAgent: command.userAgent } as any
        );
        
        return {
          consented: true,
          consentedAt: consentedAt,
          event: {
            name: "consent.recorded",
            meta: { id: deps.ids.ulid(), ts: consentedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
            data: {
              envelopeId: command.envelopeId,
              partyId: command.signerId,
              consentGiven: command.consentGiven,
              consentText: command.consentText,
              consentedAt: consentedAt,
              metadata: {
                ip: command.ip,
                userAgent: command.userAgent,
                email: invitation.email
              }
            }
          }
        };
        
      } catch (error: any) {
        throw error; // Re-throw to be handled by controller
      }
    }

  };
};



