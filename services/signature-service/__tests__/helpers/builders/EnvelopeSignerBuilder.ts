import { EnvelopeSigner } from '../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { Email } from '@lawprotect/shared-ts';
import { TestUtils } from '../testUtils';
import { SignerStatus } from '@prisma/client';

export class EnvelopeSignerBuilder {
  private id: SignerId;
  private envelopeId: EnvelopeId;
  private userId: string | null = null;
  private email: Email | undefined = undefined;
  private fullName: string | undefined = undefined;
  private isExternal: boolean = false;
  private status: SignerStatus = SignerStatus.PENDING;
  private order: number = 1;
  private invitedByUserId: string | undefined = undefined;
  private participantRole: string = 'signer';
  private signedAt: Date | undefined = undefined;
  private declinedAt: Date | undefined = undefined;
  private declineReason: string | undefined = undefined;
  private consentGiven: boolean | undefined = undefined;
  private consentTimestamp: Date | undefined = undefined;
  private documentHash: string | undefined = undefined;
  private signatureHash: string | undefined = undefined;
  private signedS3Key: string | undefined = undefined;
  private kmsKeyId: string | undefined = undefined;
  private algorithm: string | undefined = undefined;
  private ipAddress: string | undefined = undefined;
  private userAgent: string | undefined = undefined;
  private reason: string | undefined = undefined;
  private location: string | undefined = undefined;
  private createdAt: Date = new Date();
  private updatedAt: Date = new Date();

  private constructor() {
    this.id = TestUtils.generateSignerId();
    this.envelopeId = TestUtils.generateEnvelopeId();
  }

  static create(): EnvelopeSignerBuilder {
    return new EnvelopeSignerBuilder();
  }

  withId(id: SignerId): EnvelopeSignerBuilder {
    this.id = id;
    return this;
  }

  withUserId(userId: string | null): EnvelopeSignerBuilder {
    this.userId = userId;
    return this;
  }

  withEnvelopeId(envelopeId: EnvelopeId): EnvelopeSignerBuilder {
    this.envelopeId = envelopeId;
    return this;
  }

  withEmail(email: string | undefined): EnvelopeSignerBuilder {
    this.email = email ? Email.fromString(email) : undefined;
    return this;
  }

  withFullName(fullName: string | undefined): EnvelopeSignerBuilder {
    this.fullName = fullName;
    return this;
  }

  withIsExternal(isExternal: boolean): EnvelopeSignerBuilder {
    this.isExternal = isExternal;
    return this;
  }

  withStatus(status: SignerStatus): EnvelopeSignerBuilder {
    this.status = status;
    return this;
  }

  withOrder(order: number): EnvelopeSignerBuilder {
    this.order = order;
    return this;
  }

  withInvitedByUserId(invitedByUserId: string | undefined): EnvelopeSignerBuilder {
    this.invitedByUserId = invitedByUserId;
    return this;
  }

  build(): EnvelopeSigner {
    return new EnvelopeSigner(
      this.id,
      this.envelopeId,
      this.userId,
      this.isExternal,
      this.email,
      this.fullName,
      this.invitedByUserId,
      this.participantRole,
      this.order,
      this.status,
      this.signedAt,
      this.declinedAt,
      this.declineReason,
      this.consentGiven,
      this.consentTimestamp,
      this.documentHash,
      this.signatureHash,
      this.signedS3Key,
      this.kmsKeyId,
      this.algorithm,
      this.ipAddress,
      this.userAgent,
      this.reason,
      this.location,
      this.createdAt,
      this.updatedAt
    );
  }
}
