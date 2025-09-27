/**
 * @fileoverview SignatureAuditEvent entity - Represents an audit event for signature operations
 * @summary Manages audit events for envelope and signer actions
 * @description The SignatureAuditEvent entity encapsulates all audit information for signature
 * operations including envelope actions, signer activities, and system events for compliance.
 */

import { EnvelopeId } from '../value-objects/EnvelopeId';
import { SignerId } from '../value-objects/SignerId';
import { SignatureAuditEventId } from '../value-objects/SignatureAuditEventId';
import { AuditEventType } from '../enums/AuditEventType';
import { toDate, toStringOrUndefined, NetworkSecurityContext } from '@lawprotect/shared-ts';
import { auditEventCreationFailed } from '../../signature-errors';

/**
 * Type for audit event metadata
 */
export type AuditMetadata = Record<string, unknown>;

/**
 * Helper function to determine if an event type requires a signer ID
 * @param eventType - The audit event type to check
 * @returns true if the event type is signer-specific
 */
function isSignerEventType(eventType: AuditEventType): boolean {
  const SIGNER_EVENTS = new Set<AuditEventType>([
    AuditEventType.SIGNER_ADDED,
    AuditEventType.SIGNER_REMOVED,
    AuditEventType.SIGNER_INVITED,
    AuditEventType.SIGNER_REMINDER_SENT,
    AuditEventType.SIGNER_DECLINED,
    AuditEventType.SIGNER_SIGNED,
    AuditEventType.DOCUMENT_ACCESSED,
    AuditEventType.DOCUMENT_DOWNLOADED,
    AuditEventType.SIGNATURE_CREATED,
    AuditEventType.CONSENT_GIVEN,
    AuditEventType.INVITATION_ISSUED,
    AuditEventType.INVITATION_TOKEN_USED
  ]);
  return SIGNER_EVENTS.has(eventType);
}

/**
 * SignatureAuditEvent entity representing an audit event for signature operations
 * 
 * An audit event captures all actions performed on envelopes and signers for compliance,
 * security, and legal purposes. This includes access, downloads, signatures, and status changes.
 */
export class SignatureAuditEvent {
  constructor(
    private readonly id: SignatureAuditEventId,
    private readonly envelopeId: EnvelopeId,
    private readonly signerId: SignerId | undefined,
    private readonly eventType: AuditEventType,
    private readonly description: string,
    private readonly userId: string | undefined,
    private readonly userEmail: string | undefined,
    private readonly networkContext: NetworkSecurityContext | undefined,
    private readonly metadata: AuditMetadata | undefined,
    private readonly createdAt: Date
  ) {}

  /**
   * Gets the audit event unique identifier
   */
  getId(): SignatureAuditEventId {
    return this.id;
  }

  /**
   * Gets the envelope ID this event relates to
   */
  getEnvelopeId(): EnvelopeId {
    return this.envelopeId;
  }

  /**
   * Gets the signer ID this event relates to (if applicable)
   */
  getSignerId(): SignerId | undefined {
    return this.signerId;
  }

  /**
   * Gets the event type
   */
  getEventType(): AuditEventType {
    return this.eventType;
  }

  /**
   * Gets the event description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the user ID who performed the action
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Gets the user email who performed the action
   */
  getUserEmail(): string | undefined {
    return this.userEmail;
  }

  /**
   * Gets the network security context of the actor
   */
  getNetworkContext(): NetworkSecurityContext | undefined {
    return this.networkContext;
  }

  /**
   * Gets the IP address of the actor
   */
  getIpAddress(): string | undefined {
    return this.networkContext?.ipAddress;
  }

  /**
   * Gets the user agent of the actor
   */
  getUserAgent(): string | undefined {
    return this.networkContext?.userAgent;
  }

  /**
   * Gets the country of the actor
   */
  getCountry(): string | undefined {
    return this.networkContext?.country;
  }

  /**
   * Gets the event metadata
   */
  getMetadata(): AuditMetadata | undefined {
    return this.metadata;
  }

  /**
   * Gets the event creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Checks if this event relates to a specific signer
   */
  isSignerEvent(): boolean {
    return this.signerId !== undefined;
  }

  /**
   * Checks if this event relates to envelope-level actions
   */
  isEnvelopeEvent(): boolean {
    return this.signerId === undefined;
  }

  /**
   * Gets the event age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Checks if the event is recent (within specified time)
   */
  isRecent(maxAgeMs: number): boolean {
    return this.getAge() <= maxAgeMs;
  }

  /**
   * Gets a summary of the audit event for reporting
   */
  getSummary(): {
    id: string;
    envelopeId: string;
    signerId?: string;
    eventType: AuditEventType;
    description: string;
    userId?: string;
    userEmail?: string;
    createdAt: Date;
    metadata?: AuditMetadata;
    networkContext?: NetworkSecurityContext;
  } {
    return {
      id: this.id.getValue(),
      envelopeId: this.envelopeId.getValue(),
      signerId: this.signerId?.getValue(),
      eventType: this.eventType,
      description: this.description,
      userId: this.userId,
      userEmail: this.userEmail,
      createdAt: this.createdAt,
      metadata: this.metadata,
      networkContext: this.networkContext,
    };
  }

  /**
   * Converts the audit event to JSON format for API contracts
   * @returns Plain object with primitives for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      envelopeId: this.envelopeId.getValue(),
      signerId: this.signerId?.getValue(),
      eventType: this.eventType,
      description: this.description,
      userId: this.userId,
      userEmail: this.userEmail,
      ipAddress: this.networkContext?.ipAddress,
      userAgent: this.networkContext?.userAgent,
      country: this.networkContext?.country,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * Checks if this audit event equals another audit event
   * @param other - Other audit event to compare
   * @returns true if audit events are equal
   */
  equals(other: SignatureAuditEvent): boolean {
    return this.id.equals(other.id);
  }

  /**
   * Creates a new signature audit event instance with domain invariants enforcement
   * @param params - Audit event creation parameters with Value Objects
   * @returns New signature audit event instance
   * @throws Error when domain invariants are violated
   */
  static create(params: {
    envelopeId: EnvelopeId;
    signerId?: SignerId;
    eventType: AuditEventType;
    description: string;
    userId?: string;
    userEmail?: string;
    networkContext?: NetworkSecurityContext;
    metadata?: AuditMetadata;
  }): SignatureAuditEvent {
    // Enforce domain invariants
    if (!params.envelopeId) {
      throw auditEventCreationFailed('EnvelopeId is required');
    }

    if (!params.eventType) {
      throw auditEventCreationFailed('EventType is required');
    }

    // Validate and normalize description
    const description = (params.description ?? '').trim();
    if (!description) {
      throw auditEventCreationFailed('Description cannot be empty');
    }

    // Enforce signer ID requirement for signer-specific events
    if (isSignerEventType(params.eventType) && !params.signerId) {
      throw auditEventCreationFailed(`SignerId is required for event type: ${params.eventType}`);
    }

    // Normalize network context - convert empty strings to undefined
    const networkContext = params.networkContext ? {
      ipAddress: params.networkContext.ipAddress?.trim() || undefined,
      userAgent: params.networkContext.userAgent?.trim() || undefined,
      country: params.networkContext.country?.trim() || undefined
    } : undefined;

    // Normalize and freeze metadata
    const metadata = params.metadata ? Object.freeze({ ...params.metadata }) : undefined;

    const now = new Date();
    return new SignatureAuditEvent(
      SignatureAuditEventId.generate(),
      params.envelopeId,
      params.signerId,
      params.eventType,
      description,
      params.userId,
      params.userEmail,
      networkContext,
      metadata,
      now
    );
  }

  /**
   * Creates a new signature audit event instance from primitive values
   * @param params - Audit event creation parameters with primitive strings
   * @returns New signature audit event instance
   * @throws Error when domain invariants are violated or conversion fails
   */
  static createFromPrimitives(params: {
    envelopeId: string;
    signerId?: string;
    eventType: AuditEventType;
    description: string;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    metadata?: AuditMetadata;
  }): SignatureAuditEvent {
    try {
      // Convert primitive strings to Value Objects
      const envelopeId = EnvelopeId.fromString(params.envelopeId);
      const signerId = params.signerId ? SignerId.fromString(params.signerId) : undefined;

      // Create network context from individual fields
      const networkContext: NetworkSecurityContext | undefined = 
        (params.ipAddress || params.userAgent || params.country) ? {
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          country: params.country
        } : undefined;

      // Delegate to the main create method with VOs
      return this.create({
        envelopeId,
        signerId,
        eventType: params.eventType,
        description: params.description,
        userId: params.userId,
        userEmail: params.userEmail,
        networkContext,
        metadata: params.metadata
      });
    } catch (error) {
      throw auditEventCreationFailed(
        `Failed to create audit event from primitives: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Creates a SignatureAuditEvent from persistence data
   * @param data - Prisma SignatureAuditEvent data
   * @returns SignatureAuditEvent instance
   */
  static fromPersistence(data: {
    id: string;
    envelopeId: string;
    signerId?: string | null;
    eventType: string;
    description: string;
    userId?: string | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    country?: string | null;
    metadata?: AuditMetadata | null;
    createdAt: Date | string;
  }): SignatureAuditEvent {
    // Create network context from individual fields
    const networkContext: NetworkSecurityContext | undefined = 
      (data.ipAddress || data.userAgent || data.country) ? {
        ipAddress: toStringOrUndefined(data.ipAddress),
        userAgent: toStringOrUndefined(data.userAgent),
        country: toStringOrUndefined(data.country)
      } : undefined;

    return new SignatureAuditEvent(
      SignatureAuditEventId.fromString(String(data.id)),
      EnvelopeId.fromString(String(data.envelopeId)),
      data.signerId ? SignerId.fromString(String(data.signerId)) : undefined,
      data.eventType as AuditEventType,
      (data.description ?? '').toString(),
      toStringOrUndefined(data.userId),
      toStringOrUndefined(data.userEmail),
      networkContext,
      (data.metadata ?? undefined) as AuditMetadata | undefined,
      toDate(data.createdAt)
    );
  }
}
