/**
 * @fileoverview PdfSignatureDictionaryBuilder Tests - Unit tests for signature dictionary building
 * @summary Tests for PDF signature dictionary construction and serialization
 * @description Tests the PdfSignatureDictionaryBuilder service that builds and serializes
 * PDF signature dictionaries according to PDF 1.7 specification.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfSignatureDictionaryBuilder } from '../../../../src/services/pdfService/PdfSignatureDictionaryBuilder';
import type { SignatureDictionaryParams, SignatureDictionary } from '../../../../src/domain/types/pdf';

describe('PdfSignatureDictionaryBuilder', () => {
  let builder: PdfSignatureDictionaryBuilder;

  beforeEach(() => {
    builder = new PdfSignatureDictionaryBuilder();
  });

  describe('buildDictionary', () => {
    it('should build signature dictionary with all required fields', () => {
      const params: SignatureDictionaryParams = {
        signedDataDER: new Uint8Array([1, 2, 3, 4, 5]),
        byteRanges: [0, 100, 200, 300],
        signerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          location: 'US',
          reason: 'I agree',
        },
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = builder.buildDictionary(params);

      expect(result.Type).toBe('/Sig');
      expect(result.Filter).toBe('/Adobe.PPKLite');
      expect(result.SubFilter).toBe('/ETSI.CAdES.detached');
      expect(result.Contents).toContain('0102030405');
      expect(result.ByteRange).toEqual([0, 100, 200, 300]);
      expect(result.Name).toBe('John Doe');
      expect(result.Location).toBe('US');
      expect(result.Reason).toBe('I agree');
      expect(result.ContactInfo).toBe('john@example.com');
      expect(result.M).toMatch(/^D:\d{14}Z00'00'$/);
    });

    it('should build dictionary without optional fields when not provided', () => {
      const params: SignatureDictionaryParams = {
        signedDataDER: new Uint8Array([1, 2, 3]),
        byteRanges: [0, 50, 100, 150],
        signerInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = builder.buildDictionary(params);

      expect(result.Name).toBe('Jane Doe');
      expect(result.Location).toBeUndefined();
      expect(result.Reason).toBeUndefined();
      expect(result.ContactInfo).toBe('jane@example.com');
    });

    it('should convert signedDataDER to hex format', () => {
      const params: SignatureDictionaryParams = {
        signedDataDER: new Uint8Array([0xAB, 0xCD, 0xEF]),
        byteRanges: [0, 100, 200, 300],
        signerInfo: {
          name: 'Test',
          email: 'test@example.com',
        },
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = builder.buildDictionary(params);

      expect(result.Contents).toBe('<abcdef>');
    });

    it('should format timestamp correctly in PDF date format', () => {
      const date = new Date('2023-12-25T15:30:45Z');
      const params: SignatureDictionaryParams = {
        signedDataDER: new Uint8Array([1, 2, 3]),
        byteRanges: [0, 100, 200, 300],
        signerInfo: {
          name: 'Test',
          email: 'test@example.com',
        },
        timestamp: date,
      };

      const result = builder.buildDictionary(params);

      expect(result.M).toBe('D:20231225153045Z00\'00\'');
    });
  });

  describe('serializeToPdfObject', () => {
    it('should serialize dictionary to PDF object format', () => {
      const dict: SignatureDictionary = {
        Type: '/Sig',
        Filter: '/Adobe.PPKLite',
        SubFilter: '/ETSI.CAdES.detached',
        Contents: '<0102030405>',
        ByteRange: [0, 100, 200, 300],
        M: 'D:20230101100000Z00\'00\'',
        Name: 'John Doe',
        Location: 'US',
        Reason: 'I agree',
        ContactInfo: 'john@example.com',
      };

      const result = builder.serializeToPdfObject(dict, 10, 0);

      expect(result).toContain('10 0 obj');
      expect(result).toContain('/Type /Sig');
      expect(result).toContain('/Filter /Adobe.PPKLite');
      expect(result).toContain('/SubFilter /ETSI.CAdES.detached');
      expect(result).toContain('/Contents <0102030405>');
      expect(result).toContain('/ByteRange [0 100 200 300]');
      expect(result).toContain('/Location (US)');
      expect(result).toContain('/Reason (I agree)');
      expect(result).toContain('/ContactInfo (john@example.com)');
      expect(result).toContain('/M D:20230101100000Z00\'00\'');
      expect(result).toContain('/Name (John Doe)');
      expect(result).toContain('endobj');
    });

    it('should serialize dictionary without optional fields', () => {
      const dict: SignatureDictionary = {
        Type: '/Sig',
        Filter: '/Adobe.PPKLite',
        SubFilter: '/ETSI.CAdES.detached',
        Contents: '<010203>',
        ByteRange: [0, 50, 100, 150],
        M: 'D:20230101100000Z00\'00\'',
        Name: 'Jane Doe',
      };

      const result = builder.serializeToPdfObject(dict, 5, 0);

      expect(result).not.toContain('/Location');
      expect(result).not.toContain('/Reason');
      expect(result).not.toContain('/ContactInfo');
      expect(result).toContain('/Name (Jane Doe)');
    });

    it('should use custom generation number', () => {
      const dict: SignatureDictionary = {
        Type: '/Sig',
        Filter: '/Adobe.PPKLite',
        SubFilter: '/ETSI.CAdES.detached',
        Contents: '<010203>',
        ByteRange: [0, 50, 100, 150],
        M: 'D:20230101100000Z00\'00\'',
        Name: 'Test',
      };

      const result = builder.serializeToPdfObject(dict, 10, 5);

      expect(result).toContain('10 5 obj');
    });

    it('should escape special characters in string values', () => {
      const dict: SignatureDictionary = {
        Type: '/Sig',
        Filter: '/Adobe.PPKLite',
        SubFilter: '/ETSI.CAdES.detached',
        Contents: '<010203>',
        ByteRange: [0, 50, 100, 150],
        M: 'D:20230101100000Z00\'00\'',
        Name: 'Test (Name)',
        Location: 'US\\NY',
        Reason: 'I (agree)',
      };

      const result = builder.serializeToPdfObject(dict, 1, 0);

      expect(result).toContain('/Name (Test \\(Name\\))');
      expect(result).toContain('/Location (US\\\\NY)');
      expect(result).toContain('/Reason (I \\(agree\\))');
    });
  });
});

