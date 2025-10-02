/**
 * @fileoverview S3Service Test Builders - Reusable test data builders for S3Service tests
 * @summary Provides builders for creating test data related to S3Service operations
 * @description This module provides builders for creating S3Service-related test data including
 * requests, responses, configurations, and mock data for comprehensive testing.
 */

import { S3Key, ContentType } from '@lawprotect/shared-ts';
import { TestUtils } from '../testUtils';
import { DocumentType } from '../../../src/domain/enums';
import { generateTestIpAddress } from '../../integration/helpers/testHelpers';

/**
 * Creates a StoreDocumentRequest for testing
 * @param overrides - Optional overrides for the request
 * @returns StoreDocumentRequest with test data
 */
export function storeDocumentRequest(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId || TestUtils.generateSignerId(),
    documentContent: overrides.documentContent || Buffer.from('test document content'),
    contentType: overrides.contentType || ContentType.fromString('application/pdf'),
    metadata: overrides.metadata || {
      originalFileName: 'test-document.pdf',
      fileSize: 1024,
      checksum: 'sha256:test-checksum'
    }
  };
}

/**
 * Creates a RetrieveDocumentRequest for testing
 * @param overrides - Optional overrides for the request
 * @returns RetrieveDocumentRequest with test data
 */
export function retrieveDocumentRequest(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId || TestUtils.generateSignerId(),
    documentKey: overrides.documentKey || S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf')
  };
}

/**
 * Creates a GeneratePresignedUrlRequest for testing
 * @param overrides - Optional overrides for the request
 * @returns GeneratePresignedUrlRequest with test data
 */
export function generatePresignedUrlRequest(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId || TestUtils.generateSignerId(),
    documentKey: overrides.documentKey || S3Key.fromString('envelopes/test-envelope/signers/test-signer/document.pdf'),
    operation: overrides.operation || { isGet: () => true, isPut: () => false, getValue: () => 'GET' },
    expiresIn: overrides.expiresIn || 3600
  };
}

/**
 * Creates a DocumentResult for testing
 * @param overrides - Optional overrides for the result
 * @returns DocumentResult with test data
 */
export function documentResult(overrides: any = {}) {
  return {
    documentKey: overrides.documentKey || 'envelopes/test-envelope/signers/test-signer/document.pdf',
    s3Location: overrides.s3Location || 's3://test-bucket/envelopes/test-envelope/signers/test-signer/document.pdf',
    contentType: overrides.contentType || 'application/pdf',
    size: overrides.size || 1024,
    lastModified: overrides.lastModified || new Date('2024-01-01T10:00:00Z')
  };
}

/**
 * Creates S3Service configuration for testing
 * @param overrides - Optional overrides for the configuration
 * @returns S3Service configuration with test data
 */
export function s3ServiceConfig(overrides: any = {}) {
  return {
    documentDownload: {
      maxExpirationSeconds: overrides.maxExpirationSeconds || 86400, // 24 hours
      minExpirationSeconds: overrides.minExpirationSeconds || 300    // 5 minutes
    }
  };
}

/**
 * Creates a signed document storage request for testing
 * @param overrides - Optional overrides for the request
 * @returns Signed document storage request with test data
 */
export function storeSignedDocumentRequest(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || TestUtils.generateEnvelopeId(),
    signerId: overrides.signerId || TestUtils.generateSignerId(),
    signedDocumentContent: overrides.signedDocumentContent || Buffer.from('signed document content'),
    contentType: overrides.contentType || 'application/pdf'
  };
}

/**
 * Creates a download action request for testing
 * @param overrides - Optional overrides for the request
 * @returns Download action request with test data
 */
export function downloadActionRequest(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || 'test-envelope-id',
    userId: overrides.userId || 'test-user-id',
    userEmail: overrides.userEmail || 'test@example.com',
    s3Key: overrides.s3Key || 'envelopes/test-envelope/signers/test-signer/signed-document.pdf',
    ipAddress: overrides.ipAddress || generateTestIpAddress(),
    userAgent: overrides.userAgent || 'TestAgent/1.0',
    country: overrides.country || 'US'
  };
}

/**
 * Creates document info for testing
 * @param overrides - Optional overrides for the info
 * @returns Document info with test data
 */
export function documentInfo(overrides: any = {}) {
  return {
    filename: overrides.filename || 'test-document.pdf',
    contentType: overrides.contentType || 'application/pdf',
    size: overrides.size || 1024
  };
}

/**
 * Creates S3 head object result for testing
 * @param overrides - Optional overrides for the result
 * @returns S3 head object result with test data
 */
export function s3HeadObjectResult(overrides: any = {}) {
  return {
    exists: overrides.exists === undefined ? true : overrides.exists,
    size: overrides.size || 1024,
    lastModified: overrides.lastModified || new Date('2024-01-01T10:00:00Z'),
    metadata: overrides.metadata || {
      contentType: 'application/pdf',
      envelopeId: 'test-envelope-id',
      signerId: 'test-signer-id'
    }
  };
}

/**
 * Creates S3 presigned URL for testing
 * @param overrides - Optional overrides for the URL
 * @returns Presigned URL with test data
 */
export function presignedUrl(overrides: any = {}) {
  return overrides.url || 'https://test-bucket.s3.amazonaws.com/test-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...';
}

/**
 * Creates S3 key for testing
 * @param overrides - Optional overrides for the key
 * @returns S3Key with test data
 */
export function s3Key(overrides: any = {}) {
  return S3Key.fromString(overrides.value || 'envelopes/test-envelope/signers/test-signer/document.pdf');
}

/**
 * Creates document metadata for testing
 * @param overrides - Optional overrides for the metadata
 * @returns Document metadata with test data
 */
export function documentMetadata(overrides: any = {}) {
  return {
    envelopeId: overrides.envelopeId || 'test-envelope-id',
    signerId: overrides.signerId || 'test-signer-id',
    documentType: overrides.documentType || DocumentType.SIGNED,
    checksum: overrides.checksum || 'sha256:test-checksum',
    originalFileName: overrides.originalFileName || 'test-document.pdf'
  };
}
