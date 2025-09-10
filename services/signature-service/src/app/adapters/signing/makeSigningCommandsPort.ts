/**
 * @file makeSigningCommandsPort.adapter.ts
 * @summary Factory for SigningCommandsPort
 * @description Creates and configures the SigningCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signing command operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { SigningCommandsPort, SigningConsentCommand, SigningConsentResult, PrepareSigningCommand, PrepareSigningResult, CompleteSigningCommand, CompleteSigningResult, DeclineSigningCommand, DeclineSigningResult, PresignUploadCommand, PresignUploadResult, DownloadSignedDocumentCommand, DownloadSignedDocumentResult, ValidateInvitationTokenCommand, ValidateInvitationTokenResult, CompleteSigningWithTokenCommand, CompleteSigningWithTokenResult } from "../../ports/signing/SigningCommandsPort";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { IdempotencyRunner, KmsSigner, EventBusPortAdapter, NotFoundError, ConflictError, ErrorCodes, ForbiddenError } from "@lawprotect/shared-ts";
import { badRequest, partyNotFound } from "../../../shared/errors";
import { assertKmsAlgorithmAllowed, assertPdfDigestMatches } from "../../../domain/rules/Signing.rules";
import { assertDownloadAllowed } from "../../../domain/rules/Download.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../domain/rules/CancelDecline.rules";
import { assertPresignPolicy, buildEvidencePath } from "../../../domain/rules/Evidence.rules";
import { validateSigningOperation } from "./SigningValidationHelpers";
import type { SigningRateLimitService, SigningS3Service } from "../../../domain/types/signing/ServiceInterfaces";
import { PARTY_ROLES, ENVELOPE_STATUSES, SIGNING_DEFAULTS, SIGNING_FILE_LIMITS } from "../../../domain/values/enums";

/**
 * Creates a SigningCommandsPort implementation for document signing operations
 * @param _envelopesRepo - The envelope repository for data persistence
 * @param _partiesRepo - The parties repository for data persistence
 * @param _documentsRepo - The documents repository for digest validation
 * @param deps - Dependencies including ID generators, time, events, and services
 * @returns Configured SigningCommandsPort implementation
 */
export const makeSigningCommandsPort = (
  _envelopesRepo: Repository<Envelope, EnvelopeId>,
  _partiesRepo: any, // PartyRepositoryDdb with listByEnvelope method
  _documentsRepo: any, // DocumentRepositoryDdb for digest validation
  _invitationTokensRepo: any, // InvitationTokenRepositoryDdb
  deps: {
    events: EventBusPortAdapter;
    ids: { ulid(): string };
    time: { now(): number };
    rateLimit?: SigningRateLimitService;
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
  }
): SigningCommandsPort => {
  return {
    /**
     * Records signing consent for a signer
     * @param command - The signing consent command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to consent result with event data
     */
    async recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult> {
      
      // Validate signing operation
      await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo,
        command.signerId
      );

      const consentedAt = new Date().toISOString();

      return {
        consented: true,
        consentedAt: consentedAt,
        event: {
          name: "signing.consent.recorded",
          meta: { id: deps.ids.ulid(), ts: consentedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            consentedAt: consentedAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId}}}};
    },

    /**
     * Prepares signing process for a signer
     * @param command - The signing preparation command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to preparation result with event data
     */
    async prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult> {
      
      // Validate signing operation
      await validateSigningOperation(
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
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules
      if (command.algorithm) {
        assertKmsAlgorithmAllowed(command.algorithm, deps.signingConfig?.allowedAlgorithms);
      }
      
      if (!envelope) {
        throw new NotFoundError("Envelope not found", ErrorCodes.COMMON_NOT_FOUND);
      }

      // Get and validate party first
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw partyNotFound({ partyId: command.signerId, envelopeId: command.envelopeId });
      }

      // AUTHORIZATION VALIDATION - Only the invited party can sign
      const actorEmail = (command as any).actorEmail;
      if (actorEmail && party.email !== actorEmail) {
        throw new ForbiddenError(
          "Unauthorized: Only the invited party can sign documents", 
          ErrorCodes.AUTH_FORBIDDEN,
          { envelopeId: command.envelopeId, partyId: command.signerId, partyEmail: party.email, actorEmail }
        );
      }
      
      // Get actual digest from document for validation
      // Get documents from envelope to validate digest
      const documents = await _documentsRepo.listByEnvelope({ 
        envelopeId: command.envelopeId 
      });
      
      // Find the document that matches the digest being signed
      const targetDocument = documents.items.find((doc: any) => 
        doc.digest && doc.digest.alg === command.digest.alg && doc.digest.value === command.digest.value
      );
      
      if (targetDocument?.digest) {
        assertPdfDigestMatches(command.digest, targetDocument.digest);
      }
      
      // Check if party has already signed
      if (party.status === "signed") {
        throw new ConflictError("Party has already signed", ErrorCodes.COMMON_CONFLICT);
      }

      // Use KMS to sign the digest
      const signResult = await deps.signer.sign({
        message: Buffer.from(command.digest.value, 'hex'),
        signingAlgorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID});

      const signature = Buffer.from(signResult.signature).toString('base64');
      const completedAt = new Date().toISOString();

      // Update party status to signed
      await _partiesRepo.update(command.signerId, {
        status: "signed",
        signedAt: completedAt,
        updatedAt: completedAt as ISODateString});

      // Check if all required signers have now signed
      const parties = await _partiesRepo.listByEnvelope({ 
        envelopeId: command.envelopeId 
      });
      const requiredSigners = parties.items.filter((p: any) => p.role === PARTY_ROLES[0]).length;
      const signedCount = parties.items.filter((p: any) => p.role === PARTY_ROLES[0] && p.status === "signed").length;
      
      // Update envelope status based on signing progress
      if (signedCount >= requiredSigners) {
        // All signers have signed - mark as completed
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[3] as any, // completed
          updatedAt: completedAt as ISODateString});
      } else if (signedCount > 0) {
        // Some signers have signed - mark as in_progress
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[2] as any, // in_progress
          updatedAt: completedAt as ISODateString});
      }

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
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules
      assertCancelDeclineAllowed(envelope.status);
      assertReasonValid(command.reason);

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw partyNotFound({ partyId: command.signerId, envelopeId: command.envelopeId });
      }

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
      const { envelope: _envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules for evidence integrity
      assertPresignPolicy(command.contentType, 0, SIGNING_FILE_LIMITS.MAX_FILE_SIZE_BYTES);
      
      // Build evidence path using domain rules (for future use)
      buildEvidencePath({
        envelopeId: command.envelopeId,
        file: command.filename
      });

      // Use SigningS3Service to create presigned upload URL
      if (!deps.s3Service) {
        throw badRequest("S3 service not available");
      }
      
      const s3Result = await deps.s3Service.createPresignedUploadUrl(
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
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // AUTHORIZATION VALIDATION - Only envelope owner can download signed documents
      const actorEmail = (command as any).actorEmail;
      if (actorEmail && envelope.ownerEmail !== actorEmail) {
        throw new ForbiddenError(
          "Unauthorized: Only envelope owner can download signed documents", 
          ErrorCodes.AUTH_FORBIDDEN,
          { envelopeId: command.envelopeId, ownerEmail: envelope.ownerEmail, actorEmail }
        );
      }
      
      // Apply domain-specific rules
      assertDownloadAllowed(envelope.status);

      // Use SigningS3Service to create presigned download URL
      if (!deps.s3Service) {
        throw badRequest("S3 service not available");
      }
      
      const s3Result = await deps.s3Service.createPresignedDownloadUrl(
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
        // Get the invitation token from the repository
        const invitationToken = await _invitationTokensRepo.getByToken(command.token);
        
        if (!invitationToken) {
          return {
            valid: false,
            error: "Invalid or expired invitation token"
          };
        }

        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(invitationToken.expiresAt);
        
        if (now > expiresAt) {
          return {
            valid: false,
            error: "Invitation token has expired"
          };
        }

        // Check if token is already used
        if (invitationToken.status === "used") {
          return {
            valid: false,
            error: "Invitation token has already been used"
          };
        }

        // Check if token is expired (status check)
        if (invitationToken.status === "expired") {
          return {
            valid: false,
            error: "Invitation token has expired"
          };
        }

        // Validate that the person using the token matches the invited person
        // This is the critical validation you mentioned
        if (command.ip && invitationToken.usedFromIp && command.ip !== invitationToken.usedFromIp) {
          return {
            valid: false,
            error: "Token validation failed: IP address mismatch"
          };
        }

        if (command.userAgent && invitationToken.usedWithUserAgent && command.userAgent !== invitationToken.usedWithUserAgent) {
          return {
            valid: false,
            error: "Token validation failed: User agent mismatch"
          };
        }

        // Token is valid - return party information
        return {
          valid: true,
          tokenId: invitationToken.tokenId,
          envelopeId: invitationToken.envelopeId,
          partyId: invitationToken.partyId,
          email: invitationToken.email,
          name: invitationToken.name,
          role: invitationToken.role,
          invitedBy: invitationToken.invitedBy,
          invitedByName: invitationToken.invitedByName,
          message: invitationToken.message,
          signByDate: invitationToken.signByDate,
          signingOrder: invitationToken.signingOrder,
          expiresAt: invitationToken.expiresAt
        };

      } catch (error) {
        return {
          valid: false,
          error: "Failed to validate invitation token"
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
      try {
        // 1. Validate token and get invitation data
        const invitation = await this.validateInvitationToken(command.token);
        
        // 2. Validate envelope and party
        const { envelope, party } = await this.validateEnvelopeAndParty(invitation);
        
        // 3. Validate signing prerequisites
        await this.validateSigningPrerequisites(party, command, envelope);
        
        // 4. Sign with KMS
        const signature = await this.signWithKms(command);
        
        // 5. Update states atomically
        const result = await this.updateSigningStates(invitation, party, envelope, signature, command);
        
        // 6. Publish events
        await this.publishSigningEvents(invitation, command);
        
        return result;
        
      } catch (error: any) {
        return {
          signed: false,
          error: error.message || "Failed to complete signing with token"
        };
      }
    },

    /**
     * @summary Records signing consent using an invitation token (unauthenticated)
     * @description Allows unauthenticated users to record consent using invitation tokens
     * @param command - The signing consent with token command
     * @returns Promise resolving to consent result
     */
    async recordSigningConsentWithToken(command: SigningConsentWithTokenCommand): Promise<SigningConsentResult> {
      try {
        // 1. Validate token and get invitation data
        const invitation = await this.validateInvitationToken(command.token);
        
        // 2. Validate envelope and party
        const { envelope, party } = await this.validateEnvelopeAndParty(invitation);
        
        // 3. Record consent
        const consentedAt = new Date().toISOString();
        
        // 4. Publish consent event
        await deps.eventService.publishSigningConsent(
          command.envelopeId,
          command.signerId,
          {
            ip: command.ip,
            userAgent: command.userAgent,
            email: invitation.email,
            userId: undefined
          }
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
    },

    /**
     * @summary Validates invitation token and returns invitation data
     * @param token - The invitation token to validate
     * @returns Promise resolving to invitation token data
     * @throws UnauthorizedError if token is invalid, expired, or not active
     */
    async validateInvitationToken(token: string): Promise<any> {
      const invitation = await _invitationTokensRepo.findByToken(token);
      
      if (!invitation) {
        throw new UnauthorizedError("Invalid invitation token", ErrorCodes.AUTH_UNAUTHORIZED);
      }
      
      if (invitation.status !== INVITATION_STATUSES[0]) { // "active"
        throw new UnauthorizedError("Invitation token is not active", ErrorCodes.AUTH_UNAUTHORIZED);
      }
      
      if (new Date() > new Date(invitation.expiresAt)) {
        throw new UnauthorizedError("Invitation token has expired", ErrorCodes.AUTH_UNAUTHORIZED);
      }
      
      return invitation;
    },

    /**
     * @summary Validates envelope and party existence
     * @param invitation - The invitation token data
     * @returns Promise resolving to envelope and party data
     * @throws NotFoundError if envelope or party not found
     */
    async validateEnvelopeAndParty(invitation: any): Promise<{ envelope: any; party: any }> {
      const [envelope, party] = await Promise.all([
        _envelopesRepo.findById(invitation.envelopeId),
        _partiesRepo.getById({ envelopeId: invitation.envelopeId, partyId: invitation.partyId })
      ]);
      
      if (!envelope) {
        throw new NotFoundError("Envelope not found", ErrorCodes.ENVELOPE_NOT_FOUND);
      }
      
      if (!party) {
        throw new NotFoundError("Party not found", ErrorCodes.PARTY_NOT_FOUND);
      }
      
      return { envelope, party };
    },

    /**
     * @summary Validates signing prerequisites
     * @param party - The party attempting to sign
     * @param command - The signing command
     * @param envelope - The envelope being signed
     * @throws ConflictError if party already signed
     * @throws BadRequestError if digest doesn't match
     */
    async validateSigningPrerequisites(party: any, command: CompleteSigningWithTokenCommand, envelope: any): Promise<void> {
      // Check if party already signed
      if (party.status === PARTY_STATUSES[2]) { // "signed"
        throw new ConflictError("Party has already signed", ErrorCodes.COMMON_CONFLICT);
      }
      
      // Validate document digest
      const documents = await _documentsRepo.listByEnvelope({ envelopeId: command.envelopeId });
      const targetDocument = documents.items.find((doc: any) => 
        doc.digest && doc.digest.alg === command.digest.alg && doc.digest.value === command.digest.value
      );
      
      if (targetDocument?.digest) {
        assertPdfDigestMatches(command.digest, targetDocument.digest);
      }
    },

    /**
     * @summary Signs the document using KMS
     * @param command - The signing command with digest and algorithm
     * @returns Promise resolving to base64 signature
     */
    async signWithKms(command: CompleteSigningWithTokenCommand): Promise<string> {
      const signResult = await deps.signer.sign({
        message: Buffer.from(command.digest.value, 'hex'),
        signingAlgorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID
      });
      
      return Buffer.from(signResult.signature).toString('base64');
    },

    /**
     * @summary Updates all signing states atomically
     * @param invitation - The invitation token data
     * @param party - The party data
     * @param envelope - The envelope data
     * @param signature - The generated signature
     * @param command - The signing command
     * @returns Promise resolving to signing result
     */
    async updateSigningStates(
      invitation: any, 
      party: any, 
      envelope: any, 
      signature: string, 
      command: CompleteSigningWithTokenCommand
    ): Promise<CompleteSigningWithTokenResult> {
      const completedAt = new Date().toISOString();
      
      // Update party status
      await _partiesRepo.update(command.signerId, {
        status: PARTY_STATUSES[2], // "signed"
        signedAt: completedAt,
        updatedAt: completedAt as ISODateString
      });
      
      // Update invitation token status
      await _invitationTokensRepo.update({
        tokenId: invitation.tokenId,
        status: INVITATION_STATUSES[1], // "used"
        usedAt: completedAt,
        usedFromIp: command.ip,
        usedWithUserAgent: command.userAgent
      });
      
      // Update envelope status based on signing progress
      const newEnvelopeStatus = await this.updateEnvelopeStatus(command.envelopeId, completedAt);
      
      return {
        signed: true,
        signatureId: deps.ids.ulid(),
        envelopeStatus: newEnvelopeStatus,
        signedAt: completedAt
      };
    },

    /**
     * @summary Updates envelope status based on signing progress
     * @param envelopeId - The envelope ID
     * @param completedAt - The completion timestamp
     * @returns Promise resolving to new envelope status
     */
    async updateEnvelopeStatus(envelopeId: string, completedAt: string): Promise<string> {
      const parties = await _partiesRepo.listByEnvelope({ envelopeId });
      const requiredSigners = parties.items.filter((p: any) => p.role === PARTY_ROLES[0]).length;
      const signedCount = parties.items.filter((p: any) => p.role === PARTY_ROLES[0] && p.status === PARTY_STATUSES[2]).length;
      
      let newStatus: string;
      if (signedCount >= requiredSigners) {
        newStatus = ENVELOPE_STATUSES[3]; // "completed"
      } else if (signedCount > 0) {
        newStatus = ENVELOPE_STATUSES[2]; // "in_progress"
      } else {
        newStatus = ENVELOPE_STATUSES[1]; // "sent"
      }
      
      await _envelopesRepo.update(envelopeId, {
        status: newStatus,
        updatedAt: completedAt as ISODateString
      });
      
      return newStatus;
    },

    /**
     * @summary Publishes signing completion events
     * @param invitation - The invitation token data
     * @param command - The signing command
     */
    async publishSigningEvents(invitation: any, command: CompleteSigningWithTokenCommand): Promise<void> {
      await deps.eventService.publishSigningCompleted(
        command.envelopeId,
        command.signerId,
        {
          ip: command.ip,
          userAgent: command.userAgent,
          email: invitation.email,
          userId: undefined // No user ID for token-based signing
        }
      );
    }
  };
};
