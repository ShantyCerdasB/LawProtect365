/**
 * @file makeDocumentsCommandsPort.ts
 * @summary Factory for DocumentsCommandsPort
 * @description Creates and configures the DocumentsCommandsPort implementation,
 * adapting between the app service layer and the documents repository.
 * Handles dependency injection and business logic for document command operations.
 */

import type { Document } from "@/domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects/Ids";
import type { 
  DocumentsCommandsPort, 
  CreateDocumentCommand, 
  CreateDocumentResult, 
  UploadDocumentCommand,
  UploadDocumentResult,
  UpdateDocumentCommand, 
  UpdateDocumentResult,
  UpdateDocumentBinaryCommand
} from "../../ports/documents/DocumentsCommandsPort";
import type { DocumentLock } from "@/domain/value-objects/DocumentLock";
import type { DocumentsRepository } from "@/shared/contracts/repositories/documents/DocumentsRepository";
import { documentNotFound } from "@/shared/errors";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * Dependencies for the DocumentsCommandsPort
 */
interface Dependencies {
  /** Documents repository for data persistence */
  documentsRepo: DocumentsRepository;
  /** ID generator for creating new document IDs */
  ids: { ulid(): string };
  /** S3 service for presigned URLs */
  s3Service?: {
    createPresignedUploadUrl(bucket: string, key: string, contentType: string): Promise<{ url: string; expiresAt: string }>;
  };
}

/**
 * Creates a DocumentsCommandsPort implementation
 * @param deps - Dependencies including repository and services
 * @returns Configured DocumentsCommandsPort implementation
 */
export const makeDocumentsCommandsPort = (deps: Dependencies): DocumentsCommandsPort => {
  return {
    /**
     * Creates a new document
     * @param command - The document creation command
     * @returns Promise resolving to creation result
     */
    async create(command: CreateDocumentCommand): Promise<CreateDocumentResult> {
      const documentId = deps.ids.ulid() as DocumentId;
      const now = nowIso();

      const document: Document = {
        documentId,
        envelopeId: command.envelopeId,
        tenantId: command.tenantId,
        name: command.name,
        status: "ready",
        contentType: command.contentType,
        size: command.size,
        digest: command.digest,
        s3Ref: command.s3Ref,
        pageCount: command.pageCount,
        createdAt: now,
        updatedAt: now,
        metadata: {
          createdBy: command.actor.userId,
          createdByIp: command.actor.ip,
        },
      };

      await deps.documentsRepo.create(document);

      return {
        documentId,
        createdAt: now,
      };
    },

    /**
     * Uploads a new document (original document upload with presigned URL)
     * @param command - The document upload command
     * @returns Promise resolving to upload result with presigned URL
     */
    async upload(command: UploadDocumentCommand): Promise<UploadDocumentResult> {
      if (!deps.s3Service) {
        throw new Error("S3 service not available for document upload");
      }

      const documentId = deps.ids.ulid() as DocumentId;
      const now = nowIso();
      const objectKey = `documents/${command.envelopeId}/${documentId}`;

      // Create presigned upload URL
      const { url: uploadUrl, expiresAt } = await deps.s3Service.createPresignedUploadUrl(
        "documents-bucket", // This should come from config
        objectKey,
        command.contentType
      );

      // Create document record
      const document: Document = {
        documentId,
        envelopeId: command.envelopeId,
        tenantId: command.tenantId,
        name: command.name,
        status: "pending",
        contentType: command.contentType,
        size: command.size,
        digest: command.digest,
        s3Ref: {
          bucket: "documents-bucket",
          key: objectKey,
        },
        pageCount: command.pageCount,
        createdAt: now,
        updatedAt: now,
        metadata: {
          uploadedBy: command.actor.userId,
          uploadedByIp: command.actor.ip,
          uploadStatus: "pending",
        },
      };

      await deps.documentsRepo.create(document);

      return {
        documentId,
        uploadedAt: now,
        uploadUrl,
        objectKey,
        expiresAt,
      };
    },

    /**
     * Updates an existing document
     * @param command - The document update command
     * @returns Promise resolving to update result
     */
    async update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult> {
      const document = await deps.documentsRepo.getById(command.documentId);
      if (!document) {
        throw documentNotFound({ id: command.documentId });
      }

      const updatedDocument = await deps.documentsRepo.update(command.documentId, {
        name: command.name,
        metadata: {
          ...document.metadata,
          ...command.metadata,
          updatedBy: command.actor.userId,
          updatedByIp: command.actor.ip,
        },
      });

      return {
        documentId: updatedDocument.documentId,
        updatedAt: updatedDocument.updatedAt,
      };
    },

    /**
     * Updates document binary and metadata
     * @param command - The document binary update command
     * @returns Promise resolving to update result
     */
    async updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult> {
      const document = await deps.documentsRepo.getById(command.documentId);
      if (!document) {
        throw documentNotFound({ id: command.documentId });
      }

      const updatedDocument = await deps.documentsRepo.update(command.documentId, {
        contentType: command.contentType,
        size: command.size,
        digest: command.digest,
        s3Ref: command.s3Ref,
        pageCount: command.pageCount,
        metadata: {
          ...document.metadata,
          updatedBy: command.actor.userId,
          updatedByIp: command.actor.ip,
        },
      });

      return {
        documentId: updatedDocument.documentId,
        updatedAt: updatedDocument.updatedAt,
      };
    },

    /**
     * Deletes a document
     * @param documentId - The document ID to delete
     * @returns Promise resolving when deletion is complete
     */
    async delete(documentId: DocumentId): Promise<void> {
      const document = await deps.documentsRepo.getById(documentId);
      if (!document) {
        throw documentNotFound({ id: documentId });
      }

      await deps.documentsRepo.delete(documentId);
    },

    /**
     * Creates a document lock
     * @param lock - The document lock to create
     * @returns Promise resolving when lock creation is complete
     */
    async createLock(lock: DocumentLock): Promise<void> {
      const documentId = lock.documentId as DocumentId;
      const document = await deps.documentsRepo.getById(documentId);
      if (!document) {
        throw documentNotFound({ id: documentId });
      }

      const currentLocks = Array.isArray(document.metadata?.locks) ? document.metadata.locks : [];
      const updatedMetadata = {
        ...document.metadata,
        locks: [...currentLocks, lock],
      };

      await deps.documentsRepo.update(documentId, { metadata: updatedMetadata });
    },
  };
};