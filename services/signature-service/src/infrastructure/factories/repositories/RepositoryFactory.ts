/**
 * @fileoverview RepositoryFactory - Factory for data access layer components
 * @summary Creates Prisma-backed repositories with proper database configuration
 * @description Centralizes repository creation and database connection management.
 * This factory follows the Single Responsibility Principle by focusing solely on
 * repository instantiation and database client configuration.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma, getPrismaAsync } from '@lawprotect/shared-ts';

import { SignatureEnvelopeRepository } from '../../../repositories/SignatureEnvelopeRepository';
import { EnvelopeSignerRepository } from '../../../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../../../repositories/InvitationTokenRepository';
import { SignatureAuditEventRepository } from '../../../repositories/SignatureAuditEventRepository';
import { ConsentRepository } from '../../../repositories/ConsentRepository';
import { SignerReminderTrackingRepository } from '../../../repositories/SignerReminderTrackingRepository';


/**
 * Factory responsible for creating all repository instances with proper database configuration.
 *
 * Design notes:
 * - Avoids reading `DATABASE_URL` at module import time (cold start).
 * - Creates the Prisma client lazily on first use (sync or async variants).
 * - The async path resolves the DB URL from Secrets Manager via shared-ts if needed.
 */
export class RepositoryFactory {
  /** Singleton Prisma client instance (lazy) */
  private static prismaClient: PrismaClient | undefined;

  /**
   * Lazily creates or returns the Prisma client (sync).
   * Note: Will throw if DATABASE_URL is not yet available.
   */
  private static getPrismaClientInternal(): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = getPrisma();
    }
    return this.prismaClient!;
  }

  /**
   * Lazily creates or returns the Prisma client (async).
   * Resolves DATABASE_URL from Secrets Manager if needed.
   */
  static async getPrismaClientAsync(): Promise<PrismaClient> {
    if (!this.prismaClient) {
      this.prismaClient = await getPrismaAsync();
    }
    return this.prismaClient!;
  }

  /**
   * Returns the shared Prisma client instance
   * @returns Configured PrismaClient instance
   */
  static getPrismaClient(): PrismaClient { return this.getPrismaClientInternal(); }

  /**
   * Creates SignatureEnvelopeRepository with Prisma client
   * @returns Configured SignatureEnvelopeRepository instance
   */
  static createSignatureEnvelopeRepository(): SignatureEnvelopeRepository {
    return new SignatureEnvelopeRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates EnvelopeSignerRepository with Prisma client
   * @returns Configured EnvelopeSignerRepository instance
   */
  static createEnvelopeSignerRepository(): EnvelopeSignerRepository {
    return new EnvelopeSignerRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates InvitationTokenRepository with Prisma client
   * @returns Configured InvitationTokenRepository instance
   */
  static createInvitationTokenRepository(): InvitationTokenRepository {
    return new InvitationTokenRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates SignatureAuditEventRepository with Prisma client
   * @returns Configured SignatureAuditEventRepository instance
   */
  static createSignatureAuditEventRepository(): SignatureAuditEventRepository {
    return new SignatureAuditEventRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates ConsentRepository with Prisma client
   * @returns Configured ConsentRepository instance
   */
  static createConsentRepository(): ConsentRepository {
    return new ConsentRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates SignerReminderTrackingRepository with Prisma client
   * @returns Configured SignerReminderTrackingRepository instance
   */
  static createSignerReminderTrackingRepository(): SignerReminderTrackingRepository {
    return new SignerReminderTrackingRepository(this.getPrismaClientInternal());
  }

  /**
   * Creates all repositories in a single operation (synchronous).
   * Use when you're certain `DATABASE_URL` is already set.
   * @returns Object containing all repository instances
   */
  static createAll() {
    return {
      signatureEnvelopeRepository: this.createSignatureEnvelopeRepository(),
      envelopeSignerRepository: this.createEnvelopeSignerRepository(),
      invitationTokenRepository: this.createInvitationTokenRepository(),
      signatureAuditEventRepository: this.createSignatureAuditEventRepository(),
      consentRepository: this.createConsentRepository(),
      signerReminderTrackingRepository: this.createSignerReminderTrackingRepository(),
    };
  }

  /**
   * Creates all repositories ensuring `DATABASE_URL` is resolved first.
   * Prefer this path inside Lambda handlers to avoid import-time failures.
   */
  static async createAllAsync() {
    const prisma = await this.getPrismaClientAsync();
    return {
      signatureEnvelopeRepository: new SignatureEnvelopeRepository(prisma),
      envelopeSignerRepository: new EnvelopeSignerRepository(prisma),
      invitationTokenRepository: new InvitationTokenRepository(prisma),
      signatureAuditEventRepository: new SignatureAuditEventRepository(prisma),
      consentRepository: new ConsentRepository(prisma),
      signerReminderTrackingRepository: new SignerReminderTrackingRepository(prisma),
    };
  }
}
