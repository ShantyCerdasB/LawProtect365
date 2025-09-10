/**
 * @file test-data.ts
 * @summary Test data fixtures for signing integration tests
 * @description Contains all test data needed for signing workflow tests
 */

export const TEST_ENVELOPE = {
  name: 'Test Signing Envelope',
  description: 'Integration test envelope for signing workflow',
  creatorId: 'test-creator-123',
  creatorEmail: 'creator@test.com',
  metadata: {
    testType: 'integration',
    environment: 'test'
  }
};

export const TEST_DOCUMENT = {
  name: 'test-document.pdf',
  contentType: 'application/pdf',
  pageCount: 1,
  metadata: {
    testDocument: true,
    createdFor: 'integration-test'
  }
};

export const TEST_PARTY = {
  name: 'Test Signer',
  email: 'signer@test.com',
  role: 'signer',
  status: 'invited',
  preferences: {
    defaultAuth: 'otpViaEmail',
    defaultLocale: 'en-US'
  },
  metadata: {
    testParty: true
  }
};

export const TEST_CONSENT = {
  consentText: 'I consent to electronically sign this document and understand that my electronic signature has the same legal effect as a handwritten signature.',
  consentGiven: true,
  metadata: {
    testConsent: true,
    consentVersion: '1.0'
  }
};

export const TEST_SIGNING = {
  algorithm: 'ECDSA_SHA_256',
  keyId: 'test-key-id',
  metadata: {
    testSigning: true,
    signingMethod: 'integration-test'
  }
};

export const TEST_AUDIT = {
  expectedEvents: [
    'envelope.created',
    'document.created',
    'party.created',
    'consent.recorded',
    'signing.prepared',
    'signing.completed',
    'signing.download_signed_document'
  ]
};

export const TEST_ERRORS = {
  invalidEnvelope: {
    envelopeId: 'non-existent-envelope',
    expectedStatus: 404
  },
  invalidParty: {
    partyId: 'non-existent-party',
    expectedStatus: 404
  },
  invalidDigest: {
    digest: { alg: 'sha256', value: 'invalid-digest' },
    expectedStatus: 422
  },
  missingConsent: {
    expectedStatus: 400
  }
};
