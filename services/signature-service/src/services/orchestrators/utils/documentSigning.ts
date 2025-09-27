/**
 * @fileoverview Document preparation helpers for signing flows.
 * @description Helpers to persist a frontend-signed PDF or to load a flattened
 * PDF from S3, producing the normalized tuple needed for signature + hashing.
 */

import { sha256Hex } from '@lawprotect/shared-ts';
import { S3Service } from '@/services/S3Service';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EntityFactory } from '@/domain/factories/EntityFactory';
import { envelopeNotFound } from '@/signature-errors';

type FrontendSignedInput = {
  envelopeId: EnvelopeId;
  signerId: SignerId;
  signedDocumentBase64: string;
};

type FlattenedInput = {
  envelopeId: EnvelopeId;
  flattenedKey?: string;
  userId: string;
};

export async function handleSignedDocumentFromFrontend(
  s3Service: S3Service,
  input: FrontendSignedInput
): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
  const buf = Buffer.from(input.signedDocumentBase64, 'base64');

  const stored = await s3Service.storeSignedDocument({
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    signedDocumentContent: buf,
    contentType: 'application/pdf',
  });

  return {
    signedDocumentKey: stored.documentKey,
    documentContent: buf,
    documentHash: sha256Hex(buf),
  };
}

export async function handleFlattenedDocument(
  signatureEnvelopeService: SignatureEnvelopeService,
  s3Service: S3Service,
  input: FlattenedInput
): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
  const envelope = await signatureEnvelopeService.getEnvelopeWithSigners(input.envelopeId);
  if (!envelope) throw envelopeNotFound(`Envelope with ID ${input.envelopeId.getValue()} not found`);

  const s3KeyVO = input.flattenedKey
    ? EntityFactory.createValueObjects.s3Key(input.flattenedKey)
    : envelope.getFlattenedKey();

  if (!s3KeyVO) {
    throw new Error(
      `Envelope ${input.envelopeId.getValue()} does not have a flattened document ready for signing.`
    );
  }

  if (input.flattenedKey && !envelope.getFlattenedKey()) {
    await signatureEnvelopeService.updateFlattenedKey(input.envelopeId, input.flattenedKey, input.userId);
  }

  const content = await s3Service.getDocumentContent(s3KeyVO.getValue());

  return {
    signedDocumentKey: s3KeyVO.getValue(),
    documentContent: content,
    documentHash: sha256Hex(content),
  };
}
