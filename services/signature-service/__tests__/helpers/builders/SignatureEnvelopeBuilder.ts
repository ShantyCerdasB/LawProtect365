import { SignatureEnvelope } from '../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../../../src/domain/value-objects/EnvelopeStatus';
import { SigningOrder } from '../../../src/domain/value-objects/SigningOrder';
import { DocumentOrigin } from '../../../src/domain/value-objects/DocumentOrigin';
import { EnvelopeSigner } from '../../../src/domain/entities/EnvelopeSigner';
import { S3Key } from '@lawprotect/shared-ts';
import { DocumentHash } from '@lawprotect/shared-ts';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../testUtils';

export class SignatureEnvelopeBuilder {
  private id: EnvelopeId;
  private createdBy: string;
  private title: string = 'Test Envelope';
  private description: string | undefined = undefined;
  private status: EnvelopeStatus;
  private signers: EnvelopeSigner[] = [];
  private signingOrder: SigningOrder;
  private origin: DocumentOrigin;
  private sourceKey: S3Key | undefined = undefined;
  private metaKey: S3Key | undefined = undefined;
  private flattenedKey: S3Key | undefined = undefined;
  private signedKey: S3Key | undefined = undefined;
  private sourceSha256: DocumentHash | undefined = undefined;
  private flattenedSha256: DocumentHash | undefined = undefined;
  private signedSha256: DocumentHash | undefined = undefined;
  private sentAt: Date | undefined = undefined;
  private completedAt: Date | undefined = undefined;
  private cancelledAt: Date | undefined = undefined;
  private declinedAt: Date | undefined = undefined;
  private declinedBySignerId: SignerId | undefined = undefined;
  private declinedReason: string | undefined = undefined;
  private expiresAt: Date | undefined = undefined;
  private createdAt: Date = new Date();
  private updatedAt: Date = new Date();

  private constructor() {
    this.id = TestUtils.generateEnvelopeId();
    this.createdBy = TestUtils.generateUuid();
    this.status = EnvelopeStatus.draft();
    this.signingOrder = SigningOrder.ownerFirst();
    this.origin = DocumentOrigin.userUpload();
  }

  static create(): SignatureEnvelopeBuilder {
    return new SignatureEnvelopeBuilder();
  }

  withId(id: EnvelopeId): SignatureEnvelopeBuilder {
    this.id = id;
    return this;
  }

  withCreatedBy(createdBy: string): SignatureEnvelopeBuilder {
    this.createdBy = createdBy;
    return this;
  }

  withStatus(status: EnvelopeStatus): SignatureEnvelopeBuilder {
    this.status = status;
    return this;
  }

  withSentAt(sentAt: Date | undefined): SignatureEnvelopeBuilder {
    this.sentAt = sentAt;
    return this;
  }

  withSigningOrder(signingOrder: SigningOrder): SignatureEnvelopeBuilder {
    this.signingOrder = signingOrder;
    return this;
  }

  withTitle(title: string): SignatureEnvelopeBuilder {
    this.title = title;
    return this;
  }

  withDescription(description: string | undefined): SignatureEnvelopeBuilder {
    this.description = description;
    return this;
  }

  withSigners(signers: EnvelopeSigner[]): SignatureEnvelopeBuilder {
    this.signers = signers;
    return this;
  }

  build(): SignatureEnvelope {
    return new SignatureEnvelope(
      this.id,
      this.createdBy,
      this.title,
      this.description,
      this.status,
      this.signers,
      this.signingOrder,
      this.origin,
      this.sourceKey,
      this.metaKey,
      this.flattenedKey,
      this.signedKey,
      this.sourceSha256,
      this.flattenedSha256,
      this.signedSha256,
      this.sentAt,
      this.completedAt,
      this.cancelledAt,
      this.declinedAt,
      this.declinedBySignerId,
      this.declinedReason,
      this.expiresAt,
      this.createdAt,
      this.updatedAt
    );
  }
}
