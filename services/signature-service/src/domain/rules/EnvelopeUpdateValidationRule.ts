/**
 * @fileoverview EnvelopeUpdateValidationRule - Domain rule for envelope update validation
 * @summary Validates envelope update operations and business rules
 * @description This domain rule ensures that envelope updates follow business rules
 * including immutable field validation, signing order consistency, and S3 key validation.
 */

import { SignatureEnvelope } from '../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../entities/EnvelopeSigner';
import { EnvelopeAccessValidationRule } from './EnvelopeAccessValidationRule';
import { SigningOrderValidationRule } from './SigningOrderValidationRule';
import { SigningOrderType } from '@lawprotect/shared-ts';
import { invalidEnvelopeState } from '../../signature-errors';
import { IMMUTABLE_ENVELOPE_FIELDS } from '../enums/ImmutableEnvelopeFields';

export interface UpdateEnvelopeData {
  title?: string;
  description?: string;
  expiresAt?: Date;
  signingOrderType?: SigningOrderType;
  sourceKey?: string;
  metaKey?: string;
  addSigners?: Array<{
    userId?: string;
    email: string;
    fullName: string;
    isExternal: boolean;
    order?: number;
  }>;
  removeSignerIds?: string[];
}

export class EnvelopeUpdateValidationRule {
  /**
   * Validates envelope update request
   * @param envelope - Current envelope
   * @param updateData - Update data
   * @param userId - User making the request
   * @param existingSigners - Current signers
   */
  static validateEnvelopeUpdate(
    envelope: SignatureEnvelope,
    updateData: UpdateEnvelopeData,
    userId: string,
    existingSigners: EnvelopeSigner[]
  ): void {
    // 1. Validate access using existing rule
    EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);
    
    // 2. Validate immutable fields
    this.validateImmutableFields(updateData);
    
    // 3. Validate signing order changes
    if (updateData.signingOrderType) {
      this.validateSigningOrderChange(envelope, updateData.signingOrderType, existingSigners);
    }
  }
  
  /**
   * Validates that immutable fields are not being changed
   * @param updateData - Update data to validate
   */
  private static validateImmutableFields(updateData: UpdateEnvelopeData): void {
    // Validate that immutable fields are not being changed
    const providedFields = Object.keys(updateData);
    
    for (const field of IMMUTABLE_ENVELOPE_FIELDS) {
      if (providedFields.includes(field)) {
        throw invalidEnvelopeState(`Field '${field}' cannot be modified after envelope creation`);
      }
    }
  }
  
  private static validateSigningOrderChange(
    envelope: SignatureEnvelope,
    newSigningOrderType: SigningOrderType,
    existingSigners: EnvelopeSigner[]
  ): void {
    const signersData = existingSigners.map(signer => ({
      envelopeId: envelope.getId(),
      userId: signer.getUserId() || undefined,
      email: signer.getEmail()?.getValue() || '',
      fullName: signer.getFullName() || '',
      isExternal: signer.getIsExternal(),
      order: signer.getOrder(),
      participantRole: 'SIGNER' as const
    }));
    
    SigningOrderValidationRule.validateSigningOrderConsistency(
      newSigningOrderType,
      signersData,
      envelope.getCreatedBy()
    );
  }
  
}
