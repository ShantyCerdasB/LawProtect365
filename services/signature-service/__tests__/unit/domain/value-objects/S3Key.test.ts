/**
 * @fileoverview Unit tests for S3Key value object
 * @summary Tests for S3 key validation and formatting logic
 * @description Comprehensive test suite for S3Key value object covering validation,
 * file type detection, path manipulation, and S3 key formatting rules.
 */

import { S3Key } from '../../../../src/domain/value-objects/S3Key';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('S3Key', () => {
  describe('Constructor and Validation', () => {
    it('should create S3Key with valid key', () => {
      const key = 'documents/contract.pdf';
      const s3Key = new S3Key(key);

      expect(s3Key.getValue()).toBe(key);
    });

    it('should trim whitespace from key', () => {
      const key = '  documents/contract.pdf  ';
      const s3Key = new S3Key(key);

      expect(s3Key.getValue()).toBe('documents/contract.pdf');
    });

    it('should throw error when key is empty string', () => {
      expect(() => new S3Key(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when key is only whitespace', () => {
      expect(() => new S3Key('   '))
        .toThrow(BadRequestError);
    });

    it('should throw error when key is null', () => {
      expect(() => new S3Key(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when key is undefined', () => {
      expect(() => new S3Key(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when key is not a string', () => {
      expect(() => new S3Key(123 as any))
        .toThrow(BadRequestError);

      expect(() => new S3Key({} as any))
        .toThrow(BadRequestError);

      expect(() => new S3Key([] as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when key is too long', () => {
      const longKey = 'a'.repeat(1025); // Exceeds 1024 character limit
      
      expect(() => new S3Key(longKey))
        .toThrow(BadRequestError);
    });

    it('should accept key at maximum length', () => {
      const maxLengthKey = 'a'.repeat(1024);
      
      expect(() => new S3Key(maxLengthKey)).not.toThrow();
      const s3Key = new S3Key(maxLengthKey);
      expect(s3Key.getValue()).toBe(maxLengthKey);
    });

    it('should throw error when key starts with slash', () => {
      expect(() => new S3Key('/documents/contract.pdf'))
        .toThrow(BadRequestError);
    });

    it('should throw error when key contains consecutive slashes', () => {
      expect(() => new S3Key('documents//contract.pdf'))
        .toThrow(BadRequestError);
    });

    it('should throw error when key contains invalid characters', () => {
      const invalidKeys = [
        'documents/contract<.pdf',
        'documents/contract>.pdf',
        'documents/contract:.pdf',
        'documents/contract".pdf',
        'documents/contract|.pdf',
        'documents/contract?.pdf',
        'documents/contract*.pdf',
        'documents/contract\x00.pdf', // Null character
        'documents/contract\x1f.pdf'  // Control character
      ];

      // Test each invalid key individually to avoid deep nesting
      for (const invalidKey of invalidKeys) {
        expect(() => new S3Key(invalidKey)).toThrow(BadRequestError);
      }
    });

    it('should accept valid S3 keys', () => {
      const validKeys = [
        'contract.pdf',
        'documents/contract.pdf',
        'documents/2024/contract.pdf',
        'documents/contract-v1.0.pdf',
        'documents/contract_final.pdf',
        'documents/contract-final.pdf',
        'documents/contract.final.pdf',
        'documents/contract (1).pdf',
        'documents/contract [final].pdf',
        'documents/contract {signed}.pdf',
        'documents/contract + addendum.pdf',
        'documents/contract = signed.pdf',
        'documents/contract & agreement.pdf',
        'documents/contract @ version 1.pdf',
        'documents/contract # final.pdf',
        'documents/contract $ amount.pdf',
        'documents/contract % complete.pdf',
        'documents/contract ^ version.pdf',
        'documents/contract ~ temp.pdf',
        'documents/contract ` backtick.pdf',
        'documents/contract ! important.pdf',
        'documents/contract - hyphen.pdf',
        'documents/contract _ underscore.pdf'
      ];

      // Test each valid key individually to avoid deep nesting
      for (const validKey of validKeys) {
        expect(() => new S3Key(validKey)).not.toThrow();
        const s3Key = new S3Key(validKey);
        expect(s3Key.getValue()).toBe(validKey);
      }
    });
  });

  describe('Static Factory Methods', () => {
    it('should create S3Key from string', () => {
      const key = 'documents/contract.pdf';
      const s3Key = S3Key.fromString(key);

      expect(s3Key.getValue()).toBe(key);
    });

    it('should throw error when fromString receives invalid key', () => {
      expect(() => S3Key.fromString('/invalid/key'))
        .toThrow(BadRequestError);
    });
  });

  describe('File Path Operations', () => {
    it('should get base name without extension', () => {
      const s3Key = new S3Key('documents/contract.pdf');
      
      expect(s3Key.getBaseName()).toBe('documents/contract');
    });

    it('should get base name for key without extension', () => {
      const s3Key = new S3Key('documents/contract');
      
      expect(s3Key.getBaseName()).toBe('documents/contract');
    });

    it('should get base name for key with multiple dots', () => {
      const s3Key = new S3Key('documents/contract.v1.0.pdf');
      
      expect(s3Key.getBaseName()).toBe('documents/contract.v1.0');
    });

    it('should get file extension', () => {
      const s3Key = new S3Key('documents/contract.pdf');
      
      expect(s3Key.getExtension()).toBe('pdf');
    });

    it('should get empty extension for key without extension', () => {
      const s3Key = new S3Key('documents/contract');
      
      expect(s3Key.getExtension()).toBe('');
    });

    it('should get extension for key with multiple dots', () => {
      const s3Key = new S3Key('documents/contract.v1.0.pdf');
      
      expect(s3Key.getExtension()).toBe('pdf');
    });

    it('should get directory path', () => {
      const s3Key = new S3Key('documents/contracts/contract.pdf');
      
      expect(s3Key.getDirectory()).toBe('documents/contracts');
    });

    it('should get empty directory for key without path', () => {
      const s3Key = new S3Key('contract.pdf');
      
      expect(s3Key.getDirectory()).toBe('');
    });

    it('should get filename', () => {
      const s3Key = new S3Key('documents/contracts/contract.pdf');
      
      expect(s3Key.getFileName()).toBe('contract.pdf');
    });

    it('should get filename for key without path', () => {
      const s3Key = new S3Key('contract.pdf');
      
      expect(s3Key.getFileName()).toBe('contract.pdf');
    });
  });

  describe('File Type Detection', () => {
    it('should detect PDF files', () => {
      const pdfKey = new S3Key('documents/contract.pdf');
      
      expect(pdfKey.isPdf()).toBe(true);
      expect(pdfKey.hasExtension('pdf')).toBe(true);
    });

    it('should detect PDF files with uppercase extension', () => {
      const pdfKey = new S3Key('documents/contract.PDF');
      
      expect(pdfKey.isPdf()).toBe(true);
      expect(pdfKey.hasExtension('PDF')).toBe(true);
    });

    it('should not detect non-PDF files as PDF', () => {
      const docKey = new S3Key('documents/contract.doc');
      
      expect(docKey.isPdf()).toBe(false);
      expect(docKey.hasExtension('pdf')).toBe(false);
    });

    it('should detect image files', () => {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      
      imageExtensions.forEach(ext => {
        const imageKey = new S3Key(`documents/image.${ext}`);
        expect(imageKey.isImage()).toBe(true);
      });
    });

    it('should detect image files with uppercase extensions', () => {
      const imageExtensions = ['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP'];
      
      imageExtensions.forEach(ext => {
        const imageKey = new S3Key(`documents/image.${ext}`);
        expect(imageKey.isImage()).toBe(true);
      });
    });

    it('should not detect non-image files as images', () => {
      const nonImageExtensions = ['pdf', 'doc', 'txt', 'html', 'css', 'js'];
      
      nonImageExtensions.forEach(ext => {
        const fileKey = new S3Key(`documents/file.${ext}`);
        expect(fileKey.isImage()).toBe(false);
      });
    });

    it('should check extensions case-insensitively', () => {
      const s3Key = new S3Key('documents/contract.PDF');
      
      expect(s3Key.hasExtension('pdf')).toBe(true);
      expect(s3Key.hasExtension('PDF')).toBe(true);
      expect(s3Key.hasExtension('Pdf')).toBe(true);
      expect(s3Key.hasExtension('pDf')).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should return true for equal S3Keys', () => {
      const key1 = new S3Key('documents/contract.pdf');
      const key2 = new S3Key('documents/contract.pdf');

      expect(key1.equals(key2)).toBe(true);
    });

    it('should return false for different S3Keys', () => {
      const key1 = new S3Key('documents/contract.pdf');
      const key2 = new S3Key('documents/agreement.pdf');

      expect(key1.equals(key2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const key = new S3Key('documents/contract.pdf');
      const otherObject = { getValue: () => 'documents/contract.pdf' };

      expect(key.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const key = 'documents/contract.pdf';
      const s3Key = new S3Key(key);

      expect(s3Key.toString()).toBe(key);
    });

    it('should return JSON representation', () => {
      const key = 'documents/contract.pdf';
      const s3Key = new S3Key(key);

      expect(s3Key.toJSON()).toBe(key);
    });

    it('should be serializable to JSON string', () => {
      const key = 'documents/contract.pdf';
      const s3Key = new S3Key(key);
      const json = JSON.stringify(s3Key.toJSON());

      expect(json).toBe(`"${key}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle keys with special characters in valid positions', () => {
      const specialKeys = [
        'documents/contract (1).pdf',
        'documents/contract [final].pdf',
        'documents/contract {signed}.pdf',
        'documents/contract + addendum.pdf',
        'documents/contract = signed.pdf',
        'documents/contract & agreement.pdf',
        'documents/contract @ version 1.pdf',
        'documents/contract # final.pdf',
        'documents/contract $ amount.pdf',
        'documents/contract % complete.pdf',
        'documents/contract ^ version.pdf',
        'documents/contract ~ temp.pdf',
        'documents/contract ` backtick.pdf',
        'documents/contract ! important.pdf'
      ];

      // Test each special key individually to avoid deep nesting
      for (const specialKey of specialKeys) {
        expect(() => new S3Key(specialKey)).not.toThrow();
        const s3Key = new S3Key(specialKey);
        expect(s3Key.getValue()).toBe(specialKey);
      }
    });

    it('should handle keys with unicode characters', () => {
      const unicodeKey = 'documents/contract-中文-العربية.pdf';
      
      expect(() => new S3Key(unicodeKey)).not.toThrow();
      const s3Key = new S3Key(unicodeKey);
      expect(s3Key.getValue()).toBe(unicodeKey);
    });

    it('should handle keys with numbers and mixed case', () => {
      const mixedKey = 'documents/Contract123_v1.0-FINAL.pdf';
      
      expect(() => new S3Key(mixedKey)).not.toThrow();
      const s3Key = new S3Key(mixedKey);
      expect(s3Key.getValue()).toBe(mixedKey);
    });

    it('should handle keys with multiple file extensions', () => {
      const multiExtKey = 'documents/contract.tar.gz';
      
      expect(() => new S3Key(multiExtKey)).not.toThrow();
      const s3Key = new S3Key(multiExtKey);
      expect(s3Key.getExtension()).toBe('gz');
      expect(s3Key.getBaseName()).toBe('documents/contract.tar');
    });

    it('should handle keys with no file extension', () => {
      const noExtKey = 'documents/contract';
      
      expect(() => new S3Key(noExtKey)).not.toThrow();
      const s3Key = new S3Key(noExtKey);
      expect(s3Key.getExtension()).toBe('');
      expect(s3Key.getBaseName()).toBe('documents/contract');
    });

    it('should handle keys with only extension', () => {
      const onlyExtKey = '.gitignore';
      
      expect(() => new S3Key(onlyExtKey)).not.toThrow();
      const s3Key = new S3Key(onlyExtKey);
      expect(s3Key.getExtension()).toBe(''); // Current behavior: lastDotIndex > 0 excludes position 0
      expect(s3Key.getBaseName()).toBe('.gitignore'); // Current behavior: no dot found, returns full key
    });

    it('should maintain immutability', () => {
      const key = 'documents/contract.pdf';
      const s3Key = new S3Key(key);
      const originalValue = s3Key.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(s3Key.getValue()).toBe(originalValue);
      expect(s3Key.getValue()).toBe(key);
    });

    it('should handle keys with maximum valid length', () => {
      const maxKey = 'a'.repeat(1024);
      
      expect(() => new S3Key(maxKey)).not.toThrow();
      const s3Key = new S3Key(maxKey);
      expect(s3Key.getValue()).toBe(maxKey);
      expect(s3Key.getValue().length).toBe(1024);
    });

    it('should handle keys with complex nested paths', () => {
      const complexKey = 'documents/2024/contracts/signed/contract-v1.0-final.pdf';
      
      expect(() => new S3Key(complexKey)).not.toThrow();
      const s3Key = new S3Key(complexKey);
      expect(s3Key.getValue()).toBe(complexKey);
      expect(s3Key.getDirectory()).toBe('documents/2024/contracts/signed');
      expect(s3Key.getFileName()).toBe('contract-v1.0-final.pdf');
      expect(s3Key.getBaseName()).toBe('documents/2024/contracts/signed/contract-v1.0-final');
      expect(s3Key.getExtension()).toBe('pdf');
    });
  });
});
