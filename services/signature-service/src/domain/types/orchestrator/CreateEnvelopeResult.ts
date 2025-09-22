/**
 * @fileoverview CreateEnvelopeResult - Result interface for envelope creation operations
 * @summary Contains the result of a successful envelope creation operation
 * @description This interface defines the structure for envelope creation results,
 * including the created envelope and signers. Invitation tokens are generated separately
 * when sending invitations.
 */

import { SignatureEnvelope } from '../../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../entities/EnvelopeSigner';

export interface CreateEnvelopeResult {
  /** Created signature envelope */
  envelope: SignatureEnvelope;
  /** Array of created signers (empty for CreateEnvelope flow) */
  signers: EnvelopeSigner[];
}
