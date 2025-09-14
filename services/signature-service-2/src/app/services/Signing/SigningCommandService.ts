/**
 * @file SigningCommandService.ts
 * @summary Command service for Signing operations
 * @description Wrapper service for Signing command operations
 */

import type { 
  SigningCommandsPort,
  CompleteSigningCommand,
  CompleteSigningResult,
  DeclineSigningCommand,
  DeclineSigningResult,
  PrepareSigningCommand,
  PrepareSigningResult,
  SigningConsentCommand,
  SigningConsentResult,
  SigningConsentWithTokenCommand,
  PresignUploadCommand,
  PresignUploadResult,
  DownloadSignedDocumentCommand,
  DownloadSignedDocumentResult,
  ValidateInvitationTokenCommand,
  ValidateInvitationTokenResult,
  CompleteSigningWithTokenCommand,
  CompleteSigningWithTokenResult
} from "../../ports/signing/SigningCommandsPort";
import type { SigningCommandService as ISigningCommandService } from "../../../domain/types/signing/ServiceInterfaces";
// Authorization validation is handled by middleware in controllers
// Signing rules would need proper command structure integration

/**
 * @summary Command service for Signing operations
 * @description Default implementation of SigningCommandService with authorization validation
 */
export class SigningCommandService implements ISigningCommandService {
  constructor(
    private readonly commandsPort: SigningCommandsPort
  ) {}

  /**
   * @summary Completes signing process
   * @param command - Command data for completing signing
   * @returns Promise resolving to completion result
   */
  async completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult> {
    try {
      const result = await this.commandsPort.completeSigning(command);
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * @summary Declines signing process
   * @param command - Command data for declining signing
   * @returns Promise resolving to decline result
   */
  async declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult> {
    return this.commandsPort.declineSigning(command);
  }

  /**
   * @summary Prepares signing process
   * @param command - Command data for preparing signing
   * @returns Promise resolving to preparation result
   */
  async prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult> {
    return this.commandsPort.prepareSigning(command);
  }

  /**
   * @summary Records signing consent
   * @param command - Command data for recording consent
   * @returns Promise resolving to consent result
   */
  async recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult> {
    // Authorization validation is handled by middleware in the controller
    return this.commandsPort.recordSigningConsent(command);
  }

  /**
   * @summary Records signing consent using invitation token for unauthenticated users
   * @param command - Command data for recording consent with token
   * @returns Promise resolving to consent result
   */
  async recordSigningConsentWithToken(command: SigningConsentWithTokenCommand): Promise<SigningConsentResult> {
    // No authorization validation needed as this is for unauthenticated users
    return this.commandsPort.recordSigningConsentWithToken(command);
  }

  /**
   * @summary Creates presigned upload URL
   * @param command - Command data for presigned upload
   * @returns Promise resolving to upload URL result
   */
  async presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult> {
    return this.commandsPort.presignUpload(command);
  }

  /**
   * @summary Downloads signed document
   * @param command - Command data for downloading document
   * @returns Promise resolving to download result
   */
  async downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult> {
    // Authorization validation is handled by middleware in the controller
    return this.commandsPort.downloadSignedDocument(command);
  }

  /**
   * @summary Validates invitation token for unauthenticated signing
   * @param command - Command data for validating invitation token
   * @returns Promise resolving to validation result
   */
  async validateInvitationToken(command: ValidateInvitationTokenCommand): Promise<ValidateInvitationTokenResult> {
    // No authorization validation needed as this is for unauthenticated users
    return this.commandsPort.validateInvitationToken(command);
  }

  /**
   * @summary Completes signing using invitation token for unauthenticated users
   * @param command - Command data for completing signing with token
   * @returns Promise resolving to signing result
   */
  async completeSigningWithToken(command: CompleteSigningWithTokenCommand): Promise<CompleteSigningWithTokenResult> {
    // No authorization validation needed as this is for unauthenticated users
    return this.commandsPort.completeSigningWithToken(command);
  }
};
