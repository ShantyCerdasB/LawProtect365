/**
 * @file makeDocumentsCommandsPort.adapter.ts
 * @summary Factory for DocumentsCommandsPort
 * @description Creates and configures the DocumentsCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for document command operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Document } from "@/domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects/Ids";
import type { 
  DocumentsCommandsPort, 
  CreateDocumentCommand, 
  CreateDocumentResult, 
  UpdateDocumentCommand, 
  UpdateDocumentResult,
  UpdateDocumentBinaryCommand
} from "@/app/ports/documents/DocumentsCommandsPort";
import type { DocumentLock } from "@/domain/value-objects/DocumentLock";
import { createDocument } from "@/use-cases/documents/CreateDocument";
import { patchDocument } from "@/use-cases/documents/PatchDocument";
import { deleteDocument } from "@/use-cases/documents/DeleteDocument";
import { toDocumentId } from "@/app/ports/shared";
import { documentNotFound } from "@/errors";

/**
 * Creates a DocumentsCommandsPort implementation
 * @param documentsRepo - The document repository for data persistence
 * @param envelopesRepo - The envelope repository for validation
 * @param deps - Dependencies including ID generators
 * @returns Configured DocumentsCommandsPort implementation
 */
export const makeDocumentsCommandsPort = (
  documentsRepo: Repository<Document, DocumentId>,
  envelopesRepo: Repository<any, string>,
  deps: { ids: { ulid(): string } }
): DocumentsCommandsPort => {
  return {
    /**
     * Creates a new document
     * @param command - The document creation command
     * @returns Promise resolving to creation result
     */
    async create(command: CreateDocumentCommand): Promise<CreateDocumentResult> {
      const result = await createDocument(
        {
          tenantId: command.tenantId,
          envelopeId: command.envelopeId,
          name: command.name,
          contentType: command.contentType,
          size: command.size,
          digest: command.digest,
          s3Ref: command.s3Ref,
          pageCount: command.pageCount,
          actor: command.actor,
        },
        {
          repos: { 
            documents: documentsRepo,
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
        }
      );

      return {
        documentId: result.document.documentId,
        createdAt: result.document.createdAt,
      };
    },

    /**
     * Updates an existing document
     * @param command - The document update command
     * @returns Promise resolving to update result
     */
    async update(command: UpdateDocumentCommand): Promise<UpdateDocumentResult> {
      const result = await patchDocument(
        { 
          documentId: command.documentId,
          name: command.name,
          metadata: command.metadata,
        },
        { 
          repos: { 
            documents: documentsRepo,
            envelopes: envelopesRepo,
          } 
        }
      );

      return {
        documentId: result.document.documentId,
        updatedAt: result.document.updatedAt,
      };
    },

    /**
     * Deletes a document
     * @param documentId - The document ID to delete
     * @returns Promise resolving when deletion is complete
     */
    async delete(documentId: DocumentId): Promise<void> {
      await deleteDocument(
        { documentId },
        { 
          repos: { 
            documents: documentsRepo,
            envelopes: envelopesRepo,
          } 
        }
      );
    },

    /**
     * Gets a document by ID
     * @param documentId - The document ID to retrieve
     * @returns Promise resolving to the document or null if not found
     */
    async getById(documentId: DocumentId): Promise<any> {
      return await documentsRepo.getById(documentId);
    },

    /**
     * Updates document binary and metadata
     * @param command - The document binary update command
     * @returns Promise resolving to update result
     */
    async updateBinary(command: UpdateDocumentBinaryCommand): Promise<UpdateDocumentResult> {
      const result = await patchDocument(
        { 
          documentId: command.documentId,
          metadata: {
            contentType: command.contentType,
            size: command.size,
            digest: command.digest,
            s3Ref: command.s3Ref,
            pageCount: command.pageCount,
          },
        },
        { 
          repos: { 
            documents: documentsRepo,
            envelopes: envelopesRepo,
          } 
        }
      );

      return {
        documentId: result.document.documentId,
        updatedAt: result.document.updatedAt,
      };
    },

    /**
     * Creates a document lock
     * @param lock - The document lock to create
     * @returns Promise resolving when lock creation is complete
     */
    async createLock(lock: DocumentLock): Promise<void> {
      const documentId = toDocumentId(lock.documentId);
      const document = await documentsRepo.getById(documentId);
      if (!document) {
        throw documentNotFound(lock.documentId);
      }

      const currentLocks = Array.isArray(document.metadata?.locks) ? document.metadata.locks : [];
      const updatedMetadata = {
        ...document.metadata,
        locks: [...currentLocks, lock],
      };

      await documentsRepo.update(documentId, { metadata: updatedMetadata });
    },

    /**
     * Lists all locks for a document
     * @param documentId - The document ID to list locks for
     * @returns Promise resolving to array of document locks
     */
    async listLocks(documentId: DocumentId): Promise<DocumentLock[]> {
      const document = await documentsRepo.getById(documentId);
      if (!document) {
        return [];
      }

      const locks = document.metadata?.locks;
      return Array.isArray(locks) ? locks : [];
    },
  };
};
