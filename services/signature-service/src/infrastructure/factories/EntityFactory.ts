/**
 * @fileoverview EntityFactory - Abstract factory for creating domain entities and value objects
 * @summary Centralized factory for creating all domain entities with proper validation
 * @description This factory encapsulates the creation logic for all domain entities and value objects,
 * ensuring consistent creation patterns, proper validation, and type safety across the application.
 * It follows the Abstract Factory pattern to create different types of entities based on input data.
 */

import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { SignerId } from '../../domain/value-objects/SignerId';
import { InvitationTokenId } from '../../domain/value-objects/InvitationTokenId';
import { ConsentId } from '../../domain/value-objects/ConsentId';
import { DocumentOrigin } from '../../domain/value-objects/DocumentOrigin';
import { SigningOrder } from '../../domain/value-objects/SigningOrder';
import { EnvelopeStatus } from '../../domain/value-objects/EnvelopeStatus';
import { Email, S3Key, DocumentHash } from '@lawprotect/shared-ts';

import { SignatureEnvelope } from '../../domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../domain/entities/EnvelopeSigner';
import { InvitationToken } from '../../domain/entities/InvitationToken';
import { Consent } from '../../domain/entities/Consent';

import { CreateEnvelopeData } from '../../domain/types/envelope/CreateEnvelopeData';
import { CreateSignerData } from '../../domain/types/signer/CreateSignerData';
import { CreateConsentRequest } from '../../domain/types/consent/CreateConsentRequest';

import { InvitationTokenStatus, SignerStatus } from '@prisma/client';

/**
 * Abstract factory for creating domain entities and value objects
 * 
 * This factory provides a centralized way to create all domain entities,
 * ensuring consistent creation patterns and proper validation.
 * It can create different types of entities based on the input data provided.
 */
export abstract class EntityFactory {
  
  /**
   * Creates a domain entity based on the entity type and data provided
   * @param entityType - The type of entity to create
   * @param data - The data for creating the entity
   * @returns The created entity instance
   * @throws Error when entity type is not supported or data is invalid
   */
  static create<T>(entityType: string, data: unknown): T {
    switch (entityType) {
      case 'SignatureEnvelope':
        return this.createSignatureEnvelope(data as CreateEnvelopeData) as T;
      case 'EnvelopeSigner':
        return this.createEnvelopeSigner(data as CreateSignerData) as T;
      case 'InvitationToken':
        return this.createInvitationToken(data as any) as T;
      case 'Consent':
        return this.createConsent(data as CreateConsentRequest) as T;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Creates a new SignatureEnvelope entity
   * @param data - The envelope creation data
   * @returns New SignatureEnvelope instance
   */
  static createSignatureEnvelope(data: CreateEnvelopeData): SignatureEnvelope {
    return new SignatureEnvelope(
      data.id,
      data.createdBy,
      data.title,
      data.description,
      EnvelopeStatus.draft(), // Initial status
      [], // signers will be added separately
      data.signingOrder,
      data.origin,
      data.sourceKey ? new S3Key(data.sourceKey) : undefined, // sourceKey from Document Service
      data.metaKey ? new S3Key(data.metaKey) : undefined, // metaKey from Document Service
      undefined, // flattenedKey
      undefined, // signedKey
      undefined, // sourceSha256
      undefined, // flattenedSha256
      undefined, // signedSha256
      undefined, // sentAt
      undefined, // completedAt
      undefined, // cancelledAt
      undefined, // declinedAt
      undefined, // declinedBySignerId
      undefined, // declinedReason
      data.expiresAt,
      new Date(), // createdAt
      new Date()  // updatedAt
    );
  }

  /**
   * Creates a new EnvelopeSigner entity
   * @param data - The signer creation data
   * @returns New EnvelopeSigner instance
   */
  static createEnvelopeSigner(data: CreateSignerData): EnvelopeSigner {
    // ✅ Solo validar external signers
    if (data.isExternal && !data.fullName) {
      throw new Error('External signers must have fullName');
    }
    if (data.isExternal && !data.email) {
      throw new Error('External signers must have email');
    }
    
    // ✅ External users NO tienen userId (null), Internal users SÍ tienen userId
    const userId = data.isExternal 
      ? null  // ✅ null explícito para external users
      : (data.userId || null);  // Internal users deben tener userId
    
    return new EnvelopeSigner(
      SignerId.generate(),
      data.envelopeId,
      userId, // ✅ null para external users, userId real para internal users
      data.isExternal,
      data.email ? Email.fromString(data.email) : undefined,
      data.fullName,
      data.invitedByUserId,
      data.participantRole,
      data.order || 1, // Default order if not provided
      SignerStatus.PENDING,
      undefined, // signedAt
      undefined, // declinedAt
      undefined, // declineReason
      undefined, // consentGiven
      undefined, // consentTimestamp
      undefined, // documentHash
      undefined, // signatureHash
      undefined, // signedS3Key
      undefined, // kmsKeyId
      undefined, // algorithm
      undefined, // ipAddress
      undefined, // userAgent
      undefined, // reason
      undefined, // location
      new Date(), // createdAt
      new Date()  // updatedAt
    );
  }

  /**
   * Creates a new InvitationToken entity
   * @param data - The invitation token creation data
   * @returns New InvitationToken instance
   */
  static createInvitationToken(data: {
    id: InvitationTokenId;
    envelopeId: EnvelopeId;
    signerId: SignerId;
    tokenHash: string;
    expiresAt: Date;
    createdBy: string;
    invitedByUserId: string;
  }): InvitationToken {
    return new InvitationToken(
      data.id,
      data.envelopeId,
      data.signerId,
      data.tokenHash,
      InvitationTokenStatus.ACTIVE, // status
      data.expiresAt,
      undefined, // sentAt
      undefined, // lastSentAt
      0, // resendCount
      undefined, // usedAt
      undefined, // usedBy
      0, // viewCount
      undefined, // lastViewedAt
      undefined, // signedAt
      undefined, // signedBy
      undefined, // revokedAt
      undefined, // revokedReason
      data.createdBy,
      undefined, // ipAddress
      undefined, // userAgent
      undefined, // country
      new Date(), // createdAt
      new Date()  // updatedAt
    );
  }

  /**
   * Creates a new Consent entity
   * @param data - The consent creation data
   * @returns New Consent instance
   */
  static createConsent(data: CreateConsentRequest): Consent {
    return Consent.create({
      id: data.id,
      envelopeId: data.envelopeId,
      signerId: data.signerId,
      signatureId: data.signatureId,
      consentGiven: data.consentGiven,
      consentTimestamp: data.consentTimestamp,
      consentText: data.consentText,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      country: data.country
    });
  }

  /**
   * Factory methods for creating value objects from primitive types
   */
  static readonly createValueObjects = {
    /**
     * Creates EnvelopeId from string
     * @param value - The string value to convert
     * @returns EnvelopeId instance
     */
    envelopeId: (value: string): EnvelopeId => EnvelopeId.fromString(value),
    
    /**
     * Creates SignerId from string or generates new one
     * @param value - Optional string value to convert
     * @returns SignerId instance
     */
    signerId: (value?: string): SignerId => value ? SignerId.fromString(value) : SignerId.generate(),
    
    /**
     * Creates InvitationTokenId from string or generates new one
     * @param value - Optional string value to convert
     * @returns InvitationTokenId instance
     */
    invitationTokenId: (value?: string): InvitationTokenId => 
      value ? InvitationTokenId.fromString(value) : InvitationTokenId.generate(),
    
    /**
     * Creates ConsentId from string or generates new one
     * @param value - Optional string value to convert
     * @returns ConsentId instance
     */
    consentId: (value?: string): ConsentId => 
      value ? ConsentId.fromString(value) : ConsentId.generate(),
    
    /**
     * Creates Email from string
     * @param value - The string value to convert
     * @returns Email instance
     */
    email: (value: string): Email => Email.fromString(value),
    
    /**
     * Creates S3Key from string
     * @param value - The string value to convert
     * @returns S3Key instance
     */
    s3Key: (value: string): S3Key => S3Key.fromString(value),
    
    /**
     * Creates DocumentHash from string
     * @param value - The string value to convert
     * @returns DocumentHash instance
     */
    documentHash: (value: string): DocumentHash => DocumentHash.fromString(value),
    
    /**
     * Creates DocumentOrigin from type and metadata
     * @param type - The origin type
     * @param metadata - Optional metadata
     * @returns DocumentOrigin instance
     */
    documentOrigin: (type: string, metadata?: Record<string, unknown>): DocumentOrigin => 
      DocumentOrigin.fromString(type, metadata?.templateId as string, metadata?.templateVersion as string),
    
    /**
     * Creates SigningOrder from type
     * @param type - The signing order type
     * @returns SigningOrder instance
     */
    signingOrder: (type: string): SigningOrder => SigningOrder.fromString(type)
  };

}
