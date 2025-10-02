/**
 * @fileoverview SignatureOrchestrator
 * @summary Coordinates signature-related workflows by delegating to injected use cases.
 * @description
 * A thin application-layer façade that keeps controllers/UI simple. It receives a single
 * dependency object with **services** and **use cases**, and delegates each public method
 * to the corresponding use case. No `new` expressions or business rules live here.
 *
 * @remarks
 * - **No construction inside**: all instantiation happens in composition builders
 *   (e.g., `infrastructure/factories/{services,use-cases,orchestrator}.ts`).
 * - **Behavioral parity**: method contracts and error behavior mirror the injected use cases.
 * - **VOs vs primitives**: adapters/controllers pass primitives; use cases map to VOs at the boundary.
 */

import type { Services, UseCases } from '@/domain/types/infraestructure/container';
import type { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import type { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import { NetworkSecurityContext, rethrow, NotificationType } from '@lawprotect/shared-ts';
import type { UpdateEnvelopeData } from '@/domain/rules/EnvelopeUpdateValidationRule';
import type {
  CreateEnvelopeRequest,
  CreateEnvelopeResult,
  SignDocumentRequest,
  SignDocumentResult,
} from '@/domain/types/orchestrator';
import type { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import type { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';
import type { SignerId } from '@/domain/value-objects/SignerId';
import type { Email } from '@lawprotect/shared-ts';

/**
 * Application-layer orchestrator that wires use cases and services via dependency injection.
 * This class should remain free of domain/business logic.
 *
 * @public
 */
export class SignatureOrchestrator {
  /**
   * Constructs the orchestrator with a single dependencies object.
   *
   * @param deps - Bundled dependencies for this orchestrator.
   * @param deps.services - Domain/application services (shared infra).
   * @param deps.useCases - Pre-wired use cases to delegate business flows.
   *
   * @example
   * const services = makeServices();
   * const useCases = makeUseCases(services);
   * const orchestrator = new SignatureOrchestrator({ services, useCases });
   */
  constructor(
    private readonly deps: {
      services: Services;
      useCases: UseCases;
    }
  ) {}

  /**
   * Creates a new envelope and its signer roster without generating invitation tokens.
   *
   * @param request - Envelope creation payload.
   * @returns Newly created envelope and signers.
   * @throws Propagates any domain/application errors thrown by the use case.
   */
  async createEnvelope(request: CreateEnvelopeRequest): Promise<CreateEnvelopeResult> {
    try {
      return await this.deps.useCases.createEnvelopeUseCase.execute(request);
    } catch (error) {
      rethrow(error as Error);
    }
  }

  /**
   * Retrieves a single envelope with signers after validating access.
   * For external access, marks the invitation token as viewed on a best-effort basis.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param userId - Optional owner user id for owner-based access.
   * @param invitationToken - Optional external access token for guest/signer access.
   * @param securityContext - Optional client network context for auditing.
   * @returns Envelope, full signer list, and resolved access type.
   * @throws Propagates access/validation errors from the use case.
   */
  async getEnvelope(
    envelopeId: EnvelopeId,
    userId?: string,
    invitationToken?: string,
    securityContext?: { ipAddress: string; userAgent: string; country?: string }
  ) {
    return await this.deps.useCases.getEnvelopeUseCase.execute({
      envelopeId,
      userId,
      invitationToken,
      securityContext,
    });
  }

  /**
   * Lists envelopes created by a user with optional status filter and cursor pagination.
   *
   * @param userId - Owner user id.
   * @param filters - Optional filters for status, page size limit, and cursor.
   * @returns Page of envelopes plus per-envelope signer rosters and optional next cursor.
   * @throws Propagates repository/use case errors.
   */
  async listEnvelopesByUser(
    userId: string,
    filters: { status?: EnvelopeStatus; limit?: number; cursor?: string } = {}
  ) {
    return await this.deps.useCases.listEnvelopesByUserUseCase.execute({ userId, filters });
  }

  /**
   * Declines a signer (owner or external via token), updates envelope state, and emits notifications.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param signerId - Signer identifier (VO).
   * @param request - Decline payload with reason and optional invitation token.
   * @param securityContext - Client network context for auditing.
   * @returns Decline outcome including updated envelope status and decline info.
   * @throws Propagates validation/state transition errors.
   */
  async declineSigner(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    request: { reason: string; invitationToken?: string },
    securityContext: NetworkSecurityContext
  ) {
    return await this.deps.useCases.declineSignerUseCase.execute({
      envelopeId,
      signerId,
      request,
      securityContext,
    });
  }

  /**
   * Produces a time-limited download URL for the latest signed document.
   * Access can be owner-based or external via invitation token.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param userId - Optional owner user id.
   * @param invitationToken - Optional external access token.
   * @param expiresIn - Optional link TTL in seconds.
   * @param securityContext - Optional client network context.
   * @returns Download URL and expiration time.
   * @throws Propagates storage/access errors from the use case.
   */
  async downloadDocument(
    envelopeId: EnvelopeId,
    userId?: string,
    invitationToken?: string,
    expiresIn?: number,
    securityContext?: NetworkSecurityContext
  ) {
    return await this.deps.useCases.downloadDocumentUseCase.execute({
      envelopeId,
      userId,
      invitationToken,
      expiresIn,
      securityContext,
    });
  }

  /**
   * Returns the complete audit trail for a given envelope.
   * Only the owner is authorized to fetch the audit trail.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param userId - Owner user id.
   * @returns Audit trail events for the envelope.
   * @throws Propagates authorization/errors from the use case.
   */
  async getAuditTrail(envelopeId: EnvelopeId, userId: string) {
    return await this.deps.useCases.getAuditTrailUseCase.execute({ envelopeId, userId });
  }

  /**
   * Sends reminder notifications to pending signers, enforcing rate limits and auditing.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param request - Reminder request with type, optional signer ids, and optional message.
   * @param userId - Owner user id issuing the reminders.
   * @param securityContext - Client network context for auditing.
   * @returns Summary of reminders sent and skipped.
   * @throws Propagates rate limit/notification errors.
   */
  async sendReminders(
    envelopeId: EnvelopeId,
    request: {
      type: NotificationType.REMINDER;
      signerIds?: string[];
      message?: string;
    },
    userId: string,
    securityContext: NetworkSecurityContext
  ) {
    return this.deps.useCases.sendRemindersUseCase.execute({
      envelopeId,
      request,
      userId,
      securityContext,
    });
  }

  /**
   * Cancels an envelope after access validation and emits cancellation events.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param userId - Owner user id.
   * @param securityContext - Client network context for auditing.
   * @returns Cancelled envelope entity.
   * @throws Propagates state transition/notification errors.
   */
  async cancelEnvelope(
    envelopeId: EnvelopeId,
    userId: string,
    securityContext: NetworkSecurityContext
  ): Promise<{ envelope: SignatureEnvelope }> {
    return await this.deps.useCases.cancelEnvelopeUseCase.execute({
      envelopeId,
      userId,
      securityContext,
    });
  }

  /**
   * Updates envelope metadata and signer roster (add/remove), optionally returning updated signers.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param updateData - Envelope update payload.
   * @param userId - Owner user id.
   * @returns Updated envelope and, when roster changed, the updated signer list.
   * @throws Propagates validation/persistence errors.
   */
  async updateEnvelope(
    envelopeId: EnvelopeId,
    updateData: UpdateEnvelopeData,
    userId: string
  ): Promise<{ envelope: SignatureEnvelope; signers?: EnvelopeSigner[] }> {
    return await this.deps.useCases.updateEnvelopeUseCase.execute({
      envelopeId,
      updateData,
      userId,
    });
  }

  /**
   * Transitions an envelope to "sent", generates invitation tokens for target signers,
   * dispatches notifications, and writes an audit event.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param userId - Owner user id.
   * @param securityContext - Client network context for auditing.
   * @param options - Optional send options (message, sendToAll, specific signers).
   * @returns Send summary including tokens generated and signers notified.
   * @throws Propagates notification/audit errors.
   */
  async sendEnvelope(
    envelopeId: EnvelopeId,
    userId: string,
    securityContext: NetworkSecurityContext,
    options: {
      message?: string;
      sendToAll?: boolean;
      signers?: Array<{ signerId: string; message?: string }>;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    envelopeId: string;
    status: string;
    tokensGenerated: number;
    signersNotified: number;
    tokens: Array<{ signerId: string; email?: string; token: string; expiresAt: Date }>;
  }> {
    return await this.deps.useCases.sendEnvelopeUseCase.execute({
      envelopeId,
      userId,
      securityContext,
      options,
    });
  }

  /**
   * Shares read-only document view with a non-signer viewer and sends an invitation link.
   *
   * @param envelopeId - Envelope identifier (VO).
   * @param email - Viewer email address (VO).
   * @param fullName - Viewer full name.
   * @param message - Optional message to include in the invitation.
   * @param expiresInDays - Optional expiration in days for the viewer link (defaults handled in use case).
   * @param userId - Owner user id.
   * @param securityContext - Client network context for auditing.
   * @returns Viewer invitation details including token and expiration.
   * @throws Propagates notification/audit errors.
   */
  async shareDocumentView(
    envelopeId: EnvelopeId,
    email: Email,
    fullName: string,
    message: string | undefined,
    expiresInDays: number | undefined,
    userId: string,
    securityContext: NetworkSecurityContext
  ): Promise<{
    success: boolean;
    message: string;
    envelopeId: string;
    viewerEmail: string;
    viewerName: string;
    token: string;
    expiresAt: Date;
    expiresInDays: number;
  }> {
    return await this.deps.useCases.shareDocumentViewUseCase.execute({
      envelopeId,
      email,
      fullName,
      message,
      expiresInDays,
      userId,
      securityContext,
    });
  }

  /**
   * Signs a document for a signer, persists consent, stores/reads document content,
   * performs KMS signing, updates the signer and envelope, and writes audit events.
   *
   * @param request - Signing request containing envelopeId, signerId, consent, and document source.
   * @param userId - Owner or acting user id (when applicable).
   * @param securityContext - Client network context for auditing.
   * @returns Signing result DTO with envelope progress and signature metadata.
   * @throws Propagates cryptography/persistence/errors from the use case.
   */
  async signDocument(
    request: SignDocumentRequest,
    userId: string,
    securityContext: NetworkSecurityContext
  ): Promise<SignDocumentResult> {
    return await this.deps.useCases.signDocumentUseCase.execute({
      request,
      userId,
      securityContext,
    });
  }
}
