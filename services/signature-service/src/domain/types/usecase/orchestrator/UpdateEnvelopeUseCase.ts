/**
 * @fileoverview UpdateEnvelopeUseCase Types - Defines types for the UpdateEnvelopeUseCase
 * @summary Type definitions for input and output of the UpdateEnvelopeUseCase
 */

import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { UpdateEnvelopeData } from '@/domain/rules/EnvelopeUpdateValidationRule';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '@/domain';

/**
 * Input parameters for the UpdateEnvelopeUseCase.
 */
export type UpdateEnvelopeUseCaseInput = {
  envelopeId: EnvelopeId;
  updateData: UpdateEnvelopeData;
  userId: string;
};

/**
 * Result of the UpdateEnvelopeUseCase execution.
 */
export type UpdateEnvelopeUseCaseResult = {
  envelope: SignatureEnvelope;
  signers?: EnvelopeSigner[];
};
