/**
 * @file makeDocumentsCommandsPort.ts
 * @summary Factory for DocumentsCommandsPort
 * @description Creates and configures the DocumentsCommandsPort implementation,
 * adapting between the app service layer and the documents repository.
 * Handles dependency injection and business logic for document command operations.
 */

import type { Document } from "@/domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects/index";
import type { DocumentStatus } from "@/domain/values/enums";
import { DOCUMENT_STATUSES } from "@/domain/values/enums";
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
import type { DocumentLock } from "@lawprotect/shared-ts";
import type { DocumentsRepository } from "@/domain/contracts/repositories/documents/DocumentsRepository";
import { documentNotFound, envelopeNotFound, badRequest } from "@/shared/errors";
import { nowIso, assertTenantBoundary } from "@lawprotect/shared-ts";
import { 
  assertDocumentMutable, 
  assertSupportedContentType, 
  assertDocumentSizeLimit,
  assertDocumentLockDeletable,
  assertDocumentStatusTransition,
  assertDocumentBelongsToEnvelope,
  assertEnvelopeDraftForDocumentModification
} from "../../../domain/rules/Documents.rules";

/**
 * Dependencies for the DocumentsCommandsPort
 */
interface Dependencies {
  /** Documents repository for data persistence */
  documentsRepo: DocumentsRepository;
  /** Envelopes repository for envelope validation */
  envelopesRepo: any; // EnvelopesRepository
  /** ID generator for creating new document IDs */
  ids: { ulid(): string };
  /** S3 service for presigned URLs */
  s3Service?: {
    createPresignedUploadUrl(bucket: string, key: string, contentType: string): Promise<{ url: string; expiresAt: string }>;
  };
  /** S3 configuration */
  s3Config: {
    evidenceBucket: string;
    signedBucket: string;
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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Get envelope to validate document creation rules
      const envelope = await deps.envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw envelopeNotFound({ envelopeId: command.envelopeId });
      }
      
      // Apply domain-specific rules
      assertEnvelopeDraftForDocumentModification(envelope);
      assertSupportedContentType(command.contentType);
      assertDocumentSizeLimit(command.size);
      
      const documentId = deps.ids.ulid() as DocumentId;
      const now = nowIso();

      const document: Document = {
        documentId,
        envelopeId: command.envelopeId,
        tenantId: command.tenantId,
        name: command.name,
        status: DOCUMENT_STATUSES[3] as DocumentStatus, // "ready"
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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Get envelope to validate document upload rules
      const envelope = await deps.envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw envelopeNotFound({ envelopeId: command.envelopeId });
      }
      
      // Apply domain-specific rules
      assertEnvelopeDraftForDocumentModification(envelope);
      assertSupportedContentType(command.contentType);
      assertDocumentSizeLimit(command.size);
      
      if (!deps.s3Service) {
        throw badRequest("S3 service not available for document upload");
      }

      const documentId = deps.ids.ulid() as DocumentId;
      const now = nowIso();
      const objectKey = `documents/${command.envelopeId}/${documentId}`;

      // Create presigned upload URL
      const { url: uploadUrl, expiresAt } = await deps.s3Service.createPresignedUploadUrl(
        deps.s3Config.evidenceBucket,
        objectKey,
        command.contentType
      );

      // Create document record
      const document: Document = {
        documentId,
        envelopeId: command.envelopeId,
        tenantId: command.tenantId,
        name: command.name,
        status: DOCUMENT_STATUSES[0] as DocumentStatus, // "pending"
        contentType: command.contentType,
        size: command.size,
        digest: command.digest,
        s3Ref: {
          bucket: deps.s3Config.evidenceBucket,
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
      
      // Get envelope to validate document update rules
      const envelope = await deps.envelopesRepo.getById(document.envelopeId);
      if (!envelope) {
        throw envelopeNotFound({ envelopeId: document.envelopeId });
      }
      
      // Apply domain-specific rules
      assertDocumentBelongsToEnvelope(document, document.envelopeId);
      assertEnvelopeDraftForDocumentModification(envelope);
      assertDocumentMutable(document);

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
      
      // Get envelope to validate document update rules
      const envelope = await deps.envelopesRepo.getById(document.envelopeId);
      if (!envelope) {
        throw envelopeNotFound({ envelopeId: document.envelopeId });
      }
      
      // Apply domain-specific rules
      assertDocumentBelongsToEnvelope(document, document.envelopeId);
      assertEnvelopeDraftForDocumentModification(envelope);
      assertDocumentStatusTransition(document.status, DOCUMENT_STATUSES[1] as DocumentStatus); // Transition to uploaded when binary is updated
      assertSupportedContentType(command.contentType);
      assertDocumentSizeLimit(command.size);
      assertDocumentMutable(document);

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

    async deleteLock(documentId: DocumentId, lockId: string, actorUserId: string): Promise<void> {
      const document = await deps.documentsRepo.getById(documentId);
      if (!document) {
        throw documentNotFound({ documentId });
      }
      
      // Apply domain-specific rules
      const currentLocks = Array.isArray(document.metadata?.locks) ? document.metadata.locks : [];
      const lockToDelete = currentLocks.find((lock: any) => lock.lockId === lockId);
      if (lockToDelete) {
        assertDocumentLockDeletable(lockToDelete, actorUserId);
      }
      const updatedLocks = currentLocks.filter((lock: any) => lock.lockId !== lockId);
      
      const updatedMetadata = {
        ...document.metadata,
        locks: updatedLocks,
      };

      await deps.documentsRepo.update(documentId, { metadata: updatedMetadata });
    },
  };
};
