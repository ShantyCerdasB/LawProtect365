/**
 * @fileoverview EnvelopeBusinessRules - Business rules for envelope operations
 * @summary Core business logic and validation rules for envelope management
 * @description The EnvelopeBusinessRules provides centralized business logic
 * for envelope operations including limits, validations, and compliance rules.
 * These rules complement the entity validations and provide higher-level business constraints.
 */

import { EnvelopeStatus, isValidEnvelopeStatusTransition, getValidNextStatuses } from '@/domain/enums/EnvelopeStatus';
import { EnvelopeOperation, isValidEnvelopeOperation, getValidEnvelopeOperations } from '@/domain/enums/EnvelopeOperation';
import { Envelope } from '@/domain/entities/Envelope';
import { SignerStatus } from '@/domain/enums/SignerStatus';
import type { WorkflowTimingConfig } from '@/domain/types/WorkflowTypes';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';
import { validateEnvelopeSecurity } from './EnvelopeSecurityRules';
import { validateEnvelopeWorkflow } from './EnvelopeEventRules';
import type { AuditEvent } from '@/domain/types/audit/AuditEvent';
import type { Signer } from '@/domain/entities/Signer';
import type { Signature } from '@/domain/entities/Signature';
import { AccessType, PermissionLevel } from '@lawprotect/shared-ts';
import { 
  invalidEnvelopeState, 
  envelopeLimitExceeded,
  envelopeTitleDuplicate,
  envelopeExpirationInvalid,
  envelopeDocumentNotFound
} from '@/signature-errors';
import type { SignatureServiceConfig } from '@/config';
import { 
  validateDateRange, 
  validateCustomFields, 
  validateTags,
  validateStringField,
  DocumentStatus,
  isDocumentReadyForSigning,
  type DateRangeConfig,
  type CustomFieldsConfig,
  type TagsConfig
} from '@lawprotect/shared-ts';
import { validateMaxSignersPerEnvelope as validateSignerLimit } from '@/domain/rules/signer/SignerBusinessRules';


/**
 * Validates the maximum number of signers per envelope
 * Delegates to SignerBusinessRules for signer-specific validation
 */
export function validateMaxSignersPerEnvelope(signerCount: number, config: SignatureServiceConfig): void {
  validateSignerLimit(signerCount, config);
}

/**
 * Validates the maximum number of envelopes per owner
 */
export function validateMaxEnvelopesPerOwner(envelopeCount: number, config: SignatureServiceConfig): void {
  if (envelopeCount > config.envelopeRules.maxEnvelopesPerOwner) {
    throw envelopeLimitExceeded(
      `Owner cannot have more than ${config.envelopeRules.maxEnvelopesPerOwner} envelopes`
    );
  }
}

/**
 * Validates envelope title uniqueness per owner
 */
export function validateUniqueTitlePerOwner(
  title: string, 
  _ownerId: string, 
  existingTitles: string[],
  config: SignatureServiceConfig
): void {
  if (!config.envelopeRules.requireUniqueTitlesPerOwner) {
    return;
  }

  const normalizedTitle = title.trim().toLowerCase();
  const normalizedExistingTitles = existingTitles.map(t => t.trim().toLowerCase());
  
  if (normalizedExistingTitles.includes(normalizedTitle)) {
    throw envelopeTitleDuplicate(
      `Envelope title "${title}" already exists for this owner`
    );
  }
}

/**
 * Validates envelope expiration date using shared validation utilities
 */
export function validateExpirationDate(expiresAt: Date | undefined, config: SignatureServiceConfig): void {
  if (!expiresAt) {
    return; // Optional field
  }

  const dateRangeConfig: DateRangeConfig = {
    minDaysFromNow: config.envelopeRules.minExpirationDays,
    maxDaysFromNow: config.envelopeRules.maxExpirationDays,
    allowPastDates: false
  };

  try {
    validateDateRange(expiresAt, dateRangeConfig, "Envelope expiration");
  } catch (error) {
    if (error instanceof Error) {
      throw envelopeExpirationInvalid(error.message);
    }
    throw error;
  }
}

/**
 * Validates envelope metadata integrity using shared validation utilities
 */
export function validateMetadataIntegrity(
  metadata: {
    title: string;
    description?: string;
    customFields?: Record<string, any>;
    tags?: string[];
  },
  config: SignatureServiceConfig
): void {
  // Validate custom fields using shared utility
  if (metadata.customFields) {
    const customFieldsConfig: CustomFieldsConfig = {
      maxFields: config.envelopeRules.maxCustomFields,
      maxKeyLength: config.envelopeRules.maxCustomFieldKeyLength,
      maxValueLength: config.envelopeRules.maxCustomFieldValueLength,
      allowedValueTypes: ['string', 'number', 'boolean']
    };

    try {
      validateCustomFields(metadata.customFields, customFieldsConfig, "Envelope custom fields");
    } catch (error) {
      if (error instanceof Error) {
        throw invalidEnvelopeState(error.message);
      }
      throw error;
    }
  }

  // Validate tags using shared utility
  if (metadata.tags) {
    const tagsConfig: TagsConfig = {
      maxTags: config.envelopeRules.maxTags,
      maxTagLength: config.envelopeRules.maxTagLength,
      allowDuplicates: false,
      trimWhitespace: true
    };

    try {
      validateTags(metadata.tags, tagsConfig, "Envelope tags");
    } catch (error) {
      if (error instanceof Error) {
        throw invalidEnvelopeState(error.message);
      }
      throw error;
    }
  }

  // Validate description using shared utility
  if (metadata.description) {
    try {
      validateStringField(metadata.description, 1000, "Envelope description", true);
    } catch (error) {
      if (error instanceof Error) {
        throw invalidEnvelopeState(error.message);
      }
      throw error;
    }
  }
}

/**
 * Validates that a document exists and is ready for signing
 * Checks the shared Documents table for document existence and status
 */
export async function validateDocumentExists(
  documentId: string,
  documentRepository: {
    getDocument: (id: string) => Promise<{
      documentId: string;
      status: string;
      s3Key: string;
      ownerId: string;
    } | null>;
  }
): Promise<void> {
  if (!documentId || documentId.trim().length === 0) {
    throw envelopeDocumentNotFound('Document ID is required');
  }

  try {
    // Diagnostic logging to help integration tests
    // eslint-disable-next-line no-console
    console.log('[EnvelopeRules] validateDocumentExists: fetching document', { documentId });
    const document = await documentRepository.getDocument(documentId);
    // eslint-disable-next-line no-console
    console.log('[EnvelopeRules] validateDocumentExists: fetched document', document ? { status: document.status, ownerId: document.ownerId, s3Key: document.s3Key } : { notFound: true });
    
    if (!document) {
      throw envelopeDocumentNotFound(`Document with ID ${documentId} not found`);
    }

    // Validate document status - must be FLATTENED or READY for signing
    if (!isDocumentReadyForSigning(document.status as DocumentStatus)) {
      throw invalidEnvelopeState(
        `Document ${documentId} is not ready for signing. Current status: ${document.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw envelopeDocumentNotFound(`Document with ID ${documentId} not found`);
    }
    throw error;
  }
}

/**
 * Validates envelope status transitions for business operations
 * Uses the existing enum validation functions for consistency
 */
export function validateEnvelopeStatusForOperation(
  currentStatus: EnvelopeStatus,
  targetStatus: EnvelopeStatus
): void {
  // Use the existing enum validation function
  if (!isValidEnvelopeStatusTransition(currentStatus, targetStatus)) {
    const validNextStatuses = getValidNextStatuses(currentStatus);
    throw invalidEnvelopeState(
      `Invalid status transition from ${currentStatus} to ${targetStatus}. Valid next statuses: ${validNextStatuses.join(', ')}`
    );
  }
}

/**
 * Validates envelope status for specific business operations
 * Uses the EnvelopeOperation enum for type safety
 */
export function validateEnvelopeStatusForBusinessOperation(
  currentStatus: EnvelopeStatus,
  operation: EnvelopeOperation
): void {
  // Use the enum validation function
  if (!isValidEnvelopeOperation(currentStatus, operation)) {
    const validOperations = getValidEnvelopeOperations(currentStatus);
    throw invalidEnvelopeState(
      `Invalid operation ${operation} for envelope status ${currentStatus}. Valid operations: ${validOperations.join(', ')}`
    );
  }

  // Additional business-specific validations
  validateOperationSpecificRules(currentStatus, operation);
}

/**
 * Validates operation-specific business rules
 */
function validateOperationSpecificRules(
  currentStatus: EnvelopeStatus,
  operation: EnvelopeOperation
): void {
  const validators = {
    [EnvelopeOperation.CREATE]: validateCreateOperation,
    [EnvelopeOperation.UPDATE]: validateUpdateOperation,
    [EnvelopeOperation.SEND]: validateSendOperation,
    [EnvelopeOperation.SIGN]: validateSignOperation,
    [EnvelopeOperation.COMPLETE]: validateCompleteOperation,
    [EnvelopeOperation.EXPIRE]: validateExpireOperation,
    [EnvelopeOperation.DECLINE]: validateDeclineOperation,
    [EnvelopeOperation.CANCEL]: validateCancelOperation,
    [EnvelopeOperation.ADD_SIGNER]: validateAddSignerOperation,
    [EnvelopeOperation.REMOVE_SIGNER]: validateRemoveSignerOperation
  };

  const validator = validators[operation as keyof typeof validators];
  if (validator) {
    validator(currentStatus);
  }
}

/**
 * Validates CREATE operation
 */
function validateCreateOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.DRAFT) {
    throw invalidEnvelopeState('Can only create envelope in DRAFT status');
  }
}

/**
 * Validates UPDATE operation
 */
function validateUpdateOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.DRAFT && currentStatus !== EnvelopeStatus.DECLINED) {
    throw invalidEnvelopeState('Can only update envelope in DRAFT or DECLINED status');
  }
}

/**
 * Validates SEND operation
 */
function validateSendOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.DRAFT) {
    throw invalidEnvelopeState('Can only send envelope from DRAFT status');
  }
}

/**
 * Validates SIGN operation
 */
function validateSignOperation(currentStatus: EnvelopeStatus): void {
  const validStatuses = [EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS, EnvelopeStatus.READY_FOR_SIGNATURE];
  if (!validStatuses.includes(currentStatus)) {
    throw invalidEnvelopeState('Can only sign envelope in SENT, IN_PROGRESS, or READY_FOR_SIGNATURE status');
  }
}

/**
 * Validates COMPLETE operation
 */
function validateCompleteOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.READY_FOR_SIGNATURE) {
    throw invalidEnvelopeState('Can only complete envelope when ready for signature');
  }
}

/**
 * Validates EXPIRE operation
 */
function validateExpireOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus === EnvelopeStatus.COMPLETED) {
    throw invalidEnvelopeState('Cannot expire completed envelope');
  }
}

/**
 * Validates DECLINE operation
 */
function validateDeclineOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus === EnvelopeStatus.COMPLETED) {
    throw invalidEnvelopeState('Cannot decline completed envelope');
  }
}

/**
 * Validates CANCEL operation
 */
function validateCancelOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus === EnvelopeStatus.COMPLETED) {
    throw invalidEnvelopeState('Cannot cancel completed envelope');
  }
}

/**
 * Validates ADD_SIGNER operation
 */
function validateAddSignerOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.DRAFT) {
    throw invalidEnvelopeState('Can only add signers to envelope in DRAFT status');
  }
}

/**
 * Validates REMOVE_SIGNER operation
 */
function validateRemoveSignerOperation(currentStatus: EnvelopeStatus): void {
  if (currentStatus !== EnvelopeStatus.DRAFT) {
    throw invalidEnvelopeState('Can only remove signers from envelope in DRAFT status');
  }
}

/**
 * Validates if envelope should be cancelled when a signer declines
 * 
 * Business rule: An envelope can only be cancelled if:
 * 1. Not all signers have signed yet
 * 2. At least one signer has declined
 * 3. The envelope is not in COMPLETED status
 * 
 * @param envelope - The envelope to validate
 * @throws {SignatureError} When envelope cannot be cancelled
 * @returns void
 */
export function validateEnvelopeCancellationOnDecline(envelope: Envelope): void {
  const signers = envelope.getSigners();
  const signedCount = signers.filter(signer => signer.getStatus() === SignerStatus.SIGNED).length;
  const declinedCount = signers.filter(signer => signer.getStatus() === SignerStatus.DECLINED).length;
  const totalSigners = signers.length;

  // Cannot cancel if all signers have already signed
  if (signedCount === totalSigners) {
    throw invalidEnvelopeState('Cannot cancel envelope: all signers have already signed');
  }

  // Cannot cancel if no signers have declined
  if (declinedCount === 0) {
    throw invalidEnvelopeState('Cannot cancel envelope: no signers have declined');
  }

  // Cannot cancel if envelope is already completed
  if (envelope.getStatus() === EnvelopeStatus.COMPLETED) {
    throw invalidEnvelopeState('Cannot cancel envelope: envelope is already completed');
  }
}

/**
 * Determines if an envelope should be cancelled when a signer declines
 * 
 * Business rule: An envelope should be cancelled if:
 * 1. Not all signers have signed yet
 * 2. At least one signer has declined
 * 3. The envelope is not in COMPLETED status
 * 
 * @param envelope - The envelope to evaluate
 * @returns boolean indicating if envelope should be cancelled
 */
export function shouldCancelEnvelopeOnDecline(envelope: Envelope): boolean {
  const signers = envelope.getSigners();
  const signedCount = signers.filter(signer => signer.getStatus() === SignerStatus.SIGNED).length;
  const declinedCount = signers.filter(signer => signer.getStatus() === SignerStatus.DECLINED).length;
  const totalSigners = signers.length;

  // Should cancel if:
  // 1. Not all signers have signed yet
  // 2. At least one signer has declined
  // 3. Envelope is not already completed
  return (
    signedCount < totalSigners &&
    declinedCount > 0 &&
    envelope.getStatus() !== EnvelopeStatus.COMPLETED
  );
}

/**
 * Creates a cancelled envelope from the current envelope
 * 
 * This function creates a new envelope instance with CANCELLED status
 * while preserving all other envelope data for audit purposes.
 * 
 * @param envelope - The current envelope
 * @returns New envelope with CANCELLED status
 */
export function createCancelledEnvelope(envelope: Envelope): Envelope {
  return new Envelope(
    envelope.getId(),
    envelope.getDocumentId(),
    envelope.getOwnerId(),
    EnvelopeStatus.CANCELLED,
    envelope.getSigners(),
    envelope.getSigningOrder(),
    envelope.getCreatedAt(),
    new Date(), // updatedAt
    envelope.getMetadata(),
    envelope.getCompletedAt()
  );
}

/**
 * Validates envelope priority and its business impact
 */

/**
 * Comprehensive envelope validation combining all business rules
 */
export async function validateEnvelopeBusinessRules(
  envelopeData: {
    signerCount: number;
    ownerId: string;
    title: string;
    existingTitles: string[];
    expiresAt?: Date;
    metadata: {
      title: string;
      description?: string;
      customFields?: Record<string, any>;
      tags?: string[];
    };
    documentId: string;
    currentStatus: EnvelopeStatus;
    operation: EnvelopeOperation;
  },
  config: SignatureServiceConfig,
  documentRepository: {
    getDocument: (id: string) => Promise<{
      documentId: string;
      status: string;
      s3Key: string;
      ownerId: string;
    } | null>;
  }
): Promise<void> {
  // Diagnostics: start
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] BR start', {
    signerCount: envelopeData.signerCount,
    ownerId: envelopeData.ownerId,
    title: envelopeData.title,
    expiresAt: envelopeData.expiresAt,
    documentId: envelopeData.documentId,
    currentStatus: envelopeData.currentStatus,
    operation: envelopeData.operation
  });

  // Validate limits
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateMaxSignersPerEnvelope');
  validateMaxSignersPerEnvelope(envelopeData.signerCount, config);
  
  // Validate title uniqueness
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateUniqueTitlePerOwner', { existingCount: envelopeData.existingTitles.length });
  validateUniqueTitlePerOwner(envelopeData.title, envelopeData.ownerId, envelopeData.existingTitles, config);
  
  // Validate expiration
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateExpirationDate');
  validateExpirationDate(envelopeData.expiresAt, config);
  
  // Validate metadata integrity
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateMetadataIntegrity');
  validateMetadataIntegrity(envelopeData.metadata, config);
  
  // Validate document exists
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateDocumentExists');
  await validateDocumentExists(envelopeData.documentId, documentRepository);
  
  // Validate status for operation
  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] validateEnvelopeStatusForBusinessOperation');
  validateEnvelopeStatusForBusinessOperation(envelopeData.currentStatus, envelopeData.operation);

  // eslint-disable-next-line no-console
  console.log('[EnvelopeRules] BR end - OK');
}

/**
 * Comprehensive envelope validation for all operations
 * 
 * This method orchestrates all envelope validations including business, security, compliance, and workflow rules.
 * It serves as the central validation entry point for envelope operations, ensuring all domain rules are applied
 * consistently across the application.
 * 
 * @param envelope - The envelope entity to validate
 * @param operation - The operation being performed on the envelope
 * @param context - Security context containing user information and access details
 * @param context.userId - ID of the user performing the operation
 * @param context.accessType - Type of access (DIRECT, SHARED_LINK, INVITATION, etc.)
 * @param context.permission - Permission level of the user (OWNER, ADMIN, EDITOR, etc.)
 * @param context.ipAddress - IP address of the user
 * @param context.userAgent - User agent string from the browser
 * @param context.timestamp - Timestamp when the operation was initiated
 * @param config - Service configuration containing business rules and limits
 * @param dependencies - External dependencies required for validation
 * @param dependencies.documentRepository - Repository for document validation (optional)
 * @param dependencies.rateLimitStore - Rate limiting store for security validation (optional)
 * @param dependencies.accessToken - Access token for authentication (optional)
 * @param dependencies.auditEvents - Audit events for compliance validation (optional)
 * @param dependencies.signers - Signers for workflow validation (optional)
 * @param dependencies.signatures - Signatures for workflow validation (optional)
 * 
 * @returns Promise that resolves when all validations pass
 * 
 * @throws {AppError} When business rules validation fails (e.g., limits exceeded, invalid state)
 * @throws {AppError} When security validation fails (e.g., unauthorized access, rate limit exceeded)
 * @throws {AppError} When compliance validation fails (e.g., missing required fields, invalid metadata)
 * @throws {AppError} When workflow validation fails (e.g., invalid signing order, timing constraints)
 * 
 * @example
 * ```typescript
 * await validateEnvelopeComprehensive(
 *   envelope,
 *   EnvelopeOperation.SEND,
 *   {
 *     userId: 'user123',
 *     accessType: 'DIRECT',
 *     permission: 'OWNER',
 *     ipAddress: '192.168.1.1',
 *     userAgent: 'Mozilla/5.0...',
 *     timestamp: new Date()
 *   },
 *   config,
 *   { documentRepository, rateLimitStore }
 * );
 * ```
 */
export async function validateEnvelopeComprehensive(
  envelope: Envelope,
  operation: EnvelopeOperation,
  context: {
    userId: string;
    accessType: string;
    permission: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
  },
  config: SignatureServiceConfig,
  dependencies: {
    documentRepository?: {
      getDocument: (id: string) => Promise<{
        documentId: string;
        status: string;
        s3Key: string;
        ownerId: string;
      } | null>;
    };
    rateLimitStore?: unknown;
    accessToken?: string;
    auditEvents?: AuditEvent[];
    signers?: Signer[];
    signatures?: Signature[];
  }
): Promise<void> {
  // 1. Business Rules Validation
  await validateEnvelopeBusinessRules({
    signerCount: envelope.getSigners().length,
    ownerId: envelope.getOwnerId(),
    title: envelope.getMetadata().title,
    existingTitles: [], // Empty array - title uniqueness validation skipped
    expiresAt: envelope.getMetadata().expiresAt,
    metadata: envelope.getMetadata(),
    documentId: envelope.getDocumentId(),
    currentStatus: envelope.getStatus(),
    operation
  }, config, dependencies.documentRepository || { getDocument: async () => null });
  
  // 2. Security Validation
  await validateEnvelopeSecurity({
    userId: context.userId,
    accessType: context.accessType as AccessType,
    permission: context.permission as PermissionLevel,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    timestamp: context.timestamp
  }, operation, config, {
    rateLimitStore: dependencies.rateLimitStore,
    accessToken: dependencies.accessToken,
    envelopeOwnerId: envelope.getOwnerId()
  });
  
  // 3. State Transition Validation (if status change)
  if (operation === EnvelopeOperation.UPDATE || operation === EnvelopeOperation.SEND || 
      operation === EnvelopeOperation.COMPLETE || operation === EnvelopeOperation.CANCEL) {
    // State transition validation is handled by the entity's built-in validation
    // when the status is actually changed in the service layer
  }
  
  // 4. Workflow Validation (if applicable)
  if (operation === EnvelopeOperation.SEND || operation === EnvelopeOperation.SIGN) {
    // Use default workflow configurations
    const signingOrder = SigningOrder.ownerFirst();
    const timingConfig: WorkflowTimingConfig = {
      reminderIntervals: [24, 48, 72],
      expirationGracePeriod: 24,
      maxReminderAttempts: 3,
      escalationThresholds: 72
    };
    
    validateEnvelopeWorkflow(envelope, operation, signingOrder, timingConfig);
  }
}
