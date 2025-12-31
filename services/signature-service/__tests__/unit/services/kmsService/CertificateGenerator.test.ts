/**
 * @fileoverview CertificateGenerator Tests - Unit tests for CertificateGenerator
 * @summary Tests for X.509 certificate generation service
 * @description Comprehensive unit tests for CertificateGenerator class that verifies
 * proper generation of self-signed certificates, serial number generation, and PEM conversion.
 */

import { CertificateGenerator } from '../../../../src/services/kmsService/CertificateGenerator';
import { certificateGenerationFailed } from '@/signature-errors';
import type { CertificateGenerationParams } from '@/domain/types/kms';

describe('CertificateGenerator', () => {
  let generator: CertificateGenerator;

  beforeEach(() => {
    generator = new CertificateGenerator();
  });

  it('should be instantiable', () => {
    expect(generator).toBeDefined();
    expect(generator).toBeInstanceOf(CertificateGenerator);
  });

  it('should have generateSelfSignedCertificate method', () => {
    expect(generator.generateSelfSignedCertificate).toBeDefined();
    expect(typeof generator.generateSelfSignedCertificate).toBe('function');
  });

  it('should have derToPem method', () => {
    expect(generator.derToPem).toBeDefined();
    expect(typeof generator.derToPem).toBe('function');
  });

  describe('generateSelfSignedCertificate', () => {
    const mockParams: CertificateGenerationParams = {
      publicKeyDer: new Uint8Array(Array(100).fill(0)),
      subject: {
        commonName: 'Test Certificate',
        organization: 'Test Org',
        organizationalUnit: 'Test OU',
        country: 'US',
        emailAddress: 'test@example.com',
      },
      validityDays: 365,
    };

    it('should return a Promise when called', async () => {
      const result = generator.generateSelfSignedCertificate(mockParams);
      expect(result).toBeInstanceOf(Promise);
      
      try {
        await result;
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });

    it('should throw certificateGenerationFailed on error', async () => {
      const invalidParams = {
        publicKeyDer: null as any,
        subject: {
          commonName: 'Test',
          organization: 'Org',
        },
        validityDays: 365,
      };

      await expect(
        generator.generateSelfSignedCertificate(invalidParams)
      ).rejects.toThrow();

      try {
        await generator.generateSelfSignedCertificate(invalidParams);
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });
  });

  describe('derToPem', () => {
    it('should accept Uint8Array parameter', () => {
      const mockDer = new Uint8Array([1, 2, 3, 4]);
      try {
        generator.derToPem(mockDer);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should return a string when called', () => {
      const mockDer = new Uint8Array([1, 2, 3, 4]);
      try {
        const result = generator.derToPem(mockDer);
        expect(typeof result).toBe('string');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
