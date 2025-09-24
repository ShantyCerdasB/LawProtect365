/**
 * @fileoverview S3Service - Service for document storage operations
 * @summary Manages S3 operations for document storage and retrieval
 * @description This service handles all S3 operations including
 * document storage, retrieval, and presigned URL generation using
 * the new architecture with value objects and proper validation.
 */

import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { S3Key } from '../domain/value-objects/S3Key';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { StoreDocumentRequest, RetrieveDocumentRequest, GeneratePresignedUrlRequest, DocumentResult } from '../domain/types/s3';
import {S3Presigner, S3EvidenceStorage,  NotFoundError, BadRequestError, ErrorCodes, getDocumentContent } from '@lawprotect/shared-ts';
import { validateStoreDocumentRequest, validateRetrieveDocumentRequest, validateGeneratePresignedUrlRequest } from '../domain/rules/s3/S3ValidationRules';
import { validateS3StorageForDocument } from '../domain/rules/s3/S3StorageRules';
import { documentS3Error } from '../signature-errors';


/**
 * S3Service
 * 
 * Service for managing document storage operations using AWS S3.
 * Handles document storage, retrieval, and presigned URL generation.
 */
export class S3Service {
  constructor(
    private readonly s3Presigner: S3Presigner,
    private readonly s3EvidenceStorage: S3EvidenceStorage,
    private readonly bucketName: string,
    private readonly signatureAuditEventService: SignatureAuditEventService
  ) {}

  /**
   * Stores a document in S3
   * @param request - Document storage request with content and metadata
   * @returns Document result with S3 location and metadata
   */
  async storeDocument(request: StoreDocumentRequest): Promise<DocumentResult> {
    try {
      // Validate input using domain rules
      validateStoreDocumentRequest(request);

      // Generate document key using value objects
      const documentKey = this.generateDocumentKey(request.envelopeId, request.signerId);
      const s3Key = S3Key.fromString(documentKey);

      // Validate S3 key using storage rules
      validateS3StorageForDocument(s3Key, {
        allowedS3Buckets: [this.bucketName],
        documentKeyPrefix: 'envelopes/',
        allowedExtensions: ['pdf']
      });

      // Store document in S3 using S3EvidenceStorage
      await this.s3EvidenceStorage.putObject({
        bucket: this.bucketName,
        key: documentKey,
        body: request.documentContent,
        contentType: request.contentType.getValue(),
        metadata: {
          envelopeId: request.envelopeId.getValue(),
          signerId: request.signerId.getValue(),
          ...(request.metadata?.originalFileName && { originalFileName: request.metadata.originalFileName }),
          ...(request.metadata?.checksum && { checksum: request.metadata.checksum })
        }
      });

      const documentResult: DocumentResult = {
        documentKey,
        s3Location: `s3://${this.bucketName}/${documentKey}`,
        contentType: request.contentType.getValue(),
        size: request.metadata?.fileSize || request.documentContent.length
      };

      // Log audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Document stored in S3 for signer ${request.signerId.getValue()}`,
        eventType: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey,
          contentType: request.contentType.getValue(),
          size: request.metadata?.fileSize || request.documentContent.length,
          originalFileName: request.metadata?.originalFileName
        }
      });

      return documentResult;
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw documentS3Error({
        operation: 'storeDocument',
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }


  /**
   * Retrieves a document from S3
   * @param request - Document retrieval request with key and access control
   * @returns Document result with metadata and location
   */
  async retrieveDocument(request: RetrieveDocumentRequest): Promise<DocumentResult> {
    try {
      // Validate input using domain rules
      validateRetrieveDocumentRequest(request);

      // Get document metadata using S3EvidenceStorage
      const headResult = await this.s3EvidenceStorage.headObject(
        this.bucketName,
        request.documentKey.getValue()
      );

      if (!headResult.exists) {
        throw new NotFoundError('Document not found or invalid', ErrorCodes.COMMON_NOT_FOUND);
      }

      const documentResult: DocumentResult = {
        documentKey: request.documentKey.getValue(),
        s3Location: `s3://${this.bucketName}/${request.documentKey.getValue()}`,
        contentType: headResult.metadata?.contentType || 'application/octet-stream',
        size: headResult.size,
        lastModified: headResult.lastModified
      };

      // Log audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Document retrieved from S3 for signer ${request.signerId.getValue()}`,
        eventType: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey: request.documentKey.getValue(),
          contentType: headResult.metadata?.contentType || 'application/octet-stream',
          size: headResult.size
        }
      });

      return documentResult;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
        throw new NotFoundError('Document not found', ErrorCodes.COMMON_NOT_FOUND);
      }
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw documentS3Error({
        operation: 'retrieveDocument',
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Generates a presigned URL for document access
   * @param request - Presigned URL generation request with operation and expiration
   * @returns Presigned URL for S3 operation
   */
  async generatePresignedUrl(request: GeneratePresignedUrlRequest): Promise<string> {
    try {
      // Validate input using domain rules
      validateGeneratePresignedUrlRequest(request, {
        maxExpirationTime: 86400, // 24 hours (user can choose up to 1 day)
        minExpirationTime: 300    // 5 minutes minimum
      });

      const expiresIn = request.expiresIn || 3600; // Default 1 hour

      let presignedUrl: string;
      if (request.operation.isGet()) {
        presignedUrl = await this.s3Presigner.getObjectUrl({
          bucket: this.bucketName,
          key: request.documentKey.getValue(),
          expiresInSeconds: expiresIn
        });
      } else if (request.operation.isPut()) {
        presignedUrl = await this.s3Presigner.putObjectUrl({
          bucket: this.bucketName,
          key: request.documentKey.getValue(),
          expiresInSeconds: expiresIn
        });
      } else {
        throw new BadRequestError('Unsupported S3 operation', ErrorCodes.COMMON_BAD_REQUEST);
      }

      // Log audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Presigned URL generated for ${request.operation.getValue()} operation on document ${request.documentKey.getValue()}`,
        eventType: AuditEventType.DOCUMENT_ACCESSED,
        userId: request.signerId.getValue(),
        metadata: {
          documentKey: request.documentKey.getValue(),
          operation: request.operation.getValue(),
          expiresIn
        }
      });

      return presignedUrl;
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw documentS3Error({
        operation: 'generatePresignedUrl',
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Checks if a document exists in S3
   * @param documentKey - S3 key to check
   * @returns True if document exists, false otherwise
   */
  async documentExists(documentKey: string): Promise<boolean> {
    try {
      if (!documentKey || documentKey.trim().length === 0) {
        return false;
      }

      // Validate S3 key format
      const s3Key = S3Key.fromString(documentKey);

      const headResult = await this.s3EvidenceStorage.headObject(
        this.bucketName,
        s3Key.getValue()
      );

      return headResult.exists;
    } catch (error: unknown) {
      // S3EvidenceStorage already handles NoSuchKey errors
      throw documentS3Error({
        operation: 'documentExists',
        documentKey,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets document metadata
   * @param documentKey - S3 key to get metadata for
   * @returns Document metadata or null if not found
   */
  async getDocumentMetadata(documentKey: string): Promise<DocumentResult | null> {
    try {
      if (!documentKey || documentKey.trim().length === 0) {
        return null;
      }

      // Validate S3 key format
      const s3Key = S3Key.fromString(documentKey);

      const headResult = await this.s3EvidenceStorage.headObject(
        this.bucketName,
        s3Key.getValue()
      );

      if (!headResult.exists) {
        return null;
      }

      return {
        documentKey: s3Key.getValue(),
        s3Location: `s3://${this.bucketName}/${s3Key.getValue()}`,
        contentType: headResult.metadata?.contentType || 'application/octet-stream',
        size: headResult.size,
        lastModified: headResult.lastModified
      };
    } catch (error: unknown) {
      // S3EvidenceStorage already handles NoSuchKey errors
      throw documentS3Error({
        operation: 'getDocumentMetadata',
        documentKey,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }


  /**
   * Gets document information including metadata
   * @param s3Key - S3 key to get information for
   * @returns Document information with filename, content type, and size
   */
  async getDocumentInfo(s3Key: string): Promise<{
    filename: string;
    contentType: string;
    size?: number;
  }> {
    try {
      // Validate S3 key format
      const s3KeyObj = S3Key.fromString(s3Key);
      const metadata = await this.getDocumentMetadata(s3KeyObj.getValue());
      
      if (!metadata) {
        throw new NotFoundError('Document not found', 'DOCUMENT_NOT_FOUND');
      }

      return {
        filename: s3KeyObj.getFileName() || 'document.pdf',
        contentType: metadata.contentType || 'application/pdf',
        size: metadata.size
      };
    } catch (error) {
      throw documentS3Error({
        operation: 'getDocumentInfo',
        s3Key,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Gets document content from S3
   * @param s3Key - S3 key of the document to retrieve
   * @returns Promise resolving to document content as Buffer
   * @throws NotFoundError when document is not found
   * @throws Error when download fails
   */
  async getDocumentContent(s3Key: string): Promise<Buffer> {
    try {
      // Validate S3 key format
      const s3KeyObj = S3Key.fromString(s3Key);
      
      // Use shared utility function
      return await getDocumentContent(
        this.s3EvidenceStorage,
        this.bucketName,
        s3KeyObj.getValue()
      );
    } catch (error) {
      throw documentS3Error({
        operation: 'getDocumentContent',
        s3Key,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Records a document download action in the audit trail
   * @param request - Download action request with audit information
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
      // Validate S3 key format
      const s3Key = S3Key.fromString(request.s3Key);
      const info = await this.getDocumentInfo(s3Key.getValue());
      
      await this.signatureAuditEventService.createEvent({
        envelopeId: request.envelopeId,
        description: 'Signed document downloaded',
        eventType: AuditEventType.DOCUMENT_DOWNLOADED,
        userId: request.userId,
        userEmail: request.userEmail,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        country: request.country,
        metadata: {
          s3Key: s3Key.getValue(),
          filename: info.filename,
          contentType: info.contentType,
          size: info.size
        }
      });
    } catch (error: unknown) {
      throw documentS3Error({
        operation: 'recordDownloadAction',
        envelopeId: request.envelopeId,
        s3Key: request.s3Key,
        originalError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * Generates a document key for S3 storage
   * @param envelopeId - Envelope ID for the document
   * @param signerId - Signer ID for the document
   * @returns S3 key for document storage
   */
  private generateDocumentKey(envelopeId: EnvelopeId, signerId: SignerId): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `envelopes/${envelopeId.getValue()}/signers/${signerId.getValue()}/document-${timestamp}.pdf`;
  }

}
