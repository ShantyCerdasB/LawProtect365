/**
 * @fileoverview Unit tests for Consent entity
 * @summary Tests for consent management and legal compliance validation
 * @description Comprehensive test suite for Consent entity covering all business logic,
 * validation rules, and edge cases for ESIGN Act/UETA compliance.
 */

import { Consent } from '../../../../src/domain/entities/Consent';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { ConsentId } from '../../../../src/domain/value-objects/ConsentId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import {
  consentNotGiven,
  consentTimestampRequired,
  consentTextRequired,
  consentIpRequired,
  consentUserAgentRequired
} from '../../../../src/signature-errors';
import { TestUtils, TEST_CONSTANTS } from '../../../helpers/testUtils';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';
import { consentEntity, consentPersistenceRow } from '../../../helpers/builders/consent';
import { fixedNow, resetTime } from '../../../helpers/time';

// Helper function to create Consent with custom parameters
function createConsentWithParams(params: {
  id?: string;
  envelopeId?: string;
  signerId?: string;
  signatureId?: string;
  consentGiven?: boolean;
  consentTimestamp?: Date;
  consentText?: string;
  createdAt?: Date;
  updatedAt?: Date;
} & NetworkSecurityContext): Consent {
  return new Consent(
    new ConsentId(params.id || TestUtils.generateUuid()),
    new EnvelopeId(params.envelopeId || TestUtils.generateUuid()),
    new SignerId(params.signerId || TestUtils.generateUuid()),
    params.signatureId ? new SignerId(params.signatureId) : undefined,
    params.consentGiven ?? true,
    params.consentTimestamp || new Date('2024-01-01T00:00:00Z'),
    params.consentText || 'I consent to electronic signing',
    params.ipAddress || generateTestIpAddress(),
    params.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    params.country || undefined,
    params.createdAt || new Date('2024-01-01T00:00:00Z'),
    params.updatedAt || new Date('2024-01-01T00:00:00Z')
  );
}

describe('Consent', () => {
  describe('Constructor and Getters', () => {
    it('should create consent with all properties', () => {
      const id = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const signerId = TestUtils.generateUuid();
      const signatureId = TestUtils.generateUuid();
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-01T00:00:00Z');
      const ipAddress = generateTestIpAddress();

      const consent = createConsentWithParams({
        id,
        envelopeId,
        signerId,
        signatureId,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I agree to electronic signing',
        ipAddress: ipAddress,
        userAgent: 'Chrome/91.0.4472.124',
        createdAt,
        updatedAt
      });

      expect(consent.getId().getValue()).toBe(id);
      expect(consent.getEnvelopeId().getValue()).toBe(envelopeId);
      expect(consent.getSignerId().getValue()).toBe(signerId);
      expect(consent.getSignatureId()?.getValue()).toBe(signatureId);
      expect(consent.getConsentGiven()).toBe(true);
      expect(consent.getConsentTimestamp()).toEqual(consentTimestamp);
      expect(consent.getConsentText()).toBe('I agree to electronic signing');
      expect(consent.getIpAddress()).toBe(ipAddress);
      expect(consent.getUserAgent()).toBe('Chrome/91.0.4472.124');
      expect(consent.getCreatedAt()).toEqual(createdAt);
      expect(consent.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should create consent with minimal properties', () => {
      const ipAddress = generateTestIpAddress();
      const consent = createConsentWithParams({
        consentGiven: false,
        consentText: 'I do not consent',
        ipAddress: ipAddress,
        userAgent: 'Test Agent'
      });

      expect(consent.getConsentGiven()).toBe(false);
      expect(consent.getConsentText()).toBe('I do not consent');
      expect(consent.getIpAddress()).toBe(ipAddress);
      expect(consent.getUserAgent()).toBe('Test Agent');
      expect(consent.getSignatureId()).toBeUndefined();
    });

    it('should handle consent without signature ID', () => {
      const consent = createConsentWithParams({
        signatureId: undefined
      });

      expect(consent.getSignatureId()).toBeUndefined();
    });
  });

  describe('Static Factory Methods', () => {
    it('should create consent using static create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const signatureId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');
      const ipAddress = generateTestIpAddress();

      const consent = Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: ipAddress,
        userAgent: 'Firefox/89.0'
      });

      expect(consent.getId()).toBe(id);
      expect(consent.getEnvelopeId()).toBe(envelopeId);
      expect(consent.getSignerId()).toBe(signerId);
      expect(consent.getSignatureId()).toBe(signatureId);
      expect(consent.getConsentGiven()).toBe(true);
      expect(consent.getConsentTimestamp()).toEqual(consentTimestamp);
      expect(consent.getConsentText()).toBe('I consent to electronic signing');
      expect(consent.getIpAddress()).toBe(ipAddress);
      expect(consent.getUserAgent()).toBe('Firefox/89.0');
      expect(consent.getCreatedAt()).toBeInstanceOf(Date);
      expect(consent.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create consent without signature ID using static create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      const consent = Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Safari/14.1'
      });

      expect(consent.getSignatureId()).toBeUndefined();
      expect(consent.getConsentGiven()).toBe(true);
    });

    it('should throw error when consentGiven is false in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: false,
        consentTimestamp,
        consentText: 'I do not consent',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Safari/14.1'
      })).toThrow(consentNotGiven('Consent must be given for legal compliance'));
    });

    it('should throw error when consentTimestamp is missing in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp: null as any,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Safari/14.1'
      })).toThrow(consentTimestampRequired('Consent timestamp is required for legal compliance'));
    });

    it('should throw error when consentText is empty in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: '',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Safari/14.1'
      })).toThrow(consentTextRequired('Consent text is required for legal compliance'));
    });

    it('should throw error when consentText is only whitespace in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: '   ',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Safari/14.1'
      })).toThrow(consentTextRequired('Consent text is required for legal compliance'));
    });

    it('should throw error when ipAddress is empty in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: '',
        userAgent: 'Safari/14.1'
      })).toThrow(consentIpRequired('IP address is required for legal compliance'));
    });

    it('should throw error when ipAddress is only whitespace in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: '   ',
        userAgent: 'Safari/14.1'
      })).toThrow(consentIpRequired('IP address is required for legal compliance'));
    });

    it('should throw error when userAgent is empty in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: ''
      })).toThrow(consentUserAgentRequired('User agent is required for legal compliance'));
    });

    it('should throw error when userAgent is only whitespace in create method', () => {
      const id = new ConsentId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const signerId = new SignerId(TestUtils.generateUuid());
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');

      expect(() => Consent.create({
        id,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: '   '
      })).toThrow(consentUserAgentRequired('User agent is required for legal compliance'));
    });
  });

  describe('Link with Signature', () => {
    it('should link consent with signature successfully', () => {
      const originalConsent = createConsentWithParams({
        signatureId: undefined
      });

      const signatureId = new SignerId(TestUtils.generateUuid());
      const linkedConsent = originalConsent.linkWithSignature(signatureId);

      expect(linkedConsent.getSignatureId()).toBe(signatureId);
      expect(linkedConsent.getId()).toBe(originalConsent.getId());
      expect(linkedConsent.getEnvelopeId()).toBe(originalConsent.getEnvelopeId());
      expect(linkedConsent.getSignerId()).toBe(originalConsent.getSignerId());
      expect(linkedConsent.getConsentGiven()).toBe(originalConsent.getConsentGiven());
      expect(linkedConsent.getConsentTimestamp()).toBe(originalConsent.getConsentTimestamp());
      expect(linkedConsent.getConsentText()).toBe(originalConsent.getConsentText());
      expect(linkedConsent.getIpAddress()).toBe(originalConsent.getIpAddress());
      expect(linkedConsent.getUserAgent()).toBe(originalConsent.getUserAgent());
      expect(linkedConsent.getCreatedAt()).toBe(originalConsent.getCreatedAt());
      expect(linkedConsent.getUpdatedAt()).not.toBe(originalConsent.getUpdatedAt());
    });

    it('should update signature ID when linking with new signature', () => {
      const originalSignatureId = new SignerId(TestUtils.generateUuid());
      const originalConsent = createConsentWithParams({
        signatureId: originalSignatureId.getValue()
      });

      const newSignatureId = new SignerId(TestUtils.generateUuid());
      const linkedConsent = originalConsent.linkWithSignature(newSignatureId);

      expect(linkedConsent.getSignatureId()).toBe(newSignatureId);
      expect(linkedConsent.getSignatureId()).not.toBe(originalSignatureId);
    });
  });

  describe('Legal Compliance Validation', () => {
    it('should validate consent given successfully', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should throw error when consent not given', () => {
      const consent = createConsentWithParams({
        consentGiven: false,
        consentText: 'I do not consent',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance())
        .toThrow(consentNotGiven('Consent must be given for legal compliance'));
    });

    it('should throw error when consent timestamp is missing', () => {
      // Create a consent with a valid timestamp, then manually set it to null to test validation
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      // Manually override the timestamp to null to test the validation
      (consent as any).consentTimestamp = null;

      expect(() => consent.validateForCompliance())
        .toThrow(consentTimestampRequired('Consent timestamp is required for legal compliance'));
    });

    it('should throw error when consent text is empty', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      // Manually override the consent text to empty to test the validation
      (consent as any).consentText = '';

      expect(() => consent.validateForCompliance())
        .toThrow(consentTextRequired('Consent text is required for legal compliance'));
    });

    it('should throw error when consent text is only whitespace', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: '   ',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance())
        .toThrow(consentTextRequired('Consent text is required for legal compliance'));
    });

    it('should throw error when IP address is empty', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      // Manually override the IP address to empty to test the validation
      (consent as any).ipAddress = '';

      expect(() => consent.validateForCompliance())
        .toThrow(consentIpRequired('IP address is required for legal compliance'));
    });

    it('should throw error when IP address is only whitespace', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: '   ',
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance())
        .toThrow(consentIpRequired('IP address is required for legal compliance'));
    });

    it('should throw error when user agent is empty', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      // Manually override the user agent to empty to test the validation
      (consent as any).userAgent = '';

      expect(() => consent.validateForCompliance())
        .toThrow(consentUserAgentRequired('User agent is required for legal compliance'));
    });

    it('should throw error when user agent is only whitespace', () => {
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: '   '
      });

      expect(() => consent.validateForCompliance())
        .toThrow(consentUserAgentRequired('User agent is required for legal compliance'));
    });

    it('should validate consent with long consent text', () => {
      const longConsentText = 'I hereby consent to the use of electronic signatures and electronic records in connection with this transaction. I understand that my electronic signature has the same legal effect as a handwritten signature and that I may request a paper copy of this document at any time.';
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: longConsentText,
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should validate consent with special characters in text', () => {
      const specialConsentText = 'I consent to electronic signing! @#$%^&*()_+-=[]{}|;:,.<>?';
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: specialConsentText,
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(() => consent.validateForCompliance()).not.toThrow();
    });
  });

  describe('Serialization', () => {
    it('should serialize consent to JSON with all fields', () => {
      const id = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const signerId = TestUtils.generateUuid();
      const signatureId = TestUtils.generateUuid();
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-01T00:00:00Z');

      const ipAddress = generateTestIpAddress();
      
      const consent = createConsentWithParams({
        id,
        envelopeId,
        signerId,
        signatureId,
        consentGiven: true,
        consentTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress,
        userAgent: 'Mozilla/5.0',
        createdAt,
        updatedAt
      });

      const json = consent.toJSON();

      expect(json).toEqual({
        id,
        envelopeId,
        signerId,
        signatureId,
        consentGiven: true,
        consentTimestamp: consentTimestamp.toISOString(),
        consentText: 'I consent to electronic signing',
        ipAddress,
        userAgent: 'Mozilla/5.0',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      });
    });

    it('should serialize consent to JSON without signature ID', () => {
      const ipAddress = generateTestIpAddress();
      const consent = createConsentWithParams({
        signatureId: undefined,
        consentGiven: false,
        consentText: 'I do not consent',
        ipAddress: ipAddress,
        userAgent: 'Test Agent'
      });

      const json = consent.toJSON();

      expect(json.signatureId).toBeUndefined();
      expect(json.consentGiven).toBe(false);
      expect(json.consentText).toBe('I do not consent');
      expect(json.ipAddress).toBe(ipAddress);
      expect(json.userAgent).toBe('Test Agent');
    });

    it('should serialize timestamps as ISO strings', () => {
      const consentTimestamp = new Date('2024-01-01T10:00:00Z');
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-01T00:00:00Z');

      const consent = createConsentWithParams({
        consentTimestamp,
        createdAt,
        updatedAt
      });

      const json = consent.toJSON();

      expect(json.consentTimestamp).toBe('2024-01-01T10:00:00.000Z');
      expect(json.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(json.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle consent with very long IP address', () => {
      const longIpAddress = TEST_CONSTANTS.IPV6_TEST_ADDRESS; // IPv6
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: longIpAddress,
        userAgent: 'Mozilla/5.0'
      });

      expect(consent.getIpAddress()).toBe(longIpAddress);
      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should handle consent with very long user agent', () => {
      const longUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: longUserAgent
      });

      expect(consent.getUserAgent()).toBe(longUserAgent);
      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should handle consent with unicode characters in text', () => {
      const unicodeConsentText = 'I consent to electronic signing. 我同意电子签名。';
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentText: unicodeConsentText,
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(consent.getConsentText()).toBe(unicodeConsentText);
      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should handle consent with future timestamp', () => {
      const futureTimestamp = new Date(Date.now() + 86400000); // 1 day in the future
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentTimestamp: futureTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(consent.getConsentTimestamp()).toEqual(futureTimestamp);
      expect(() => consent.validateForCompliance()).not.toThrow();
    });

    it('should handle consent with past timestamp', () => {
      const pastTimestamp = new Date(Date.now() - 86400000); // 1 day in the past
      
      const consent = createConsentWithParams({
        consentGiven: true,
        consentTimestamp: pastTimestamp,
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0'
      });

      expect(consent.getConsentTimestamp()).toEqual(pastTimestamp);
      expect(() => consent.validateForCompliance()).not.toThrow();
    });
  });

  describe('fromPersistence', () => {
    it('should create consent from persistence data with all fields', () => {
      const persistenceData = consentPersistenceRow({
        id: TestUtils.generateUuid(),
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        signatureId: TestUtils.generateUuid(),
        consentGiven: true,
        consentTimestamp: '2024-01-01T10:00:00.000Z',
        consentText: 'I consent to electronic signing',
        ipAddress: generateTestIpAddress(),
        userAgent: 'Mozilla/5.0',
        country: 'US',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      });

      const consent = Consent.fromPersistence(persistenceData);

      expect(consent.getId().getValue()).toBe(persistenceData.id);
      expect(consent.getEnvelopeId().getValue()).toBe(persistenceData.envelopeId);
      expect(consent.getSignerId().getValue()).toBe(persistenceData.signerId);
      expect(consent.getSignatureId()?.getValue()).toBe(persistenceData.signatureId);
      expect(consent.getConsentGiven()).toBe(true);
      expect(consent.getConsentTimestamp()).toEqual(new Date(persistenceData.consentTimestamp));
      expect(consent.getConsentText()).toBe(persistenceData.consentText);
      expect(consent.getIpAddress()).toBe(persistenceData.ipAddress);
      expect(consent.getUserAgent()).toBe(persistenceData.userAgent);
      expect(consent.getCountry()).toBe(persistenceData.country);
      expect(consent.getCreatedAt()).toEqual(new Date(persistenceData.createdAt));
      expect(consent.getUpdatedAt()).toEqual(new Date(persistenceData.updatedAt));
    });

    it('should create consent from persistence data without signature ID', () => {
      const persistenceData = consentPersistenceRow({
        signatureId: null,
        consentGiven: false
      });

      const consent = Consent.fromPersistence(persistenceData);

      expect(consent.getSignatureId()).toBeUndefined();
      expect(consent.getConsentGiven()).toBe(false);
    });

    it('should create consent from persistence data with null country', () => {
      const persistenceData = consentPersistenceRow({
        country: undefined
      });

      const consent = Consent.fromPersistence(persistenceData);

      expect(consent.getCountry()).toBe(undefined);
    });

    it('should handle boolean conversion for consentGiven', () => {
      const persistenceData = consentPersistenceRow({
        consentGiven: 'true' as any
      });

      const consent = Consent.fromPersistence(persistenceData);

      expect(consent.getConsentGiven()).toBe(true);
    });

    it('should handle boolean conversion for consentGiven false', () => {
      const persistenceData = consentPersistenceRow({
        consentGiven: 0 as any
      });

      const consent = Consent.fromPersistence(persistenceData);

      expect(consent.getConsentGiven()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize consent with country as undefined', () => {
      const consent = createConsentWithParams({
        country: undefined
      });

      const json = consent.toJSON();

      expect(json.country).toBeUndefined();
    });

    it('should serialize consent with country as null', () => {
      const consent = createConsentWithParams({
        country: undefined
      });

      const json = consent.toJSON();

      expect(json.country).toBeUndefined();
    });
  });

  describe('Idempotent Operations', () => {
    it('should return same instance when linking with same signature ID', () => {
      const signatureId = new SignerId(TestUtils.generateUuid());
      const consent = consentEntity({
        signatureId: signatureId.getValue()
      });

      const linkedConsent = consent.linkWithSignature(signatureId);

      expect(linkedConsent).toBe(consent);
    });
  });
});
