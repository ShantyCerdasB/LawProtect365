/**
 * @fileoverview Document preparation helpers for signing flows
 * @summary Utilities for handling signed documents from frontend and flattened documents
 * @description This module provides utilities for processing signed documents from frontend
 * applications and handling flattened PDF documents from S3 storage. It ensures proper
 * document validation, storage, and hash generation for signature workflows.
 */

import { sha256Hex } from '@lawprotect/shared-ts';
import { S3Service } from '@/services/S3Service';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeHashService } from '@/services/hash/EnvelopeHashService';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EntityFactory } from '@/domain/factories/EntityFactory';
import { envelopeNotFound, documentNotReady } from '@/signature-errors';

/**
 * Input type for handling signed documents from frontend
 */
type FrontendSignedInput = {
  envelopeId: EnvelopeId;
  signerId: SignerId;
  signedDocumentBase64: string;
};

/**
 * Input type for handling flattened documents
 */
type FlattenedInput = {
  envelopeId: EnvelopeId;
  flattenedKey?: string;
  userId: string;
};

/**
 * Handles signed document from frontend by storing it in S3 and generating hash
 * @param s3Service - S3 service for document storage operations
 * @param input - Frontend signed document input containing base64 encoded document
 * @returns Promise resolving to document signing result with key, content, and hash
 * @throws Error when S3 storage operations fail
 */
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

/**
 * Handles flattened document by loading from S3 and generating hash
 * @param signatureEnvelopeService - Service for envelope operations
 * @param s3Service - S3 service for document retrieval
 * @param input - Flattened document input with envelope and optional flattened key
 * @returns Promise resolving to document signing result with key, content, and hash
 * @throws Error when envelope is not found or flattened document is not available
 */
export async function handleFlattenedDocument(
  signatureEnvelopeService: SignatureEnvelopeService,
  envelopeHashService: EnvelopeHashService,
  s3Service: S3Service,
  input: FlattenedInput
): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
  const envelope = await signatureEnvelopeService.getEnvelopeWithSigners(input.envelopeId);
  if (!envelope) throw envelopeNotFound(`Envelope with ID ${input.envelopeId.getValue()} not found`);

  const s3KeyVO = input.flattenedKey
    ? EntityFactory.createValueObjects.s3Key(input.flattenedKey)
    : envelope.getFlattenedKey();

  if (!s3KeyVO) {
    throw documentNotReady(
      `Envelope ${input.envelopeId.getValue()} does not have a flattened document ready for signing.`
    );
  }

  if (input.flattenedKey && !envelope.getFlattenedKey()) {
    await envelopeHashService.updateFlattenedKey(input.envelopeId, input.flattenedKey, input.userId);
  }

  const content = await s3Service.getDocumentContent(s3KeyVO.getValue());

  return {
    signedDocumentKey: s3KeyVO.getValue(),
    documentContent: content,
    documentHash: sha256Hex(content),
  };
}
