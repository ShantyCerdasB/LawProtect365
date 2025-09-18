/**
 * @fileoverview S3Service - Service for document storage operations
 * @summary Manages S3 operations for document storage and retrieval
 * @description This service handles all S3 operations including
 * document storage, retrieval, and presigned URL generation.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { AuditService } from './AuditService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { StoreDocumentRequest } from '../domain/types/s3/StoreDocumentRequest';
import { RetrieveDocumentRequest } from '../domain/types/s3/RetrieveDocumentRequest';
import { GeneratePresignedUrlRequest } from '../domain/types/s3/GeneratePresignedUrlRequest';
import { DocumentResult } from '../domain/types/s3/DocumentResult';
import { mapAwsError, NotFoundError, BadRequestError, ErrorCodes, validateS3Key } from '@lawprotect/shared-ts';
import { validateStoreDocumentRequest, validateRetrieveDocumentRequest, validateGeneratePresignedUrlRequest } from '../domain/rules/s3/S3ValidationRules';
import type { SignatureServiceConfig } from '../config/AppConfig';


/**
 * S3Service
 * 
 * Service for managing document storage operations using AWS S3.
 * Handles document storage, retrieval, and presigned URL generation.
 */
export class S3Service {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucketName: string,
    private readonly auditService: AuditService,
    private readonly config: SignatureServiceConfig
  ) {}

  /**
   * Stores a document in S3
   */
  async storeDocument(request: StoreDocumentRequest): Promise<DocumentResult> {
    try {
      // Validate input using domain rules
      validateStoreDocumentRequest(request);

      // Generate document key
      const documentKey = this.generateDocumentKey(request.envelopeId, request.signerId);

      // Prepare S3 parameters
      const putObjectParams = {
        Bucket: this.bucketName,
        Key: documentKey,
        Body: request.documentContent,
        ContentType: request.contentType,
        Metadata: {
          envelopeId: request.envelopeId.getValue(),
          signerId: request.signerId.getValue(),
          ...(request.metadata?.originalFileName && { originalFileName: request.metadata.originalFileName }),
          ...(request.metadata?.checksum && { checksum: request.metadata.checksum })
        }
      };

      // Store document in S3
      await this.s3Client.send(new PutObjectCommand(putObjectParams));

      const documentResult: DocumentResult = {
        documentKey,
        s3Location: `s3://${this.bucketName}/${documentKey}`,
        contentType: request.contentType,
        size: request.metadata?.fileSize
      };

      // Log audit event
      await this.auditService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Document stored in S3 for signer ${request.signerId.getValue()}`,
        type: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey,
          contentType: request.contentType,
          size: request.metadata?.fileSize,
          originalFileName: request.metadata?.originalFileName
        }
      });


      return documentResult;
    } catch (error: unknown) {
      throw mapAwsError(error, 'S3Service.storeDocument');
    }
  }

  /**
   * Stores a signed PDF document in S3
   * This method is specifically for storing the final signed PDF after signature completion
   */
  async storeSignedDocument(request: {
    s3Key: string;
    signedPdfBuffer: Buffer;
    envelopeId: string;
    signerId: string;
    metadata?: {
      originalFileName?: string;
      fileSize?: number;
      signatureTimestamp?: Date;
      signerInfo?: string;
    };
  }): Promise<DocumentResult> {
    try {
      // Validate input
      if (!request.s3Key || !validateS3Key(request.s3Key)) {
        throw new BadRequestError('Valid S3 key is required', ErrorCodes.COMMON_BAD_REQUEST);
      }

      if (!request.signedPdfBuffer || request.signedPdfBuffer.length === 0) {
        throw new BadRequestError('Signed PDF buffer is required', ErrorCodes.COMMON_BAD_REQUEST);
      }

      // Store the signed PDF
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: request.s3Key,
        Body: request.signedPdfBuffer,
        ContentType: 'application/pdf',
        Metadata: {
          envelopeId: request.envelopeId,
          signerId: request.signerId,
          documentType: 'signed-pdf',
          originalFileName: request.metadata?.originalFileName || 'signed-document.pdf',
          fileSize: request.metadata?.fileSize?.toString() || request.signedPdfBuffer.length.toString(),
          signatureTimestamp: request.metadata?.signatureTimestamp?.toISOString() || new Date().toISOString(),
          signerInfo: request.metadata?.signerInfo || ''
        }
      });

      await this.s3Client.send(command);

      // Audit the signed document storage
      await this.auditService.createEvent({
        type: AuditEventType.SIGNATURE_VALIDATED,
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        userId: request.signerId,
        description: 'Signed PDF document stored successfully',
        metadata: {
          s3Key: request.s3Key,
          fileSize: request.signedPdfBuffer.length,
          contentType: 'application/pdf',
          originalFileName: request.metadata?.originalFileName,
          signatureTimestamp: request.metadata?.signatureTimestamp,
          documentType: 'signed-pdf'
        }
      });

      return {
        documentKey: request.s3Key,
        s3Location: `s3://${this.bucketName}/${request.s3Key}`,
        contentType: 'application/pdf',
        size: request.signedPdfBuffer.length,
        lastModified: new Date()
      };
    } catch (error: unknown) {
      throw mapAwsError(error, 'S3Service.storeSignedDocument');
    }
  }

  /**
   * Retrieves a document from S3
   */
  async retrieveDocument(request: RetrieveDocumentRequest): Promise<DocumentResult> {
    try {
      // Validate input using domain rules
      validateRetrieveDocumentRequest(request);

      // Get document metadata
      const headResult = await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: request.documentKey
      }));

      if (!headResult.ContentType) {
        throw new NotFoundError('Document not found or invalid', ErrorCodes.COMMON_NOT_FOUND);
      }

      const documentResult: DocumentResult = {
        documentKey: request.documentKey,
        s3Location: `s3://${this.bucketName}/${request.documentKey}`,
        contentType: headResult.ContentType,
        size: headResult.ContentLength,
        lastModified: headResult.LastModified
      };

      // Log audit event
      await this.auditService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Document retrieved from S3 for signer ${request.signerId.getValue()}`,
        type: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey: request.documentKey,
          contentType: headResult.ContentType,
          size: headResult.ContentLength
        }
      });

      return documentResult;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
        throw new NotFoundError('Document not found', ErrorCodes.COMMON_NOT_FOUND);
      }
      throw mapAwsError(error, 'S3Service.retrieveDocument');
    }
  }

  /**
   * Generates a presigned URL for document access
   */
  async generatePresignedUrl(request: GeneratePresignedUrlRequest): Promise<string> {
    try {
      // Validate input using domain rules
      validateGeneratePresignedUrlRequest(request, this.config);

      const expiresIn = request.expiresIn || 3600; // Default 1 hour

      let command;
      if (request.operation === 'get') {
        command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: request.documentKey
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: request.documentKey
        });
      }

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      // Log audit event
      await this.auditService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Presigned URL generated for ${request.operation} operation on document ${request.documentKey}`,
        type: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey: request.documentKey,
          operation: request.operation,
          expiresIn
        }
      });

      return presignedUrl;
    } catch (error: unknown) {
      throw mapAwsError(error, 'S3Service.generatePresignedUrl');
    }
  }

  /**
   * Checks if a document exists in S3
   */
  async documentExists(documentKey: string): Promise<boolean> {
    try {
      if (!documentKey || documentKey.trim().length === 0) {
        return false;
      }

      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: documentKey
      }));

      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && 
          (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
        return false;
      }
      throw mapAwsError(error, 'S3Service.documentExists');
    }
  }

  /**
   * Gets document metadata
   */
  async getDocumentMetadata(documentKey: string): Promise<DocumentResult | null> {
    try {
      if (!documentKey || documentKey.trim().length === 0) {
        return null;
      }

      const headResult = await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: documentKey
      }));

      return {
        documentKey,
        s3Location: `s3://${this.bucketName}/${documentKey}`,
        contentType: headResult.ContentType || 'application/octet-stream',
        size: headResult.ContentLength,
        lastModified: headResult.LastModified
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && 
          (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
        return null;
      }
      throw mapAwsError(error, 'S3Service.getDocumentMetadata');
    }
  }

  /**
   * Generates a presigned download URL for a document
   */
  async generatePresignedDownloadUrl(request: {
    s3Key: string;
    expiresIn: number;
    contentType?: string;
  }): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: request.s3Key
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: request.expiresIn
      });
    } catch (error) {
      throw mapAwsError(error, 'S3Service.generatePresignedDownloadUrl');
    }
  }

  /**
   * Gets document information including metadata
   */
  async getDocumentInfo(s3Key: string): Promise<{
    filename: string;
    contentType: string;
    size?: number;
  }> {
    try {
      const metadata = await this.getDocumentMetadata(s3Key);
      
      if (!metadata) {
        throw new NotFoundError('Document not found', 'DOCUMENT_NOT_FOUND');
      }

      return {
        filename: s3Key.split('/').pop() || 'document.pdf',
        contentType: 'application/pdf', // Default for signed documents
        size: metadata.size
      };
    } catch (error) {
      throw mapAwsError(error, 'S3Service.getDocumentInfo');
    }
  }

  /**
   * Records a document download action in the audit trail
   */
  async recordDownloadAction(request: {
    envelopeId: string;
    userId?: string;
    userEmail?: string;
    s3Key: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  }): Promise<void> {
    try {
      const info = await this.getDocumentInfo(request.s3Key);
      await this.auditService.createEvent({
        envelopeId: request.envelopeId,
        description: 'Signed document downloaded',
        type: AuditEventType.DOCUMENT_DOWNLOADED,
        userId: request.userId,
        userEmail: request.userEmail,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        country: request.country,
        metadata: {
          s3Key: request.s3Key,
          filename: info.filename,
          contentType: info.contentType,
          size: info.size
        }
      });
    } catch (error: unknown) {
      throw mapAwsError(error, 'S3Service.recordDownloadAction');
    }
  }

  /**
   * Generates a document key for S3 storage
   */
  private generateDocumentKey(envelopeId: EnvelopeId, signerId: SignerId): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `envelopes/${envelopeId.getValue()}/signers/${signerId.getValue()}/document-${timestamp}.pdf`;
  }

}
