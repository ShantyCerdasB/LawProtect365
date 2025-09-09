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
 * @summary Default implementation of RequestsCommandService
 * @description Delegates all operations to the RequestsCommandsPort
 */
export class DefaultRequestsCommandService {
  constructor(private readonly commandsPort: RequestsCommandsPort) {}

  /**
   * @summary Invite parties to sign an envelope
   */
  async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
    return this.commandsPort.inviteParties(command);
  }

  /**
   * @summary Send reminders to parties
   */
  async remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult> {
    return this.commandsPort.remindParties(command);
  }

  /**
   * @summary Cancel an envelope
   */
  async cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult> {
    return this.commandsPort.cancelEnvelope(command);
  }

  /**
   * @summary Decline an envelope
   */
  async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
    return this.commandsPort.declineEnvelope(command);
  }

  /**
   * @summary Finalise an envelope
   */
  async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
    return this.commandsPort.finaliseEnvelope(command);
  }

  /**
   * @summary Request signature from parties
   */
  async requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult> {
    return this.commandsPort.requestSignature(command);
  }

  /**
   * @summary Add a viewer to an envelope
   */
  async addViewer(command: AddViewerCommand): Promise<AddViewerResult> {
    return this.commandsPort.addViewer(command);
  }
}






