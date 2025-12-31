/**
 * @fileoverview Pkcs7Builder Tests - Unit tests for PKCS#7 SignedData building
 * @summary Tests for PKCS#7/CMS SignedData structure construction
 * @description Tests the Pkcs7Builder service that builds PKCS#7 SignedData structures
 * for PDF digital signatures.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Pkcs7Builder } from '../../../../src/services/pdfService/Pkcs7Builder';
import { createMockCertificateChain, createMockSignatureBytes, createMockSignerInfo } from '../../../helpers/pdfTestHelpers';
import { pdfSignatureEmbeddingFailed } from '../../../../src/signature-errors';
import * as x509 from '@peculiar/x509';

describe('Pkcs7Builder', () => {
  let builder: Pkcs7Builder;

  beforeEach(() => {
    builder = new Pkcs7Builder();
  });

  describe('buildSignedData', () => {
    it('should build PKCS#7 SignedData with valid parameters', async () => {
      const certificateChain = createMockCertificateChain(1);
      const signatureBytes = createMockSignatureBytes(256);
      const documentHash = new Uint8Array(32);
      const signerInfo = createMockSignerInfo();
      const timestamp = new Date('2023-01-01T10:00:00Z');

      const params = {
        signatureBytes,
        certificateChain,
        signerInfo,
        timestamp,
        documentHash,
      };

      const result = await builder.buildSignedData(params);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error when certificate chain is empty', async () => {
      const params = {
        signatureBytes: createMockSignatureBytes(),
        certificateChain: [],
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      await expect(builder.buildSignedData(params)).rejects.toThrow(
        pdfSignatureEmbeddingFailed('Certificate chain is required for PKCS#7 SignedData')
      );
    });

    it('should handle certificate parsing errors', async () => {
      const invalidCert = new Uint8Array([0, 1, 2, 3]);
      const params = {
        signatureBytes: createMockSignatureBytes(),
        certificateChain: [invalidCert],
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      await expect(builder.buildSignedData(params)).rejects.toThrow();
    });

    it('should build SignedData with multiple certificates', async () => {
      const certificateChain = createMockCertificateChain(3);
      const params = {
        signatureBytes: createMockSignatureBytes(),
        certificateChain,
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      const result = await builder.buildSignedData(params);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include signer info in SignedData', async () => {
      const certificateChain = createMockCertificateChain(1);
      const signerInfo = createMockSignerInfo({
        name: 'Test Signer',
        email: 'test@example.com',
        location: 'US',
        reason: 'I agree',
      });
      const params = {
        signatureBytes: createMockSignatureBytes(),
        certificateChain,
        signerInfo,
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      const result = await builder.buildSignedData(params);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different signature byte sizes', async () => {
      const certificateChain = createMockCertificateChain(1);
      const signatureBytes = createMockSignatureBytes(512);
      const params = {
        signatureBytes,
        certificateChain,
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      const result = await builder.buildSignedData(params);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should wrap errors in pdfSignatureEmbeddingFailed', async () => {
      const params = {
        signatureBytes: createMockSignatureBytes(),
        certificateChain: [new Uint8Array([255, 255, 255])],
        signerInfo: createMockSignerInfo(),
        timestamp: new Date(),
        documentHash: new Uint8Array(32),
      };

      await expect(builder.buildSignedData(params)).rejects.toThrow();
      
      try {
        await builder.buildSignedData(params);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe('PDF_SIGNATURE_EMBEDDING_FAILED');
      }
    });
  });
});

