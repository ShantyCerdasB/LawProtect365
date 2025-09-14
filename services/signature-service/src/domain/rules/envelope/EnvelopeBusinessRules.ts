/**
 * @fileoverview EnvelopeBusinessRules - Business rules for envelope operations
 * @summary Core business logic and validation rules for envelope management
 * @description The EnvelopeBusinessRules provides centralized business logic
 * for envelope operations including limits, validations, and compliance rules.
 * These rules complement the entity validations and provide higher-level business constraints.
 */

import { EnvelopeStatus, isValidEnvelopeStatusTransition, getValidNextStatuses } from '@/domain/enums/EnvelopeStatus';
import { EnvelopeOperation, isValidEnvelopeOperation, getValidEnvelopeOperations } from '@/domain/enums/EnvelopeOperation';
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
    const document = await documentRepository.getDocument(documentId);
    
    if (!document) {
      throw envelopeDocumentNotFound(`Document with ID ${documentId} not found`);
    }

    // Validate document status - must be FLATTENED or READY for signing
    if (document.status !== 'FLATTENED' && document.status !== 'READY') {
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
  switch (operation) {
    case EnvelopeOperation.CREATE:
      // Can only create in DRAFT status
      if (currentStatus !== EnvelopeStatus.DRAFT) {
        throw invalidEnvelopeState('Can only create envelope in DRAFT status');
      }
      break;

    case EnvelopeOperation.UPDATE:
      // Can only update in DRAFT or DECLINED status
      if (currentStatus !== EnvelopeStatus.DRAFT && currentStatus !== EnvelopeStatus.DECLINED) {
        throw invalidEnvelopeState('Can only update envelope in DRAFT or DECLINED status');
      }
      break;

    case EnvelopeOperation.SEND:
      // Can only send from DRAFT status
      if (currentStatus !== EnvelopeStatus.DRAFT) {
        throw invalidEnvelopeState('Can only send envelope from DRAFT status');
      }
      break;

    case EnvelopeOperation.SIGN:
      // Can sign in SENT, IN_PROGRESS, or READY_FOR_SIGNATURE status
      if (![EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS, EnvelopeStatus.READY_FOR_SIGNATURE].includes(currentStatus)) {
        throw invalidEnvelopeState('Can only sign envelope in SENT, IN_PROGRESS, or READY_FOR_SIGNATURE status');
      }
      break;

    case EnvelopeOperation.COMPLETE:
      // Can only complete if all signers have signed
      if (currentStatus !== EnvelopeStatus.READY_FOR_SIGNATURE) {
        throw invalidEnvelopeState('Can only complete envelope when ready for signature');
      }
      break;

    case EnvelopeOperation.EXPIRE:
      // Can expire from any status except COMPLETED
      if (currentStatus === EnvelopeStatus.COMPLETED) {
        throw invalidEnvelopeState('Cannot expire completed envelope');
      }
      break;

    case EnvelopeOperation.DECLINE:
      // Can decline from any status except COMPLETED
      if (currentStatus === EnvelopeStatus.COMPLETED) {
        throw invalidEnvelopeState('Cannot decline completed envelope');
      }
      break;

    case EnvelopeOperation.CANCEL:
      // Can cancel from any status except COMPLETED
      if (currentStatus === EnvelopeStatus.COMPLETED) {
        throw invalidEnvelopeState('Cannot cancel completed envelope');
      }
      break;

    case EnvelopeOperation.ADD_SIGNER:
      // Can only add signers in DRAFT status
      if (currentStatus !== EnvelopeStatus.DRAFT) {
        throw invalidEnvelopeState('Can only add signers to envelope in DRAFT status');
      }
      break;

    case EnvelopeOperation.REMOVE_SIGNER:
      // Can only remove signers in DRAFT status
      if (currentStatus !== EnvelopeStatus.DRAFT) {
        throw invalidEnvelopeState('Can only remove signers from envelope in DRAFT status');
      }
      break;

    default:
      throw invalidEnvelopeState(`Unknown operation: ${operation}`);
  }
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
  // Validate limits
  validateMaxSignersPerEnvelope(envelopeData.signerCount, config);
  
  // Validate title uniqueness
  validateUniqueTitlePerOwner(envelopeData.title, envelopeData.ownerId, envelopeData.existingTitles, config);
  
  // Validate expiration
  validateExpirationDate(envelopeData.expiresAt, config);
  
  // Validate metadata integrity
  validateMetadataIntegrity(envelopeData.metadata, config);
  
  // Validate document exists
  await validateDocumentExists(envelopeData.documentId, documentRepository);
  
  // Validate status for operation
  validateEnvelopeStatusForBusinessOperation(envelopeData.currentStatus, envelopeData.operation);
  
}
