/**
 * @fileoverview ShareDocumentViewUseCase Types - Defines types for the ShareDocumentViewUseCase
 * @summary Type definitions for input and output of the ShareDocumentViewUseCase
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { Email } from '@lawprotect/shared-ts';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Input parameters for the ShareDocumentViewUseCase.
 */
export type ShareDocumentViewInput = {
  envelopeId: EnvelopeId;
  email: Email;
  fullName: string;
  message?: string;
  expiresInDays?: number;
  userId: string;
  securityContext: NetworkSecurityContext;
};

/**
 * Result of the ShareDocumentViewUseCase execution.
 */
export type ShareDocumentViewResult = {
  success: boolean;
  message: string;
  envelopeId: string;
  viewerEmail: string;
  viewerName: string;
  token: string;
  expiresAt: Date;
  expiresInDays: number;
};
