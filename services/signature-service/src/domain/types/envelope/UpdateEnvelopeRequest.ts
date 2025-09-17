/**
 * @fileoverview UpdateEnvelopeRequest type - Defines request structure for updating envelopes
 * @summary Type definition for envelope update requests
 * @description The UpdateEnvelopeRequest interface defines the data structure required for
 * updating existing envelopes in the system, extending the metadata request with status information.
 */

import { UpdateEnvelopeMetadataRequest } from './UpdateEnvelopeMetadataRequest';
import { EnvelopeStatus } from '../../enums/EnvelopeStatus';

/**
 * Request to update a complete envelope
 * Extends the metadata request with status information
 */
export interface UpdateEnvelopeRequest extends UpdateEnvelopeMetadataRequest {
  /**
   * Optional status update for the envelope
   */
  status?: EnvelopeStatus;
}
