import { validateS3StorageForDocument, validateS3StorageGeneral } from '../../../../../src/domain/rules/s3/S3StorageRules';
import { S3Key } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';

describe('S3StorageRules', () => {
  let s3Key: S3Key;

  beforeEach(() => {
    s3Key = S3Key.fromString('test-bucket/documents/test-file.pdf');
  });

  describe('validateS3StorageForDocument', () => {
    it('should validate successfully when all conditions are met', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        documentKeyPrefix: 'documents/',
        allowedExtensions: ['pdf']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).not.toThrow();
    });

    it('should throw when bucket is not allowed', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: ['other-bucket'],
        documentKeyPrefix: 'documents/',
        allowedExtensions: ['pdf']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).toThrow('S3 bucket documents is not allowed');
    });

    it('should throw when key does not start with required prefix', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        documentKeyPrefix: 'images/',
        allowedExtensions: ['pdf']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).toThrow('S3 key must start with prefix: images/');
    });

    it('should throw when file extension is not allowed', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        documentKeyPrefix: 'documents/',
        allowedExtensions: ['doc', 'docx']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).toThrow('File extension pdf is not allowed');
    });

    it('should validate successfully with empty allowed buckets', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        documentKeyPrefix: 'documents/',
        allowedExtensions: ['pdf']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).not.toThrow();
    });

    it('should validate successfully without prefix requirement', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        allowedExtensions: ['pdf']
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).not.toThrow();
    });

    it('should validate successfully without extension requirement', () => {
      const s3Key = S3Key.fromString('documents/test-document.pdf');
      const config = {
        allowedS3Buckets: [],
        documentKeyPrefix: 'documents/'
      };

      expect(() => {
        validateS3StorageForDocument(s3Key, config);
      }).not.toThrow();
    });
  });

  describe('validateS3StorageGeneral', () => {
    it('should validate successfully when all conditions are met', () => {
      const config = {
        allowedS3Buckets: ['test-bucket'],
        maxKeyLength: 100,
        minKeyLength: 10,
        allowedCharacters: /^[a-zA-Z0-9\/\-_\.]+$/
      };

      expect(() => {
        validateS3StorageGeneral(s3Key, config);
      }).not.toThrow();
    });

    it('should throw when bucket is not allowed', () => {
      const config = {
        allowedS3Buckets: ['other-bucket'],
        maxKeyLength: 100,
        minKeyLength: 10
      };

      expect(() => {
        validateS3StorageGeneral(s3Key, config);
      }).toThrow('S3 bucket test-bucket is not allowed');
    });

    it('should throw when key length exceeds maximum', () => {
      const longKey = S3Key.fromString('a'.repeat(100));
      const config = {
        allowedS3Buckets: [],
        maxKeyLength: 50
      };

      expect(() => {
        validateS3StorageGeneral(longKey, config);
      }).toThrow('S3 key length');
    });

    it('should throw when key length is below minimum', () => {
      const shortKey = S3Key.fromString('a');
      const config = {
        allowedS3Buckets: [],
        minKeyLength: 10
      };

      expect(() => {
        validateS3StorageGeneral(shortKey, config);
      }).toThrow('S3 key length');
    });

    it('should throw when key contains invalid characters', () => {
      const invalidKey = S3Key.fromString('documents/test@file.pdf');
      const config = {
        allowedS3Buckets: [],
        allowedCharacters: /^[a-zA-Z0-9\/\-_\.]+$/
      };

      expect(() => {
        validateS3StorageGeneral(invalidKey, config);
      }).toThrow('S3 key contains invalid characters');
    });

    it('should validate successfully with empty allowed buckets', () => {
      const config = {
        allowedS3Buckets: [],
        maxKeyLength: 100,
        minKeyLength: 10
      };

      expect(() => {
        validateS3StorageGeneral(s3Key, config);
      }).not.toThrow();
    });

    it('should validate successfully without length constraints', () => {
      const config = {
        allowedS3Buckets: ['test-bucket']
      };

      expect(() => {
        validateS3StorageGeneral(s3Key, config);
      }).not.toThrow();
    });

    it('should validate successfully without character constraints', () => {
      const config = {
        allowedS3Buckets: ['test-bucket'],
        maxKeyLength: 100,
        minKeyLength: 10
      };

      expect(() => {
        validateS3StorageGeneral(s3Key, config);
      }).not.toThrow();
    });
  });
});
