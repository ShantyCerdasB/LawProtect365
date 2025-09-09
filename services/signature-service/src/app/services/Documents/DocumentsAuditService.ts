/**
 * @file DocumentsAuditService.ts
 * @summary Audit service for Documents business logic
 * @description Handles audit logging for Documents operations.
 * Extends BaseAuditService to provide Documents-specific audit functionality.
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";
import type { DocumentId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * @description Service interface for Documents audit operations
 */
export interface DocumentsAuditService {
  /**
   * Logs a document creation event for audit purposes
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  logDocumentCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Logs a document upload event for audit purposes
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  logDocumentUploaded(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Logs a document update event for audit purposes
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  logDocumentUpdated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Logs a document deletion event for audit purposes
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  logDocumentDeleted(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Logs a document lock creation event for audit purposes
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param lockId - Lock identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  logDocumentLockCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    lockId: string,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * @summary Audit service for Documents business logic
 * @description Extends BaseAuditService to provide Documents-specific audit logging functionality.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */
export class DefaultDocumentsAuditService extends BaseAuditService implements DocumentsAuditService {
  /**
   * @summary Logs a business event for audit purposes
   * @description Implementation of the abstract method from BaseAuditService
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param details - Module-specific audit details
   */
  async logBusinessEvent(
    context: AuditContext, 
    details: Record<string, unknown>
  ): Promise<void> {
    if (!context.envelopeId) {
      // For Documents operations, we always need an envelope context
      return;
    }

    await this.auditRepo.record({
      tenantId: context.tenantId,
      envelopeId: context.envelopeId as EnvelopeId,
      type: details.eventType as string,
      occurredAt: nowIso(),
      actor: context.actor,
      metadata: details,
    });
  }

  /**
   * @summary Logs a document creation event for audit purposes
   * @description Records document creation in the audit trail for compliance and traceability
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  async logDocumentCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logBusinessEvent(
      {
        tenantId,
        envelopeId,
        actor,
      },
      {
        eventType: "document.created",
        documentId,
        ...metadata,
      }
    );
  }

  /**
   * @summary Logs a document upload event for audit purposes
   * @description Records document upload in the audit trail for compliance and traceability
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  async logDocumentUploaded(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logBusinessEvent(
      {
        tenantId,
        envelopeId,
        actor,
      },
      {
        eventType: "document.uploaded",
        documentId,
        ...metadata,
      }
    );
  }

  /**
   * @summary Logs a document update event for audit purposes
   * @description Records document update in the audit trail for compliance and traceability
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  async logDocumentUpdated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logBusinessEvent(
      {
        tenantId,
        envelopeId,
        actor,
      },
      {
        eventType: "document.updated",
        documentId,
        ...metadata,
      }
    );
  }

  /**
   * @summary Logs a document deletion event for audit purposes
   * @description Records document deletion in the audit trail for compliance and traceability
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  async logDocumentDeleted(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logBusinessEvent(
      {
        tenantId,
        envelopeId,
        actor,
      },
      {
        eventType: "document.deleted",
        documentId,
        ...metadata,
      }
    );
  }

  /**
   * @summary Logs a document lock creation event for audit purposes
   * @description Records document lock creation in the audit trail for compliance and traceability
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param lockId - Lock identifier
   * @param actor - Actor context for audit purposes
   * @param metadata - Additional metadata for the audit log
   */
  async logDocumentLockCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    lockId: string,
    actor: ActorContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logBusinessEvent(
      {
        tenantId,
        envelopeId,
        actor,
      },
      {
        eventType: "document.lock.created",
        documentId,
        lockId,
        ...metadata,
      }
    );
  }
}






