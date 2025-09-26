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

/**
 * Type for audit event metadata
 */
export type AuditMetadata = Record<string, unknown>;

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
    private readonly ipAddress: string | undefined,
    private readonly userAgent: string | undefined,
    private readonly country: string | undefined,
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
   * Gets the IP address of the actor
   */
  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  /**
   * Gets the user agent of the actor
   */
  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  /**
   * Gets the country of the actor
   */
  getCountry(): string | undefined {
    return this.country;
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
  } & NetworkSecurityContext {
    return {
      id: this.id.getValue(),
      envelopeId: this.envelopeId.getValue(),
      signerId: this.signerId?.getValue(),
      eventType: this.eventType,
      description: this.description,
      userId: this.userId,
      userEmail: this.userEmail,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      country: this.country,
      createdAt: this.createdAt,
      metadata: this.metadata,
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
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      country: this.country,
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
   * Creates a new signature audit event instance
   * @param params - Audit event creation parameters
   * @returns New signature audit event instance
   */
  static create(params: {
    envelopeId: EnvelopeId;
    signerId?: SignerId;
    eventType: AuditEventType;
    description: string;
    userId?: string;
    userEmail?: string;
    metadata?: AuditMetadata;
  } & NetworkSecurityContext): SignatureAuditEvent {
    const now = new Date();
    const description = (params.description ?? '').trim();
    return new SignatureAuditEvent(
      SignatureAuditEventId.generate(),
      params.envelopeId,
      params.signerId,
      params.eventType,
      description,
      params.userId,
      params.userEmail,
      params.ipAddress,
      params.userAgent,
      params.country,
      params.metadata,
      now
    );
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
    return new SignatureAuditEvent(
      SignatureAuditEventId.fromString(String(data.id)),
      EnvelopeId.fromString(String(data.envelopeId)),
      data.signerId ? SignerId.fromString(String(data.signerId)) : undefined,
      data.eventType as AuditEventType,
      (data.description ?? '').toString(),
      toStringOrUndefined(data.userId),
      toStringOrUndefined(data.userEmail),
      toStringOrUndefined(data.ipAddress),
      toStringOrUndefined(data.userAgent),
      toStringOrUndefined(data.country),
      (data.metadata ?? undefined) as AuditMetadata | undefined,
      toDate(data.createdAt)
    );
  }
}
