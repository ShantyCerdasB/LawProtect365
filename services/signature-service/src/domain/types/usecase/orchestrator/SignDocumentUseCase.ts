/**
 * @fileoverview SignDocumentUseCase Types - Defines types for the SignDocumentUseCase
 * @summary Type definitions for input and output of the SignDocumentUseCase
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignDocumentRequest, SignDocumentResult } from '@/domain/types/orchestrator';

/**
 * Input parameters for the SignDocumentUseCase.
 */
export type SignDocumentUseCaseInput = {
  request: SignDocumentRequest;
  userId: string;
  securityContext: NetworkSecurityContext;
};

/**
 * Result of the SignDocumentUseCase execution.
 */
export type SignDocumentUseCaseResult = SignDocumentResult;
