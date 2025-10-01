import { InvitationToken } from '../../../src/domain/entities/InvitationToken';
import { InvitationTokenId } from '../../../src/domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../testUtils';

export class InvitationTokenBuilder {
  private id: InvitationTokenId;
  private envelopeId: EnvelopeId;
  private signerId: SignerId;
  private tokenHash: string = 'test-token-hash';
  private status: string = 'PENDING';
  private expiresAt: Date;
  private sentAt: Date | undefined = undefined;
  private lastSentAt: Date | undefined = undefined;
  private resendCount: number = 0;
  private usedAt: Date | undefined = undefined;
  private usedBy: string | undefined = undefined;
  private viewCount: number = 0;
  private lastViewedAt: Date | undefined = undefined;
  private signedAt: Date | undefined = undefined;
  private signedBy: string | undefined = undefined;
  private revokedAt: Date | undefined = undefined;
  private revokedReason: string | undefined = undefined;
  private createdBy: string;
  private ipAddress: string | undefined = undefined;
  private userAgent: string | undefined = undefined;
  private country: string | undefined = undefined;
  private createdAt: Date = new Date();
  private updatedAt: Date = new Date();

  private constructor() {
    this.id = TestUtils.generateInvitationTokenId();
    this.envelopeId = TestUtils.generateEnvelopeId();
    this.signerId = TestUtils.generateSignerId();
    this.createdBy = TestUtils.generateUuid();
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  static create(): InvitationTokenBuilder {
    return new InvitationTokenBuilder();
  }

  withId(id: InvitationTokenId): InvitationTokenBuilder {
    this.id = id;
    return this;
  }

  withEnvelopeId(envelopeId: EnvelopeId): InvitationTokenBuilder {
    this.envelopeId = envelopeId;
    return this;
  }

  withSignerId(signerId: SignerId): InvitationTokenBuilder {
    this.signerId = signerId;
    return this;
  }

  withCreatedBy(createdBy: string): InvitationTokenBuilder {
    this.createdBy = createdBy;
    return this;
  }

  withExpiresAt(expiresAt: Date): InvitationTokenBuilder {
    this.expiresAt = expiresAt;
    return this;
  }

  withUsedAt(usedAt: Date | null): InvitationTokenBuilder {
    this.usedAt = usedAt || undefined;
    return this;
  }

  withRevokedAt(revokedAt: Date | null): InvitationTokenBuilder {
    this.revokedAt = revokedAt || undefined;
    return this;
  }

  withRevokedReason(revokedReason: string | null): InvitationTokenBuilder {
    this.revokedReason = revokedReason || undefined;
    return this;
  }

  withStatus(status: string): InvitationTokenBuilder {
    this.status = status;
    return this;
  }

  build(): InvitationToken {
    return new InvitationToken(
      this.id,
      this.envelopeId,
      this.signerId,
      this.tokenHash,
      this.status as any,
      this.expiresAt,
      this.sentAt,
      this.lastSentAt,
      this.resendCount,
      this.usedAt,
      this.usedBy,
      this.viewCount,
      this.lastViewedAt,
      this.signedAt,
      this.signedBy,
      this.revokedAt,
      this.revokedReason,
      this.createdBy,
      this.ipAddress,
      this.userAgent,
      this.country,
      this.createdAt,
      this.updatedAt
    );
  }
}
