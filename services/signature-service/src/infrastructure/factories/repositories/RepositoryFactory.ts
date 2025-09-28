/**
 * @fileoverview RepositoryFactory - Factory for data access layer components
 * @summary Creates Prisma-backed repositories with proper database configuration
 * @description Centralizes repository creation and database connection management.
 * This factory follows the Single Responsibility Principle by focusing solely on
 * repository instantiation and database client configuration.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '@lawprotect/shared-ts';

import { SignatureEnvelopeRepository } from '../../../repositories/SignatureEnvelopeRepository';
import { EnvelopeSignerRepository } from '../../../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../../../repositories/InvitationTokenRepository';
import { SignatureAuditEventRepository } from '../../../repositories/SignatureAuditEventRepository';
import { ConsentRepository } from '../../../repositories/ConsentRepository';
import { SignerReminderTrackingRepository } from '../../../repositories/SignerReminderTrackingRepository';

import { loadConfig } from '../../../config/AppConfig';

/**
 * Factory responsible for creating all repository instances with proper database configuration.
 * Follows the Single Responsibility Principle by focusing exclusively on repository creation.
 */
export class RepositoryFactory {
  private static readonly config = loadConfig();
  
  /** Singleton Prisma client instance */
  private static readonly prismaClient: PrismaClient = getPrisma({
    url: this.config.database.url,
  });

  /**
   * Returns the shared Prisma client instance
   * @returns Configured PrismaClient instance
   */
  static getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * Creates SignatureEnvelopeRepository with Prisma client
   * @returns Configured SignatureEnvelopeRepository instance
   */
  static createSignatureEnvelopeRepository(): SignatureEnvelopeRepository {
    return new SignatureEnvelopeRepository(this.prismaClient);
  }

  /**
   * Creates EnvelopeSignerRepository with Prisma client
   * @returns Configured EnvelopeSignerRepository instance
   */
  static createEnvelopeSignerRepository(): EnvelopeSignerRepository {
    return new EnvelopeSignerRepository(this.prismaClient);
  }

  /**
   * Creates InvitationTokenRepository with Prisma client
   * @returns Configured InvitationTokenRepository instance
   */
  static createInvitationTokenRepository(): InvitationTokenRepository {
    return new InvitationTokenRepository(this.prismaClient);
  }

  /**
   * Creates SignatureAuditEventRepository with Prisma client
   * @returns Configured SignatureAuditEventRepository instance
   */
  static createSignatureAuditEventRepository(): SignatureAuditEventRepository {
    return new SignatureAuditEventRepository(this.prismaClient);
  }

  /**
   * Creates ConsentRepository with Prisma client
   * @returns Configured ConsentRepository instance
   */
  static createConsentRepository(): ConsentRepository {
    return new ConsentRepository(this.prismaClient);
  }

  /**
   * Creates SignerReminderTrackingRepository with Prisma client
   * @returns Configured SignerReminderTrackingRepository instance
   */
  static createSignerReminderTrackingRepository(): SignerReminderTrackingRepository {
    return new SignerReminderTrackingRepository(this.prismaClient);
  }

  /**
   * Creates all repositories in a single operation
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
}
