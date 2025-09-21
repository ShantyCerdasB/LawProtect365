/**
 * @fileoverview SignerUpdateData - Interface for updating signer information
 * @summary Defines the interface for updating signer data and status
 * @description This interface provides a flexible way to update signer information
 * including status changes, signature data, consent information, and other fields.
 */

import { SignerStatus } from '@prisma/client';

export interface SignerUpdateData {
  status?: SignerStatus;
  signedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  consentGiven?: boolean;
  consentTimestamp?: Date;
  documentHash?: string;
  signatureHash?: string;
  signedS3Key?: string;
  kmsKeyId?: string;
  algorithm?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  location?: string;
}
