/**
 * @fileoverview EnvelopeDownloadService - Document download operations for signature envelopes
 * @summary Service for handling document download operations
 * @description This service encapsulates document download logic including URL generation,
 * expiration validation, and S3 operations for signature envelopes.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { S3Service } from '@/services/S3Service';
import { S3Key, S3Operation } from '@lawprotect/shared-ts';
import { loadConfig } from '@/config/AppConfig';
import { 
  envelopeNotFound,
  envelopeExpirationInvalid
} from '@/signature-errors';

/**
 * Service for managing document download operations
 * Handles URL generation, expiration validation, and S3 operations for signature envelopes
 */
export class EnvelopeDownloadService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Downloads a document from an envelope
   * @param envelopeId - The envelope ID
   * @param expiresIn - Expiration time in seconds
   * @returns Download URL and expiration time
   */
  async downloadDocument(
    envelopeId: EnvelopeId,
    expiresIn?: number
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    try {
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      const documentKey = this.getDocumentKeyForDownload(envelope, envelopeId);
      const finalExpiresIn = this.validateAndGetExpirationTime(expiresIn);
      const downloadUrl = await this.generateDownloadUrl(envelopeId, documentKey, finalExpiresIn);

      return {
        downloadUrl,
        expiresIn: finalExpiresIn
      };
    } catch (error) {
      this.handleDownloadError(error, envelopeId);
    }
  }

  /**
   * Gets the document key for download
   * @param envelope - The envelope entity
   * @param envelopeId - The envelope ID
   * @returns Document key
   */
  private getDocumentKeyForDownload(envelope: SignatureEnvelope, envelopeId: EnvelopeId): S3Key {
    const documentKey = envelope.getLatestSignedDocumentKey();
    if (!documentKey) {
      throw envelopeNotFound(`No document available for download in envelope ${envelopeId.getValue()}`);
    }
    return documentKey;
  }

  /**
   * Validates and gets the expiration time for download URL
   * @param expiresIn - Requested expiration time
   * @returns Validated expiration time
   */
  private validateAndGetExpirationTime(expiresIn?: number): number {
    const config = loadConfig();
    const finalExpiresIn = expiresIn || config.documentDownload.defaultExpirationSeconds;
    
    if (finalExpiresIn < config.documentDownload.minExpirationSeconds || 
        finalExpiresIn > config.documentDownload.maxExpirationSeconds) {
      throw envelopeExpirationInvalid(
        `Document download expiration time must be between ${config.documentDownload.minExpirationSeconds} and ${config.documentDownload.maxExpirationSeconds} seconds, got ${finalExpiresIn}`
      );
    }
    
    return finalExpiresIn;
  }

  /**
   * Generates the download URL
   * @param envelopeId - The envelope ID
   * @param documentKey - The document key
   * @param expiresIn - Expiration time
   * @returns Download URL
   */
  private async generateDownloadUrl(
    envelopeId: EnvelopeId,
    documentKey: S3Key,
    expiresIn: number
  ): Promise<string> {
    return await this.s3Service.generatePresignedUrl({
      envelopeId,
      signerId: SignerId.fromString('system'), // Default signer for download
      documentKey,
      operation: S3Operation.get(),
      expiresIn
    });
  }

  /**
   * Handles download errors
   * @param error - The error to handle
   * @param envelopeId - The envelope ID
   */
  private handleDownloadError(error: unknown, envelopeId: EnvelopeId): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as any).code;
      if (this.isBusinessValidationError(errorCode)) {
        throw error;
      }
    }
    
    throw envelopeNotFound(
      `Failed to download document for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
    );
  }

  /**
   * Checks if error is a business validation error
   * @param errorCode - The error code
   * @returns True if business validation error
   */
  private isBusinessValidationError(errorCode: string): boolean {
    const businessErrorCodes = [
      'ENVELOPE_ACCESS_DENIED',
      'INVITATION_TOKEN_INVALID',
      'INVITATION_TOKEN_EXPIRED',
      'INVITATION_TOKEN_ALREADY_USED',
      'INVITATION_TOKEN_REVOKED'
    ];
    return businessErrorCodes.includes(errorCode);
  }
}

