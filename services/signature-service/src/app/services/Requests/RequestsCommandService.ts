/**
 * @file RequestsCommandService.ts
 * @summary Consolidated command service for requests
 * @description Simple wrapper around RequestsCommandsPort for all request operations
 */

import type { 
  RequestsCommandsPort,
  InvitePartiesCommand,
  InvitePartiesResult,
  RemindPartiesCommand,
  RemindPartiesResult,
  CancelEnvelopeCommand,
  CancelEnvelopeResult,
  DeclineEnvelopeCommand,
  DeclineEnvelopeResult,
  FinaliseEnvelopeCommand,
  FinaliseEnvelopeResult,
  RequestSignatureCommand,
  RequestSignatureResult,
  AddViewerCommand,
  AddViewerResult
} from "../../ports/requests/RequestsCommandsPort";

/**
 * @summary Command service for Requests operations
 * @description Delegates all operations to the RequestsCommandsPort
 */
export class RequestsCommandService {
  constructor(private readonly commandsPort: RequestsCommandsPort) {}

  /**
   * @summary Invite parties to sign an envelope
   * @param command - Command data for inviting parties
   * @returns Promise resolving to invite result
   */
  async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
    return this.commandsPort.inviteParties(command);
  }

  /**
   * @summary Send reminders to parties
   * @param command - Command data for sending reminders
   * @returns Promise resolving to reminder result
   */
  async remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult> {
    return this.commandsPort.remindParties(command);
  }

  /**
   * @summary Cancel an envelope
   * @param command - Command data for canceling envelope
   * @returns Promise resolving to cancel result
   */
  async cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult> {
    return this.commandsPort.cancelEnvelope(command);
  }

  /**
   * @summary Decline an envelope
   * @param command - Command data for declining envelope
   * @returns Promise resolving to decline result
   */
  async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
    return this.commandsPort.declineEnvelope(command);
  }

  /**
   * @summary Finalise an envelope
   * @param command - Command data for finalizing envelope
   * @returns Promise resolving to finalize result
   */
  async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
    return this.commandsPort.finaliseEnvelope(command);
  }

  /**
   * @summary Request signature from parties
   * @param command - Command data for requesting signature
   * @returns Promise resolving to signature request result
   */
  async requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult> {
    return this.commandsPort.requestSignature(command);
  }

  /**
   * @summary Add a viewer to an envelope
   * @param command - Command data for adding viewer
   * @returns Promise resolving to add viewer result
   */
  async addViewer(command: AddViewerCommand): Promise<AddViewerResult> {
    return this.commandsPort.addViewer(command);
  }
};
