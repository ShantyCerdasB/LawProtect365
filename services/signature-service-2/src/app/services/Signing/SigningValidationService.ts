/**
 * @file SigningValidationService.ts
 * @summary Validation service for Signing operations
 * @description Handles validation for Signing operations using domain rules and Zod schemas
 */

import type { 
  SigningValidationService as ISigningValidationService,
  CompleteSigningControllerInput,
  DeclineSigningControllerInput,
  PrepareSigningControllerInput,
  SigningConsentControllerInput,
  PresignUploadControllerInput,
  DownloadSignedDocumentControllerInput,
  ValidateInvitationTokenControllerInput
} from "../../../domain/types/signing";
import { HashDigestSchema, KmsAlgorithmSchema } from "@/domain/value-objects/index";
import { assertKmsAlgorithmAllowed } from "../../../domain/rules/Signing.rules";
import { assertDownloadAllowed } from "../../../domain/rules/Download.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../domain/rules/CancelDecline.rules";
import { assertPresignPolicy } from "../../../domain/rules/Evidence.rules";
import { badRequest, unprocessable, signatureHashMismatch, kmsPermissionDenied } from "../../../shared/errors";
import { ForbiddenError, ConflictError, ErrorCodes, UnauthorizedError, NotFoundError, BadRequestError } from "@lawprotect/shared-ts";
import { IpAddressSchema } from "../../../domain/value-objects/ids";
import { envelopeNotFound, partyNotFound } from "../../../shared/errors";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/ids";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";

/**
 * @summary Validation service for Signing operations
 * @description Default implementation of SigningValidationService
 */
export class SigningValidationService implements ISigningValidationService {
  validateCompleteSigning(input: CompleteSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.digest) {
      throw badRequest("Digest is required");
    }
    if (!input.algorithm?.trim()) {
      throw badRequest("Algorithm is required");
    }

    // Validate digest using domain value object
    try {
      HashDigestSchema.parse(input.digest);
    } catch (error) {
      throw signatureHashMismatch({ digest: input.digest, originalError: error });
    }

    // Validate KMS algorithm using domain value object
    try {
      const algorithm = KmsAlgorithmSchema.parse(input.algorithm);
      // Use domain rule to check if algorithm is allowed
      assertKmsAlgorithmAllowed(algorithm, [algorithm]); // Allow the provided algorithm
    } catch (error) {
      throw kmsPermissionDenied({ algorithm: input.algorithm, originalError: error });
    }
  }

  validateDeclineSigning(input: DeclineSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.reason?.trim()) {
      throw badRequest("Reason is required for declining");
    }
  }

  validatePrepareSigning(input: PrepareSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
  }

  validateSigningConsent(input: SigningConsentControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (typeof input.consentGiven !== "boolean") {
      throw badRequest("Consent given must be a boolean value");
    }
    if (!input.consentText?.trim()) {
      throw badRequest("Consent text is required");
    }
  }

  validatePresignUpload(input: PresignUploadControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.filename?.trim()) {
      throw badRequest("Filename is required");
    }
    if (!input.contentType?.trim()) {
      throw badRequest("Content type is required");
    }

    // Validate filename (basic validation)
    if (input.filename.includes("..") || input.filename.includes("/") || input.filename.includes("\\")) {
      throw unprocessable("Invalid filename", "EVIDENCE_UPLOAD_INCOMPLETE", { filename: input.filename });
    }

    // Validate content type (basic validation)
    const allowedContentTypes = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedContentTypes.includes(input.contentType)) {
      throw unprocessable("Unsupported content type", "EVIDENCE_UPLOAD_INCOMPLETE", { contentType: input.contentType });
    }
  }

  validateDownloadSignedDocument(input: DownloadSignedDocumentControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
  }

  validateInvitationToken(input: ValidateInvitationTokenControllerInput): void {
    if (!input.token?.trim()) {
      throw badRequest("Invitation token is required", "INVITATION_TOKEN_INVALID");
    }
    // IP and UserAgent are optional, no validation needed
  }

  /**
   * @summary Validates consent recording business logic
   * @description Validates ownership, consent status, and envelope state for consent recording
   * @param command - Signing consent command
   * @param envelope - Envelope entity
   * @param party - Party entity
   * @throws ForbiddenError if actor is not the invited party
   * @throws ConflictError if consent already given
   * @throws BadRequestError if envelope is not in valid state
   */
  async validateConsent(command: any, envelope: any, party: any): Promise<void> {
    const actorEmail = command.actorEmail;
    
    // Validate ownership - only the invited party can give consent
    if (actorEmail && party && party.email !== actorEmail) {
      throw new ForbiddenError(
        "Unauthorized: Only the invited party can give consent", 
        ErrorCodes.AUTH_FORBIDDEN,
        { envelopeId: command.envelopeId, partyId: command.signerId, partyEmail: party.email, actorEmail }
      );
    }
    
    // Validate consent not already given
    if (party && party.status === "consented") {
      throw new ConflictError(
        "Party has already given consent",
        ErrorCodes.COMMON_CONFLICT,
        { envelopeId: command.envelopeId, partyId: command.signerId }
      );
    }
    
    // Validate envelope state - draft, sent, or in_progress envelopes can receive consent
    if (envelope.status !== "draft" && envelope.status !== "sent" && envelope.status !== "in_progress") {
      throw badRequest(
        "Cannot record consent: Envelope is not in a valid state",
        "ENVELOPE_INVALID_STATE",
        { envelopeId: command.envelopeId, currentStatus: envelope.status }
      );
    }
  }

  /**
   * @summary Validates complete signing business logic
   * @description Validates ownership, consent status, and duplicate signing for complete signing
   * @param command - Complete signing command
   * @param envelope - Envelope entity
   * @param party - Party entity
   * @throws ForbiddenError if actor is not the invited party or consent not given
   * @throws ConflictError if party already signed
   */
  async validateCompleteSigningBusinessLogic(command: any, _envelope: any, party: any): Promise<void> {
    const actorEmail = command.actorEmail;
    
    // Validate ownership - only the invited party can sign documents
    if (actorEmail && party.email !== actorEmail) {
      throw new ForbiddenError(
        "Unauthorized: Only the invited party can sign documents", 
        ErrorCodes.AUTH_FORBIDDEN,
        { envelopeId: command.envelopeId, partyId: command.signerId, partyEmail: party.email, actorEmail }
      );
    }
    
    // Validate consent - party must have given consent or already signed
    if (party.status !== "consented" && party.status !== "signed") {
      throw new ForbiddenError(
        "Unauthorized: Party has not given consent to sign",
        ErrorCodes.AUTH_FORBIDDEN,
        { envelopeId: command.envelopeId, partyId: command.signerId, currentStatus: party.status }
      );
    }
    
    // Validate no duplicate signing
    if (party.status === "signed") {
      throw new ConflictError(
        "Party has already signed this document",
        ErrorCodes.COMMON_CONFLICT,
        { envelopeId: command.envelopeId, partyId: command.signerId }
      );
    }
  }

  /**
   * @summary Validates download signed document business logic
   * @description Validates ownership for downloading signed documents
   * @param command - Download command
   * @param envelope - Envelope entity
   * @throws ForbiddenError if actor is not the envelope owner
   */
  async validateDownloadSignedDocumentBusinessLogic(command: any, envelope: any): Promise<void> {
    const actorEmail = command.actorEmail;
    
    // Validate ownership - only envelope owner can download signed documents
    if (actorEmail && envelope.ownerEmail !== actorEmail) {
      throw new ForbiddenError(
        "Unauthorized: Only envelope owner can download signed documents", 
        ErrorCodes.AUTH_FORBIDDEN,
        { envelopeId: command.envelopeId, ownerEmail: envelope.ownerEmail, actorEmail }
      );
    }
  }

  /**
   * @summary Validates invitation token and returns invitation data
   * @param token - The invitation token to validate
   * @param invitationTokensRepo - Repository for invitation tokens
   * @returns Promise resolving to invitation token data
   * @throws UnauthorizedError if token is invalid, expired, or not active
   */
  async validateInvitationTokenWithRepo(token: string, invitationTokensRepo: any): Promise<any> {
    const invitation = await invitationTokensRepo.getByToken(token);
    
    if (!invitation) {
      throw new UnauthorizedError("Invalid invitation token", ErrorCodes.AUTH_UNAUTHORIZED);
    }
    
    if (invitation.status !== "active") {
      throw new UnauthorizedError("Invitation token is not active", ErrorCodes.AUTH_UNAUTHORIZED);
    }
    
    if (new Date() > new Date(invitation.expiresAt)) {
      throw new UnauthorizedError("Invitation token has expired", ErrorCodes.AUTH_UNAUTHORIZED);
    }
    
    return invitation;
  }

  /**
   * @summary Validates envelope and party existence
   * @param invitation - The invitation token data
   * @param envelopesRepo - Repository for envelopes
   * @param partiesRepo - Repository for parties
   * @returns Promise resolving to envelope and party data
   * @throws NotFoundError if envelope or party not found
   */
  async validateEnvelopeAndParty(invitation: any, envelopesRepo: any, partiesRepo: any): Promise<{ envelope: any; party: any }> {
    const [envelope, party] = await Promise.all([
      envelopesRepo.getById(invitation.envelopeId),
      partiesRepo.getById({ envelopeId: invitation.envelopeId, partyId: invitation.partyId })
    ]);
    
    if (!envelope) {
      throw new NotFoundError("Envelope not found", ErrorCodes.COMMON_NOT_FOUND);
    }
    
    if (!party) {
      throw new NotFoundError("Party not found", ErrorCodes.COMMON_NOT_FOUND);
    }
    
    return { envelope, party };
  }

  /**
   * @summary Validates signing prerequisites for token-based signing
   * @param party - The party attempting to sign
   * @param command - The signing command
   * @param envelope - The envelope being signed
   * @throws ConflictError if party already signed
   */
  async validateSigningPrerequisites(party: any, _command: any, _envelope: any): Promise<void> {
    if (party.status === "signed") {
      throw new ConflictError("Party has already signed", ErrorCodes.COMMON_CONFLICT);
    }
  }

  /**
   * @summary Validates envelope existence
   * @param envelope - The envelope to validate
   * @throws NotFoundError if envelope not found
   */
  validateEnvelopeExists(envelope: any): void {
    if (!envelope) {
      throw new NotFoundError("Envelope not found", ErrorCodes.COMMON_NOT_FOUND);
    }
  }

  /**
   * @summary Validates party existence
   * @param party - The party to validate
   * @param partyId - The party ID for error context
   * @param envelopeId - The envelope ID for error context
   * @throws NotFoundError if party not found
   */
  validatePartyExists(party: any, partyId: string, envelopeId: string): void {
    if (!party) {
      throw new NotFoundError("Party not found", ErrorCodes.COMMON_NOT_FOUND, { partyId, envelopeId });
    }
  }

  /**
   * @summary Validates service availability
   * @param service - The service to validate
   * @param serviceName - The service name for error context
   * @throws BadRequestError if service not available
   */
  validateServiceAvailable(service: any, serviceName: string): void {
    if (!service) {
      throw new BadRequestError(`${serviceName} not available`, ErrorCodes.COMMON_BAD_REQUEST);
    }
  }

  /**
   * @summary Validates KMS algorithm
   * @param algorithm - The algorithm to validate
   * @param allowedAlgorithms - The allowed algorithms list
   */
  validateKmsAlgorithm(algorithm: string, allowedAlgorithms?: readonly string[]): void {
    if (algorithm) {
      assertKmsAlgorithmAllowed(algorithm, allowedAlgorithms);
    }
  }

  /**
   * @summary Validates decline operation
   * @param envelopeStatus - The envelope status
   * @param reason - The decline reason
   */
  validateDeclineOperation(envelopeStatus: string, reason: string): void {
    assertCancelDeclineAllowed(envelopeStatus as any);
    assertReasonValid(reason);
  }

  /**
   * @summary Validates download operation
   * @param envelopeStatus - The envelope status
   */
  validateDownloadOperation(envelopeStatus: string): void {
    assertDownloadAllowed(envelopeStatus as any);
  }

  /**
   * @summary Validates presign policy
   * @param contentType - The content type
   * @param fileSize - The file size
   * @param maxFileSize - The maximum file size
   */
  validatePresignPolicy(contentType: string, fileSize: number, maxFileSize: number): void {
    assertPresignPolicy(contentType, fileSize, maxFileSize);
  }

  /**
   * @summary Validates invitation token status
   * @param invitationToken - The invitation token to validate
   * @param command - The command with IP and user agent
   * @returns Validation result with validity and error message
   */
  validateInvitationTokenStatus(invitationToken: any, command: any): { valid: boolean; error?: string } {
    if (!invitationToken) {
      return { valid: false, error: "Invalid or expired invitation token" };
    }

    const now = new Date();
    const expiresAt = new Date(invitationToken.expiresAt);
    
    if (now > expiresAt) {
      return { valid: false, error: "Invitation token has expired" };
    }

    if (invitationToken.status === "used") {
      return { valid: false, error: "Invitation token has already been used" };
    }

    if (invitationToken.status === "expired") {
      return { valid: false, error: "Invitation token has expired" };
    }

    if (command.ip && invitationToken.usedFromIp && command.ip !== invitationToken.usedFromIp) {
      return { valid: false, error: "Token validation failed: IP address mismatch" };
    }

    if (command.userAgent && invitationToken.usedWithUserAgent && command.userAgent !== invitationToken.usedWithUserAgent) {
      return { valid: false, error: "Token validation failed: User agent mismatch" };
    }

    return { valid: true };
  }

  /**
   * @summary Validates party signature data
   * @param party - The party to validate
   * @returns True if party has valid signature data
   */
  validatePartySignatureData(party: any): boolean {
    return party.status === "signed" && party.signedAt;
  }

  /**
   * @summary Validates signature completeness
   * @param signature - The signature data
   * @param digest - The digest data
   * @param algorithm - The algorithm data
   * @returns True if signature data is complete
   */
  validateSignatureCompleteness(signature: any, digest: any, algorithm: any): boolean {
    return !!(signature && digest && algorithm);
  }

  /**
   * @summary Validates actor IP address if provided
   * @param actor - Actor object containing optional IP address
   * @throws Validation error if IP address format is invalid
   */
  validateActorIp(actor: { ip?: string } | undefined): void {
    if (actor?.ip) {
      IpAddressSchema.parse(actor.ip);
    }
  }

  /**
   * @summary Validates envelope exists and returns it
   * @param envelopesRepo - Repository for envelope operations
   * @param envelopeId - Unique identifier for the envelope
   * @returns Promise resolving to the envelope entity
   * @throws NotFoundError if envelope does not exist
   */
  async validateEnvelope(envelopesRepo: { getById(id: EnvelopeId): Promise<Envelope | null> }, envelopeId: EnvelopeId): Promise<Envelope> {
    const envelope = await envelopesRepo.getById(envelopeId);
    if (!envelope) {
      throw envelopeNotFound({ envelopeId });
    }
    return envelope;
  }

  /**
   * @summary Validates party exists and returns it
   * @param partiesRepo - Repository for party operations
   * @param envelopeId - Unique identifier for the envelope
   * @param partyId - Unique identifier for the party
   * @returns Promise resolving to the party entity
   * @throws NotFoundError if party does not exist
   */
  async validateParty(partiesRepo: { getById(key: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<Party | null> }, envelopeId: EnvelopeId, partyId: PartyId): Promise<Party> {
    const party = await partiesRepo.getById({ 
      envelopeId, 
      partyId 
    });
    if (!party) {
      throw partyNotFound({ partyId, envelopeId });
    }
    return party;
  }

  /**
   * @summary Common validation for signing operations
   * @param command - Command object containing envelope ID and actor context
   * @param envelopesRepo - Repository for envelope operations
   * @param partiesRepo - Repository for party operations
   * @param signerId - Optional signer ID for party validation
   * @returns Promise resolving to validation result with envelope and optional party
   */
  async validateSigningOperation(
    command: { envelopeId: EnvelopeId; actor?: { ip?: string } },
    envelopesRepo: { getById(id: EnvelopeId): Promise<Envelope | null> },
    partiesRepo: { getById(key: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<Party | null> },
    signerId?: PartyId
  ): Promise<{ envelope: Envelope; party: Party | null }> {
    // Validate IP address if provided
    this.validateActorIp(command.actor);

    // Get and validate envelope
    const envelope = await this.validateEnvelope(envelopesRepo, command.envelopeId);

    // Get and validate party if signerId is provided
    let party = null;
    if (signerId) {
      party = await this.validateParty(partiesRepo, command.envelopeId, signerId);
    }

    return { envelope, party };
  }
};
