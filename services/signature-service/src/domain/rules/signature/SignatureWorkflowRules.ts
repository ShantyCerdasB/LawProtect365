/**
 * @fileoverview SignatureWorkflowRules - Workflow rules for signature operations
 * @summary Contains workflow validation for signature creation, validation, storage, retrieval, and verification
 * @description This file contains workflow rules specific to the Signature entity, including
 * validation for signature creation workflow, validation workflow, storage workflow, retrieval workflow,
 * and verification workflow processes.
 */

import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { 
  signatureFailed, 
  signatureNotFound,
  signatureInvalid,
  eventGenerationFailed
} from '@/signature-errors';

/**
 * Signature workflow operation types
 */
export enum SignatureWorkflowOperation {
  CREATE = 'CREATE',
  VALIDATE = 'VALIDATE',
  STORE = 'STORE',
  RETRIEVE = 'RETRIEVE',
  VERIFY = 'VERIFY'
}

/**
 * Validates signature creation workflow
 */
export function validateSignatureCreationWorkflow(
  signature: Signature,
  config: { 
    workflowSteps: string[]; 
    requiredSteps: string[];
    maxWorkflowTime: number;
    workflowValidationRequired: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for creation workflow validation');
  }

  if (config.workflowValidationRequired) {
    // Validate all required workflow steps are present
    for (const step of config.requiredSteps) {
      if (!config.workflowSteps.includes(step)) {
        throw signatureInvalid(`Required workflow step ${step} is missing`);
      }
    }

    // Validate workflow steps are in correct order
    const expectedOrder = ['VALIDATE', 'SIGN', 'STORE', 'AUDIT'];
    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedStep = expectedOrder[i];
      const actualStep = config.workflowSteps[i];
      
      if (actualStep !== expectedStep) {
        throw signatureInvalid(`Workflow step ${i} should be ${expectedStep}, but got ${actualStep}`);
      }
    }
  }

  // Validate signature is in correct state for creation workflow
  if (signature.getStatus() !== SignatureStatus.PENDING) {
    throw signatureInvalid('Signature must be in PENDING state for creation workflow');
  }

  // Validate signature has required fields for creation workflow
  if (!signature.getId() || !signature.getEnvelopeId() || !signature.getSignerId()) {
    throw signatureInvalid('Signature is missing required fields for creation workflow');
  }
}

/**
 * Validates signature validation workflow
 */
export function validateSignatureValidationWorkflow(
  signature: Signature,
  config: { 
    validationSteps: string[]; 
    requiredValidations: string[];
    maxValidationTime: number;
    validationRetryCount: number
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for validation workflow');
  }

  // Validate all required validation steps are present
  for (const validation of config.requiredValidations) {
    if (!config.validationSteps.includes(validation)) {
      throw signatureInvalid(`Required validation ${validation} is missing`);
    }
  }

  // Validate signature is in correct state for validation workflow
  if (signature.getStatus() !== SignatureStatus.PENDING) {
    throw signatureInvalid('Signature must be in PENDING state for validation workflow');
  }

  // Validate signature has required fields for validation workflow
  if (!signature.getDocumentHash() || !signature.getSignatureHash()) {
    throw signatureInvalid('Signature is missing required hash fields for validation workflow');
  }

  // Validate signature timestamp is within validation time window
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const maxAge = config.maxValidationTime;
  
  if (now.getTime() - signatureTime.getTime() > maxAge) {
    throw signatureInvalid('Signature is too old for validation workflow');
  }
}

/**
 * Validates signature storage workflow
 */
export function validateSignatureStorageWorkflow(
  signature: Signature,
  config: { 
    storageSteps: string[]; 
    requiredStorageSteps: string[];
    maxStorageTime: number;
    storageValidationRequired: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for storage workflow validation');
  }

  if (config.storageValidationRequired) {
    // Validate all required storage steps are present
    for (const step of config.requiredStorageSteps) {
      if (!config.storageSteps.includes(step)) {
        throw signatureInvalid(`Required storage step ${step} is missing`);
      }
    }

    // Validate storage steps are in correct order
    const expectedOrder = ['VALIDATE', 'ENCRYPT', 'STORE', 'VERIFY', 'AUDIT'];
    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedStep = expectedOrder[i];
      const actualStep = config.storageSteps[i];
      
      if (actualStep !== expectedStep) {
        throw signatureInvalid(`Storage step ${i} should be ${expectedStep}, but got ${actualStep}`);
      }
    }
  }

  // Validate signature is in correct state for storage workflow
  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Signature must be in SIGNED state for storage workflow');
  }

  // Validate signature has required fields for storage workflow
  if (!signature.getS3Key() || !signature.getKmsKeyId()) {
    throw signatureInvalid('Signature is missing required storage fields');
  }

  // Validate signature timestamp is within storage time window
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const maxAge = config.maxStorageTime;
  
  if (now.getTime() - signatureTime.getTime() > maxAge) {
    throw signatureInvalid('Signature is too old for storage workflow');
  }
}

/**
 * Validates signature retrieval workflow
 */
export function validateSignatureRetrievalWorkflow(
  signature: Signature,
  config: { 
    retrievalSteps: string[]; 
    requiredRetrievalSteps: string[];
    maxRetrievalTime: number;
    retrievalValidationRequired: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for retrieval workflow validation');
  }

  if (config.retrievalValidationRequired) {
    // Validate all required retrieval steps are present
    for (const step of config.requiredRetrievalSteps) {
      if (!config.retrievalSteps.includes(step)) {
        throw signatureInvalid(`Required retrieval step ${step} is missing`);
      }
    }

    // Validate retrieval steps are in correct order
    const expectedOrder = ['AUTHENTICATE', 'AUTHORIZE', 'RETRIEVE', 'VALIDATE', 'AUDIT'];
    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedStep = expectedOrder[i];
      const actualStep = config.retrievalSteps[i];
      
      if (actualStep !== expectedStep) {
        throw signatureInvalid(`Retrieval step ${i} should be ${expectedStep}, but got ${actualStep}`);
      }
    }
  }

  // Validate signature is in correct state for retrieval workflow
  if (signature.getStatus() === SignatureStatus.FAILED) {
    throw signatureFailed('Failed signatures cannot be retrieved');
  }

  // Validate signature has required fields for retrieval workflow
  if (!signature.getS3Key() || !signature.getId()) {
    throw signatureInvalid('Signature is missing required retrieval fields');
  }

  // Validate signature timestamp is within retrieval time window
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const maxAge = config.maxRetrievalTime;
  
  if (now.getTime() - signatureTime.getTime() > maxAge) {
    throw signatureInvalid('Signature is too old for retrieval workflow');
  }
}

/**
 * Validates signature verification workflow
 */
export function validateSignatureVerificationWorkflow(
  signature: Signature,
  config: { 
    verificationSteps: string[]; 
    requiredVerificationSteps: string[];
    maxVerificationTime: number;
    verificationRetryCount: number
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for verification workflow');
  }

  // Validate all required verification steps are present
  for (const step of config.requiredVerificationSteps) {
    if (!config.verificationSteps.includes(step)) {
      throw signatureInvalid(`Required verification step ${step} is missing`);
    }
  }

  // Validate signature is in correct state for verification workflow
  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Signature must be in SIGNED state for verification workflow');
  }

  // Validate signature has required fields for verification workflow
  if (!signature.getDocumentHash() || !signature.getSignatureHash() || !signature.getAlgorithm()) {
    throw signatureInvalid('Signature is missing required verification fields');
  }

  // Validate signature timestamp is within verification time window
  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const maxAge = config.maxVerificationTime;
  
  if (now.getTime() - signatureTime.getTime() > maxAge) {
    throw signatureInvalid('Signature is too old for verification workflow');
  }

  // Validate signature integrity for verification workflow
  if (!signature.validateIntegrity()) {
    throw signatureInvalid('Signature integrity validation failed for verification workflow');
  }
}

/**
 * Validates signature workflow timing
 */
export function validateSignatureWorkflowTiming(
  signature: Signature,
  config: { 
    maxWorkflowTime: number; 
    minWorkflowTime: number;
    workflowTimeout: number
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for workflow timing validation');
  }

  const signatureTime = signature.getTimestamp();
  const now = new Date();
  const age = now.getTime() - signatureTime.getTime();

  // Validate signature is not too old for workflow
  if (age > config.maxWorkflowTime) {
    throw signatureInvalid('Signature is too old for workflow processing');
  }

  // Validate signature is not too recent for workflow
  if (age < config.minWorkflowTime) {
    throw signatureInvalid('Signature is too recent for workflow processing');
  }

  // Validate signature is not in timeout state
  if (age > config.workflowTimeout) {
    throw signatureInvalid('Signature workflow has timed out');
  }
}

/**
 * Validates signature workflow state transitions
 */
export function validateSignatureWorkflowStateTransition(
  currentStatus: SignatureStatus,
  newStatus: SignatureStatus,
  workflowStep: string
): void {
  const validTransitions: Record<SignatureStatus, SignatureStatus[]> = {
    [SignatureStatus.PENDING]: [SignatureStatus.SIGNED, SignatureStatus.FAILED],
    [SignatureStatus.SIGNED]: [],
    [SignatureStatus.FAILED]: []
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw signatureInvalid(`Invalid workflow state transition from ${currentStatus} to ${newStatus} at step ${workflowStep}`);
  }

  // Validate workflow step is appropriate for status transition
  if (newStatus === SignatureStatus.SIGNED && workflowStep !== 'SIGN') {
    throw signatureInvalid(`Status transition to SIGNED is only allowed at SIGN step, but got ${workflowStep}`);
  }

  if (newStatus === SignatureStatus.FAILED && !['VALIDATE', 'SIGN', 'STORE'].includes(workflowStep)) {
    throw signatureInvalid(`Status transition to FAILED is only allowed at VALIDATE, SIGN, or STORE steps, but got ${workflowStep}`);
  }
}

/**
 * Validates signature workflow event generation
 */
export function validateSignatureWorkflowEventGeneration(
  signature: Signature,
  workflowStep: string,
  config: { 
    requiredEvents: string[]; 
    eventValidationRequired: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for workflow event generation validation');
  }

  if (config.eventValidationRequired) {
    // Validate all required events are present
    for (const event of config.requiredEvents) {
      if (!event) {
        throw eventGenerationFailed(`Required workflow event ${event} is missing`);
      }
    }

    // Validate event generation is appropriate for workflow step
    const expectedEvents: Record<string, string[]> = {
      'VALIDATE': ['SIGNATURE_VALIDATION_STARTED', 'SIGNATURE_VALIDATION_COMPLETED'],
      'SIGN': ['SIGNATURE_CREATION_STARTED', 'SIGNATURE_CREATION_COMPLETED'],
      'STORE': ['SIGNATURE_STORAGE_STARTED', 'SIGNATURE_STORAGE_COMPLETED'],
      'RETRIEVE': ['SIGNATURE_RETRIEVAL_STARTED', 'SIGNATURE_RETRIEVAL_COMPLETED'],
      'VERIFY': ['SIGNATURE_VERIFICATION_STARTED', 'SIGNATURE_VERIFICATION_COMPLETED']
    };

    const stepEvents = expectedEvents[workflowStep];
    if (stepEvents) {
      for (const event of stepEvents) {
        if (!config.requiredEvents.includes(event)) {
          throw eventGenerationFailed(`Required event ${event} is missing for workflow step ${workflowStep}`);
        }
      }
    }
  }
}

/**
 * Validates signature workflow completion
 */
export function validateSignatureWorkflowCompletion(
  signature: Signature,
  workflowSteps: string[],
  config: { 
    requiredCompletionSteps: string[]; 
    completionValidationRequired: boolean
  }
): void {
  if (!signature) {
    throw signatureNotFound('Signature is required for workflow completion validation');
  }

  if (config.completionValidationRequired) {
    // Validate all required completion steps are present
    for (const step of config.requiredCompletionSteps) {
      if (!workflowSteps.includes(step)) {
        throw signatureInvalid(`Required completion step ${step} is missing`);
      }
    }

    // Validate workflow steps are in correct order for completion
    const expectedOrder = ['VALIDATE', 'SIGN', 'STORE', 'AUDIT'];
    for (let i = 0; i < expectedOrder.length; i++) {
      const expectedStep = expectedOrder[i];
      const actualStep = workflowSteps[i];
      
      if (actualStep !== expectedStep) {
        throw signatureInvalid(`Completion step ${i} should be ${expectedStep}, but got ${actualStep}`);
      }
    }
  }

  // Validate signature is in correct state for workflow completion
  if (signature.getStatus() !== SignatureStatus.SIGNED) {
    throw signatureInvalid('Signature must be in SIGNED state for workflow completion');
  }

  // Validate signature has all required fields for workflow completion
  if (!signature.getId() || !signature.getEnvelopeId() || !signature.getSignerId() || 
      !signature.getDocumentHash() || !signature.getSignatureHash() || !signature.getS3Key()) {
    throw signatureInvalid('Signature is missing required fields for workflow completion');
  }
}

/**
 * Validates all signature workflow rules
 */
export function validateSignatureWorkflowRules(
  signature: Signature,
  operation: SignatureWorkflowOperation,
  config: {
    workflowSteps: string[];
    requiredSteps: string[];
    maxWorkflowTime: number;
    workflowValidationRequired: boolean;
    validationSteps: string[];
    requiredValidations: string[];
    maxValidationTime: number;
    validationRetryCount: number;
    storageSteps: string[];
    requiredStorageSteps: string[];
    maxStorageTime: number;
    storageValidationRequired: boolean;
    retrievalSteps: string[];
    requiredRetrievalSteps: string[];
    maxRetrievalTime: number;
    retrievalValidationRequired: boolean;
    verificationSteps: string[];
    requiredVerificationSteps: string[];
    maxVerificationTime: number;
    verificationRetryCount: number;
    minWorkflowTime: number;
    workflowTimeout: number;
    requiredEvents: string[];
    eventValidationRequired: boolean;
    requiredCompletionSteps: string[];
    completionValidationRequired: boolean;
  }
): void {
  switch (operation) {
    case SignatureWorkflowOperation.CREATE:
      validateSignatureCreationWorkflow(signature, config);
      validateSignatureWorkflowTiming(signature, config);
      break;

    case SignatureWorkflowOperation.VALIDATE:
      validateSignatureValidationWorkflow(signature, config);
      validateSignatureWorkflowTiming(signature, config);
      break;

    case SignatureWorkflowOperation.STORE:
      validateSignatureStorageWorkflow(signature, config);
      validateSignatureWorkflowTiming(signature, config);
      break;

    case SignatureWorkflowOperation.RETRIEVE:
      validateSignatureRetrievalWorkflow(signature, config);
      validateSignatureWorkflowTiming(signature, config);
      break;

    case SignatureWorkflowOperation.VERIFY:
      validateSignatureVerificationWorkflow(signature, config);
      validateSignatureWorkflowTiming(signature, config);
      break;

    default:
      throw signatureInvalid(`Unknown signature workflow operation: ${operation}`);
  }
}
