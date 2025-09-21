/**
 * @fileoverview SignerSpec - Interface for specifying signer queries
 * @summary Defines the interface for querying signers with various filters
 * @description This interface provides a flexible way to query signers based on
 * different criteria such as envelope ID, user ID, email, status, and other filters.
 */

import { SignerStatus } from '@prisma/client';

export interface SignerSpec {
  envelopeId?: string;
  userId?: string;
  email?: string;
  status?: SignerStatus;
  isExternal?: boolean;
  participantRole?: string;
  hasSigned?: boolean;
  hasDeclined?: boolean;
  consentGiven?: boolean;
}
