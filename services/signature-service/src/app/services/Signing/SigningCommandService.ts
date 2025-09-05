/**
 * @file SigningCommandService.ts
 * @summary Command service for Signing operations
 * @description Wrapper service for Signing command operations
 */

import type { 
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
import type { SigningCommandsPort } from "../../ports/signing/SigningCommandsPort";
import type { SigningCommandService } from "../../../shared/types/signing/ServiceInterfaces";

/**
 * @description Default implementation of SigningCommandService
 */
export class DefaultSigningCommandService implements SigningCommandService {
  constructor(private readonly commandsPort: SigningCommandsPort) {}

  async completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult> {
    return this.commandsPort.completeSigning(command);
  }

  async declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult> {
    return this.commandsPort.declineSigning(command);
  }

  async prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult> {
    return this.commandsPort.prepareSigning(command);
  }

  async recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult> {
    return this.commandsPort.recordSigningConsent(command);
  }

  async presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult> {
    return this.commandsPort.presignUpload(command);
  }

  async downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult> {
    return this.commandsPort.downloadSignedDocument(command);
  }
}
