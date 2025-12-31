/**
 * @fileoverview buildSigningResponse Tests - Unit tests for buildSigningResponse utility
 * @summary Tests for the utility that builds signing response DTOs
 * @description Comprehensive unit tests for buildSigningResponse function that verifies
 * proper construction of signing response DTOs with envelope and signature information.
 */

import { buildSigningResponse } from '../../../../../src/services/orchestrators/utils/buildSigningResponse';
import { SignatureEnvelope } from '../../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { SigningMessages } from '../../../../../src/domain/enums/SigningMessages';
import { TestUtils } from '../../../../helpers/testUtils';
import { DocumentOrigin } from '../../../../../src/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '../../../../../src/domain/value-objects/SigningOrder';
import { EnvelopeStatus } from '../../../../../src/domain/value-objects/EnvelopeStatus';
import { S3Key, DocumentHash } from '@lawprotect/shared-ts';

function createBasicEnvelope(
  id: EnvelopeId,
  status: EnvelopeStatus
): SignatureEnvelope {
  return new SignatureEnvelope(
    id,
    TestUtils.generateUuid(),
    'Test Envelope',
    'Test Description',
    status,
    [],
    SigningOrder.ownerFirst(),
    DocumentOrigin.userUpload(),
    undefined, // sourceKey
    undefined, // metaKey
    undefined, // flattenedKey
    undefined, // signedKey
    undefined, // sourceSha256
    undefined, // flattenedSha256
    undefined, // signedSha256
    undefined, // sentAt
    undefined, // completedAt
    undefined, // cancelledAt
    undefined, // declinedAt
    undefined, // declinedBySignerId
    undefined, // declinedReason
    undefined, // expiresAt
    new Date(), // createdAt
    new Date()  // updatedAt
  );
}

describe('buildSigningResponse', () => {
  let originalEnvelope: SignatureEnvelope;
  let responseEnvelope: SignatureEnvelope;
  let signerId: SignerId;
  let envelopeId: EnvelopeId;
  let signature: { id: string; sha256: string; timestamp: string };

  beforeEach(() => {
    envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
    signerId = SignerId.fromString(TestUtils.generateUuid());
    
    originalEnvelope = createBasicEnvelope(envelopeId, EnvelopeStatus.draft());
    responseEnvelope = createBasicEnvelope(envelopeId, EnvelopeStatus.completed());

    signature = {
      id: TestUtils.generateUuid(),
      sha256: 'a'.repeat(64),
      timestamp: new Date().toISOString(),
    };
  });

  it('should be a function', () => {
    expect(typeof buildSigningResponse).toBe('function');
  });

  it('should build response with responseEnvelope when provided', () => {
    const result = buildSigningResponse(
      responseEnvelope,
      originalEnvelope,
      signature,
      signerId,
      envelopeId
    );

    expect(result).toBeDefined();
    expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
    expect(result.envelope.id).toBe(envelopeId.getValue());
    expect(result.envelope.status).toBe(EnvelopeStatus.completed().getValue());
    expect(result.signature.id).toBe(signature.id);
    expect(result.signature.signerId).toBe(signerId.getValue());
    expect(result.signature.envelopeId).toBe(envelopeId.getValue());
    expect(result.signature.signedAt).toBe(signature.timestamp);
    expect(result.signature.hash).toBe(signature.sha256);
  });

  it('should build response with originalEnvelope when responseEnvelope is null', () => {
    const result = buildSigningResponse(
      null,
      originalEnvelope,
      signature,
      signerId,
      envelopeId
    );

    expect(result).toBeDefined();
    expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
    expect(result.envelope.id).toBe(envelopeId.getValue());
    expect(result.envelope.status).toBe(EnvelopeStatus.draft().getValue());
    expect(result.signature.id).toBe(signature.id);
  });

  it('should build response with originalEnvelope when responseEnvelope is undefined', () => {
    const result = buildSigningResponse(
      undefined,
      originalEnvelope,
      signature,
      signerId,
      envelopeId
    );

    expect(result).toBeDefined();
    expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
    expect(result.envelope.id).toBe(envelopeId.getValue());
    expect(result.envelope.status).toBe(EnvelopeStatus.draft().getValue());
    expect(result.signature.id).toBe(signature.id);
  });

  it('should include all required signature fields', () => {
    const result = buildSigningResponse(
      responseEnvelope,
      originalEnvelope,
      signature,
      signerId,
      envelopeId
    );

    expect(result.signature).toHaveProperty('id');
    expect(result.signature).toHaveProperty('signerId');
    expect(result.signature).toHaveProperty('envelopeId');
    expect(result.signature).toHaveProperty('signedAt');
    expect(result.signature).toHaveProperty('algorithm');
    expect(result.signature).toHaveProperty('hash');
  });

  it('should include all required envelope fields', () => {
    const result = buildSigningResponse(
      responseEnvelope,
      originalEnvelope,
      signature,
      signerId,
      envelopeId
    );

    expect(result.envelope).toHaveProperty('id');
    expect(result.envelope).toHaveProperty('status');
    expect(result.envelope).toHaveProperty('progress');
  });
});

