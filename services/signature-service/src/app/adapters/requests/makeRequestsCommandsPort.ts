/**
 * @file makeRequestsCommandsPort.ts
 * @summary Factory for RequestsCommandsPort.
 * @description Creates and configures the RequestsCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for request command operations.
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
  AddViewerResult,
} from "../../ports/requests/RequestsCommandsPort";
import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { Input } from "@/domain/entities/Input";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/Ids";
import type { PartyRepositoryDdb } from "@/adapters/dynamodb/PartyRepositoryDdb";

// Wrapper adapter to make PartyRepositoryDdb compatible with Repository<Party, PartyId>
class PartyRepositoryAdapter implements Repository<Party, PartyId> {
  constructor(
    private readonly partyRepo: PartyRepositoryDdb,
    private readonly envelopeId: EnvelopeId
  ) {}

  async getById(id: PartyId): Promise<Party | null> {
    const key = { envelopeId: this.envelopeId, partyId: id };
    return this.partyRepo.getById(key);
  }

  async exists(id: PartyId): Promise<boolean> {
    const key = { envelopeId: this.envelopeId, partyId: id };
    return this.partyRepo.exists(key);
  }

  async create(entity: Party): Promise<Party> {
    return this.partyRepo.create(entity);
  }

  async update(id: PartyId, patch: Partial<Party>): Promise<Party> {
    const key = { envelopeId: this.envelopeId, partyId: id };
    return this.partyRepo.update(key, patch);
  }

  async delete(id: PartyId): Promise<void> {
    const key = { envelopeId: this.envelopeId, partyId: id };
    return this.partyRepo.delete(key);
  }
}

/**
 * Creates a RequestsCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param partiesRepo - The party repository for data persistence
 * @param inputsRepo - The input repository for data persistence
 * @param deps - Dependencies including ID generators, events, and audit
 * @returns Configured RequestsCommandsPort implementation
 */
export const makeRequestsCommandsPort = (
  envelopesRepo: Repository<Envelope, EnvelopeId>,
  partiesRepo: PartyRepositoryDdb,
  inputsRepo: Repository<Input, any>,
  deps: { 
    ids: { ulid(): string };
    events: { publish(event: any): Promise<void> };
    audit: { log(action: string, details: any): Promise<void> };
  }
): RequestsCommandsPort => {
  return {
    /**
     * @description Invites parties to sign an envelope.
     * 
     * @param {InvitePartiesCommand} command - The invitation command
     * @returns {Promise<InvitePartiesResult>} Promise resolving to invitation result
     */
    async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
      const { inviteParties } = await import("@/use-cases/requests/Invite");
      
      // Create adapter for parties repository
      const partiesAdapter = new PartyRepositoryAdapter(partiesRepo, command.envelopeId);
      
      const result = await inviteParties(
        {
          envelopeId: command.envelopeId,
          partyIds: command.partyIds,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesAdapter,
            inputs: inputsRepo,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        invited: result.invited,
        alreadyPending: result.alreadyPending,
        skipped: result.skipped,
        statusChanged: result.statusChanged,
      };
    },

    /**
     * @description Sends reminders to parties for an envelope.
     * 
     * @param {RemindPartiesCommand} command - The reminder command
     * @returns {Promise<RemindPartiesResult>} Promise resolving to reminder result
     */
    async remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult> {
      const { remindParties } = await import("@/use-cases/requests/Remind");
      
      // Create adapter for parties repository
      const partiesAdapter = new PartyRepositoryAdapter(partiesRepo, command.envelopeId);
      
      const result = await remindParties(
        {
          envelopeId: command.envelopeId,
          partyIds: command.partyIds,
          message: command.message,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesAdapter,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        reminded: result.reminded,
        skipped: result.skipped,
      };
    },

    /**
     * @description Cancels an envelope.
     * 
     * @param {CancelEnvelopeCommand} command - The cancellation command
     * @returns {Promise<CancelEnvelopeResult>} Promise resolving to cancellation result
     */
    async cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult> {
      const { cancelEnvelope } = await import("@/use-cases/requests/Cancel");
      
      const result = await cancelEnvelope(
        {
          envelopeId: command.envelopeId,
          reason: command.reason,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        envelopeId: result.envelope.envelopeId,
        status: result.envelope.status,
        canceledAt: result.envelope.updatedAt,
      };
    },

    /**
     * @description Declines an envelope.
     * 
     * @param {DeclineEnvelopeCommand} command - The decline command
     * @returns {Promise<DeclineEnvelopeResult>} Promise resolving to decline result
     */
    async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
      const { declineEnvelope } = await import("@/use-cases/requests/Decline");
      
      const result = await declineEnvelope(
        {
          envelopeId: command.envelopeId,
          reason: command.reason,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        envelopeId: result.envelope.envelopeId,
        status: result.envelope.status,
        declinedAt: result.envelope.updatedAt,
      };
    },

    /**
     * @description Finalizes a completed envelope.
     * 
     * @param {FinaliseEnvelopeCommand} command - The finalization command
     * @returns {Promise<FinaliseEnvelopeResult>} Promise resolving to finalization result
     */
    async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
      const { finaliseEnvelope } = await import("@/use-cases/requests/Finalise");
      
      const result = await finaliseEnvelope(
        {
          envelopeId: command.envelopeId,
          message: command.message,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        envelopeId: result.envelope.envelopeId,
        artifactIds: result.artifactIds,
        finalizedAt: result.finalizedAt,
      };
    },

    /**
     * @description Requests a signature from a specific party.
     * 
     * @param {RequestSignatureCommand} command - The signature request command
     * @returns {Promise<RequestSignatureResult>} Promise resolving to signature request result
     */
    async requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult> {
      const { requestSignature } = await import("@/use-cases/requests/RequestSignature");
      
      // Create adapter for parties repository
      const partiesAdapter = new PartyRepositoryAdapter(partiesRepo, command.envelopeId);
      
      const result = await requestSignature(
        {
          envelopeId: command.envelopeId,
          partyId: command.partyId,
          message: command.message,
          channel: command.channel,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesAdapter,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        partyId: result.partyId,
        signingUrl: result.signingUrl,
        expiresAt: result.expiresAt,
        statusChanged: result.statusChanged,
      };
    },

    /**
     * @description Adds a viewer to an envelope.
     * 
     * @param {AddViewerCommand} command - The add viewer command
     * @returns {Promise<AddViewerResult>} Promise resolving to add viewer result
     */
    async addViewer(command: AddViewerCommand): Promise<AddViewerResult> {
      const { addViewer } = await import("@/use-cases/requests/AddViewer");
      
      // Create adapter for parties repository
      const partiesAdapter = new PartyRepositoryAdapter(partiesRepo, command.envelopeId);
      
      const result = await addViewer(
        {
          envelopeId: command.envelopeId,
          email: command.email,
          name: command.name,
          locale: command.locale,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesAdapter,
          },
          ids: deps.ids,
          events: deps.events,
          audit: deps.audit,
        }
      );

      return {
        partyId: result.party.partyId as PartyId,
        email: result.party.email,
        addedAt: result.party.createdAt,
      };
    },
  };
};
