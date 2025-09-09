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
  PresignUploadCommand,
  PresignUploadResult,
  DownloadSignedDocumentCommand,
  DownloadSignedDocumentResult
} from "../../ports/signing/SigningCommandsPort";
import type { SigningCommandService as ISigningCommandService } from "../../../domain/types/signing/ServiceInterfaces";
// Signing rules would need proper command structure integration

/**
 * @summary Command service for Signing operations
 * @description Default implementation of SigningCommandService
 */
export class SigningCommandService implements ISigningCommandService {
  constructor(private readonly commandsPort: SigningCommandsPort) {}

  /**
   * @summary Completes signing process
   * @param command - Command data for completing signing
   * @returns Promise resolving to completion result
   */
  async completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult> {
    return this.commandsPort.completeSigning(command);
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
    return this.commandsPort.recordSigningConsent(command);
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
    return this.commandsPort.downloadSignedDocument(command);
  }
};
