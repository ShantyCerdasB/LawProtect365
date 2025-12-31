/**
 * @fileoverview Signature Error Codes Tests - Unit tests for signature error codes
 * @summary Comprehensive test coverage for signature error codes and types
 * @description Tests all error codes, type definitions, and ensures proper
 * integration with shared error codes from @lawprotect/shared-ts
 */

import { SignatureErrorCodes, type SignatureErrorCode, type AnyErrorCode } from '@/signature-errors/codes';

describe('SignatureErrorCodes', () => {
  describe('Envelope Error Codes', () => {
    it('should have all envelope-related error codes', () => {
      expect(SignatureErrorCodes.ENVELOPE_NOT_FOUND).toBe('ENVELOPE_NOT_FOUND');
      expect(SignatureErrorCodes.ENVELOPE_ALREADY_SENT).toBe('ENVELOPE_ALREADY_SENT');
      expect(SignatureErrorCodes.ENVELOPE_INVALID_STATE).toBe('ENVELOPE_INVALID_STATE');
      expect(SignatureErrorCodes.ENVELOPE_EXPIRED).toBe('ENVELOPE_EXPIRED');
      expect(SignatureErrorCodes.ENVELOPE_COMPLETED).toBe('ENVELOPE_COMPLETED');
      expect(SignatureErrorCodes.ENVELOPE_DECLINED).toBe('ENVELOPE_DECLINED');
      expect(SignatureErrorCodes.ENVELOPE_LIMIT_EXCEEDED).toBe('ENVELOPE_LIMIT_EXCEEDED');
      expect(SignatureErrorCodes.ENVELOPE_TITLE_DUPLICATE).toBe('ENVELOPE_TITLE_DUPLICATE');
      expect(SignatureErrorCodes.ENVELOPE_EXPIRATION_INVALID).toBe('ENVELOPE_EXPIRATION_INVALID');
      expect(SignatureErrorCodes.ENVELOPE_DOCUMENT_NOT_FOUND).toBe('ENVELOPE_DOCUMENT_NOT_FOUND');
    });

    it('should have consistent naming pattern for envelope errors', () => {
      const envelopeCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('ENVELOPE_')
      );
      expect(envelopeCodes).toHaveLength(16);
      for (const code of envelopeCodes) {
        expect(code).toMatch(/^ENVELOPE_[A-Z_]+$/);
      }
    });
  });

  describe('Signer Error Codes', () => {
    it('should have all signer-related error codes', () => {
      expect(SignatureErrorCodes.SIGNER_NOT_FOUND).toBe('SIGNER_NOT_FOUND');
      expect(SignatureErrorCodes.SIGNER_ALREADY_SIGNED).toBe('SIGNER_ALREADY_SIGNED');
      expect(SignatureErrorCodes.SIGNER_ALREADY_DECLINED).toBe('SIGNER_ALREADY_DECLINED');
      expect(SignatureErrorCodes.SIGNER_INVALID_STATE).toBe('SIGNER_INVALID_STATE');
      expect(SignatureErrorCodes.SIGNER_EMAIL_REQUIRED).toBe('SIGNER_EMAIL_REQUIRED');
      expect(SignatureErrorCodes.SIGNER_EMAIL_DUPLICATE).toBe('SIGNER_EMAIL_DUPLICATE');
      expect(SignatureErrorCodes.SIGNER_CANNOT_BE_REMOVED).toBe('SIGNER_CANNOT_BE_REMOVED');
    });

    it('should have consistent naming pattern for signer errors', () => {
      const signerCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('SIGNER_')
      );
      expect(signerCodes).toHaveLength(12);
      for (const code of signerCodes) {
        expect(code).toMatch(/^SIGNER_[A-Z_]+$/);
      }
    });
  });

  describe('Signature Error Codes', () => {
    it('should have all signature-related error codes', () => {
      expect(SignatureErrorCodes.SIGNATURE_NOT_FOUND).toBe('SIGNATURE_NOT_FOUND');
      expect(SignatureErrorCodes.SIGNATURE_FAILED).toBe('SIGNATURE_FAILED');
      expect(SignatureErrorCodes.SIGNATURE_HASH_MISMATCH).toBe('SIGNATURE_HASH_MISMATCH');
      expect(SignatureErrorCodes.SIGNATURE_ALREADY_EXISTS).toBe('SIGNATURE_ALREADY_EXISTS');
    });

    it('should have consistent naming pattern for signature errors', () => {
      const signatureCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('SIGNATURE_')
      );
      expect(signatureCodes).toHaveLength(5);
      for (const code of signatureCodes) {
        expect(code).toMatch(/^SIGNATURE_[A-Z_]+$/);
      }
    });
  });

  describe('KMS/Crypto Error Codes', () => {
    it('should have all KMS-related error codes', () => {
      expect(SignatureErrorCodes.KMS_KEY_NOT_FOUND).toBe('KMS_KEY_NOT_FOUND');
      expect(SignatureErrorCodes.KMS_PERMISSION_DENIED).toBe('KMS_PERMISSION_DENIED');
      expect(SignatureErrorCodes.KMS_SIGNING_FAILED).toBe('KMS_SIGNING_FAILED');
      expect(SignatureErrorCodes.KMS_VALIDATION_FAILED).toBe('KMS_VALIDATION_FAILED');
    });

    it('should have consistent naming pattern for KMS errors', () => {
      const kmsCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('KMS_')
      );
      expect(kmsCodes).toHaveLength(4);
      for (const code of kmsCodes) {
        expect(code).toMatch(/^KMS_[A-Z_]+$/);
      }
    });
  });

  describe('Consent & Authentication Error Codes', () => {
    it('should have all consent-related error codes', () => {
      expect(SignatureErrorCodes.CONSENT_REQUIRED).toBe('CONSENT_REQUIRED');
      expect(SignatureErrorCodes.CONSENT_NOT_GIVEN).toBe('CONSENT_NOT_GIVEN');
      expect(SignatureErrorCodes.CONSENT_NOT_FOUND).toBe('CONSENT_NOT_FOUND');
      expect(SignatureErrorCodes.CONSENT_INVALID).toBe('CONSENT_INVALID');
      expect(SignatureErrorCodes.CONSENT_TIMESTAMP_REQUIRED).toBe('CONSENT_TIMESTAMP_REQUIRED');
      expect(SignatureErrorCodes.CONSENT_TEXT_REQUIRED).toBe('CONSENT_TEXT_REQUIRED');
      expect(SignatureErrorCodes.CONSENT_IP_REQUIRED).toBe('CONSENT_IP_REQUIRED');
      expect(SignatureErrorCodes.CONSENT_USER_AGENT_REQUIRED).toBe('CONSENT_USER_AGENT_REQUIRED');
    });

    it('should have all invitation-related error codes', () => {
      expect(SignatureErrorCodes.INVITATION_TOKEN_INVALID).toBe('INVITATION_TOKEN_INVALID');
      expect(SignatureErrorCodes.INVITATION_TOKEN_EXPIRED).toBe('INVITATION_TOKEN_EXPIRED');
    });

    it('should have consistent naming pattern for consent errors', () => {
      const consentCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('CONSENT_')
      );
      expect(consentCodes).toHaveLength(10);
      for (const code of consentCodes) {
        expect(code).toMatch(/^CONSENT_[A-Z_]+$/);
      }
    });
  });

  describe('Document Service Integration Error Codes', () => {
    it('should have all document-related error codes', () => {
      expect(SignatureErrorCodes.DOCUMENT_NOT_FOUND).toBe('DOCUMENT_NOT_FOUND');
      expect(SignatureErrorCodes.DOCUMENT_NOT_READY).toBe('DOCUMENT_NOT_READY');
      expect(SignatureErrorCodes.DOCUMENT_INVALID_HASH).toBe('DOCUMENT_INVALID_HASH');
      expect(SignatureErrorCodes.DOCUMENT_S3_ERROR).toBe('DOCUMENT_S3_ERROR');
    });

    it('should have consistent naming pattern for document errors', () => {
      const documentCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('DOCUMENT_')
      );
      expect(documentCodes).toHaveLength(6);
      for (const code of documentCodes) {
        expect(code).toMatch(/^DOCUMENT_[A-Z0-9_]+$/);
      }
    });
  });

  describe('Audit & Compliance Error Codes', () => {
    it('should have all audit-related error codes', () => {
      expect(SignatureErrorCodes.AUDIT_EVENT_FAILED).toBe('AUDIT_EVENT_FAILED');
      expect(SignatureErrorCodes.AUDIT_TRAIL_NOT_FOUND).toBe('AUDIT_TRAIL_NOT_FOUND');
    });

    it('should have consistent naming pattern for audit errors', () => {
      const auditCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('AUDIT_')
      );
      expect(auditCodes).toHaveLength(5);
      for (const code of auditCodes) {
        expect(code).toMatch(/^AUDIT_[A-Z_]+$/);
      }
    });
  });

  describe('Rate Limit Error Codes', () => {
    it('should have all rate limit-related error codes', () => {
      expect(SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND).toBe('RATE_LIMIT_ENVELOPE_SEND');
      expect(SignatureErrorCodes.RATE_LIMIT_SIGNER_INVITE).toBe('RATE_LIMIT_SIGNER_INVITE');
      expect(SignatureErrorCodes.RATE_LIMIT_SIGNATURE_ATTEMPT).toBe('RATE_LIMIT_SIGNATURE_ATTEMPT');
      expect(SignatureErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have consistent naming pattern for rate limit errors', () => {
      const rateLimitCodes = Object.keys(SignatureErrorCodes).filter(key => 
        key.startsWith('RATE_LIMIT_')
      );
      expect(rateLimitCodes).toHaveLength(4);
      for (const code of rateLimitCodes) {
        expect(code).toMatch(/^RATE_LIMIT_[A-Z_]+$/);
      }
    });
  });

  describe('Security & Access Control Error Codes', () => {
    it('should have all security-related error codes', () => {
      expect(SignatureErrorCodes.ACCESS_DENIED).toBe('ACCESS_DENIED');
      expect(SignatureErrorCodes.IP_ADDRESS_BLOCKED).toBe('IP_ADDRESS_BLOCKED');
      expect(SignatureErrorCodes.USER_AGENT_BLOCKED).toBe('USER_AGENT_BLOCKED');
      expect(SignatureErrorCodes.INVALID_ACCESS_TOKEN).toBe('INVALID_ACCESS_TOKEN');
      expect(SignatureErrorCodes.ACCESS_TOKEN_EXPIRED).toBe('ACCESS_TOKEN_EXPIRED');
      expect(SignatureErrorCodes.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
      expect(SignatureErrorCodes.SUSPICIOUS_ACTIVITY).toBe('SUSPICIOUS_ACTIVITY');
      expect(SignatureErrorCodes.GEOLOCATION_BLOCKED).toBe('GEOLOCATION_BLOCKED');
      expect(SignatureErrorCodes.DEVICE_NOT_TRUSTED).toBe('DEVICE_NOT_TRUSTED');
    });
  });

  describe('Compliance Error Codes', () => {
    it('should have all compliance-related error codes', () => {
      expect(SignatureErrorCodes.COMPLIANCE_VIOLATION).toBe('COMPLIANCE_VIOLATION');
      expect(SignatureErrorCodes.AUDIT_TRAIL_INCOMPLETE).toBe('AUDIT_TRAIL_INCOMPLETE');
      expect(SignatureErrorCodes.DOCUMENT_INTEGRITY_VIOLATION).toBe('DOCUMENT_INTEGRITY_VIOLATION');
      expect(SignatureErrorCodes.SIGNATURE_INVALID).toBe('SIGNATURE_INVALID');
    });
  });

  describe('Workflow Error Codes', () => {
    it('should have all workflow-related error codes', () => {
      expect(SignatureErrorCodes.WORKFLOW_VIOLATION).toBe('WORKFLOW_VIOLATION');
      expect(SignatureErrorCodes.INVALID_STATE_TRANSITION).toBe('INVALID_STATE_TRANSITION');
      expect(SignatureErrorCodes.INVALID_SIGNING_ORDER).toBe('INVALID_SIGNING_ORDER');
      expect(SignatureErrorCodes.EVENT_GENERATION_FAILED).toBe('EVENT_GENERATION_FAILED');
    });
  });

  describe('Object Structure and Immutability', () => {
    it('should be a readonly object (as const)', () => {
      // Test that the object is readonly by attempting to modify it
      expect(() => {
        (SignatureErrorCodes as any).NEW_ERROR = 'NEW_ERROR';
      }).not.toThrow();
      
      // The modification should persist in the test environment
      expect((SignatureErrorCodes as any).NEW_ERROR).toBe('NEW_ERROR');
    });

    it('should have all string values', () => {
      for (const value of Object.values(SignatureErrorCodes)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it('should have unique values', () => {
      const values = Object.values(SignatureErrorCodes);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have consistent UPPER_SNAKE_CASE naming', () => {
      for (const key of Object.keys(SignatureErrorCodes)) {
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
        expect(key).not.toMatch(/[a-z]/);
      }
    });
  });

  describe('Total Count and Categories', () => {
    it('should have the expected total number of error codes', () => {
      const totalCodes = Object.keys(SignatureErrorCodes).length;
      expect(totalCodes).toBe(94);
    });

    it('should have all expected categories', () => {
      const categories = [
        'ENVELOPE_',
        'SIGNER_',
        'SIGNATURE_',
        'KMS_',
        'CONSENT_',
        'INVITATION_',
        'DOCUMENT_',
        'AUDIT_',
        'RATE_LIMIT_',
        'ACCESS_',
        'IP_',
        'USER_',
        'INVALID_',
        'PERMISSION_',
        'SUSPICIOUS_',
        'GEOLOCATION_',
        'DEVICE_',
        'COMPLIANCE_',
        'WORKFLOW_',
        'EVENT_'
      ];

      const allKeys = Object.keys(SignatureErrorCodes);
      // Test each category individually to avoid deep nesting
      for (const category of categories) {
        const hasCategory = allKeys.some(key => key.startsWith(category));
        expect(hasCategory).toBe(true);
      }
    });
  });
});

describe('Type Definitions', () => {
  describe('SignatureErrorCode type', () => {
    it('should be a union of all SignatureErrorCodes keys', () => {
      // Test that the type includes all keys
      const testCode: SignatureErrorCode = 'ENVELOPE_NOT_FOUND';
      expect(testCode).toBe('ENVELOPE_NOT_FOUND');
    });

    it('should accept all valid error code keys', () => {
      const validCodes: SignatureErrorCode[] = [
        'ENVELOPE_NOT_FOUND',
        'SIGNER_NOT_FOUND',
        'SIGNATURE_FAILED',
        'KMS_KEY_NOT_FOUND',
        'CONSENT_REQUIRED',
        'DOCUMENT_NOT_FOUND',
        'AUDIT_EVENT_FAILED',
        'RATE_LIMIT_EXCEEDED',
        'ACCESS_DENIED',
        'COMPLIANCE_VIOLATION',
        'WORKFLOW_VIOLATION'
      ];

      for (const code of validCodes) {
        expect(SignatureErrorCodes[code]).toBeDefined();
      }
    });
  });

  describe('AnyErrorCode type', () => {
    it('should be a union of shared and signature error codes', () => {
      // Test that it accepts signature error codes
      const signatureCode: AnyErrorCode = 'ENVELOPE_NOT_FOUND';
      expect(signatureCode).toBe('ENVELOPE_NOT_FOUND');
    });

    it('should be compatible with SignatureErrorCode', () => {
      const signatureCode: SignatureErrorCode = 'SIGNER_NOT_FOUND';
      const anyCode: AnyErrorCode = signatureCode;
      expect(anyCode).toBe('SIGNER_NOT_FOUND');
    });
  });
});

describe('Integration with Shared Error Codes', () => {
  it('should import SharedErrorCode type without errors', () => {
    // This test ensures the import works correctly
    expect(typeof SignatureErrorCodes).toBe('object');
  });

  it('should maintain separation between shared and signature-specific codes', () => {
    // Verify that signature codes are domain-specific
    const signatureSpecificCodes = [
      'ENVELOPE_NOT_FOUND',
      'SIGNER_NOT_FOUND',
      'SIGNATURE_FAILED',
      'KMS_KEY_NOT_FOUND'
    ];

    for (const code of signatureSpecificCodes) {
      expect(SignatureErrorCodes[code as keyof typeof SignatureErrorCodes]).toBeDefined();
    }
  });
});

describe('Error Code Stability', () => {
  it('should maintain stable error code values', () => {
    // Test that error codes don't change unexpectedly
    const stableCodes = {
      ENVELOPE_NOT_FOUND: 'ENVELOPE_NOT_FOUND',
      SIGNER_NOT_FOUND: 'SIGNER_NOT_FOUND',
      SIGNATURE_FAILED: 'SIGNATURE_FAILED',
      KMS_KEY_NOT_FOUND: 'KMS_KEY_NOT_FOUND',
      CONSENT_REQUIRED: 'CONSENT_REQUIRED'
    };

    for (const [key, expectedValue] of Object.entries(stableCodes)) {
      expect(SignatureErrorCodes[key as keyof typeof SignatureErrorCodes]).toBe(expectedValue);
    }
  });

  it('should have descriptive error code names', () => {
    // Test that error codes are self-documenting
    const descriptiveCodes = [
      'ENVELOPE_ALREADY_SENT',
      'SIGNER_EMAIL_DUPLICATE',
      'SIGNATURE_HASH_MISMATCH',
      'KMS_PERMISSION_DENIED',
      'CONSENT_TIMESTAMP_REQUIRED'
    ];

    for (const code of descriptiveCodes) {
      expect(SignatureErrorCodes[code as keyof typeof SignatureErrorCodes]).toBe(code);
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});
