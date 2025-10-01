import { 
  validateStoreDocumentRequest, 
  validateRetrieveDocumentRequest, 
  validateGeneratePresignedUrlRequest 
} from '../../../../../src/domain/rules/s3/S3ValidationRules';
import { StoreDocumentRequest } from '../../../../../src/domain/types/s3/StoreDocumentRequest';
import { RetrieveDocumentRequest } from '../../../../../src/domain/types/s3/RetrieveDocumentRequest';
import { GeneratePresignedUrlRequest } from '../../../../../src/domain/types/s3/GeneratePresignedUrlRequest';
import { S3Key } from '@lawprotect/shared-ts';
import { ContentType } from '@lawprotect/shared-ts';
import { S3Operation } from '@lawprotect/shared-ts';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../../../helpers/testUtils';

describe('S3ValidationRules', () => {
  describe('validateStoreDocumentRequest', () => {
    it('should validate successfully when all required fields are present', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: Buffer.from('test content'),
        contentType: ContentType.fromString('application/pdf'),
        metadata: {
          fileSize: 12,
          originalFileName: 'test.pdf'
        }
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).not.toThrow();
    });

    it('should throw when request is null', () => {
      expect(() => {
        validateStoreDocumentRequest(null as any);
      }).toThrow('Store document request is required');
    });

    it('should throw when envelopeId is missing', () => {
      const request: StoreDocumentRequest = {
        envelopeId: null as any,
        signerId: TestUtils.generateSignerId(),
        documentContent: Buffer.from('test content'),
        contentType: ContentType.fromString('application/pdf')
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('Envelope ID is required');
    });

    it('should throw when signerId is missing', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: null as any,
        documentContent: Buffer.from('test content'),
        contentType: ContentType.fromString('application/pdf')
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('Signer ID is required');
    });

    it('should throw when documentContent is missing', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: null as any,
        contentType: ContentType.fromString('application/pdf')
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('Document content is required');
    });

    it('should throw when documentContent is empty', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: Buffer.alloc(0),
        contentType: ContentType.fromString('application/pdf')
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('Document content is required');
    });

    it('should throw when contentType is missing', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: Buffer.from('test content'),
        contentType: null as any
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('Content type is required');
    });

    it('should throw when file size exceeds limit', () => {
      const largeContent = Buffer.alloc(51 * 1024 * 1024); // 51MB
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: largeContent,
        contentType: ContentType.fromString('application/pdf')
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('File size');
    });

    it('should throw when metadata file size does not match content', () => {
      const request: StoreDocumentRequest = {
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        documentContent: Buffer.from('test content'),
        contentType: ContentType.fromString('application/pdf'),
        metadata: {
          fileSize: 100,
          originalFileName: 'test.pdf'
        }
      };

      expect(() => {
        validateStoreDocumentRequest(request);
      }).toThrow('File size in metadata');
    });
  });

  describe('validateRetrieveDocumentRequest', () => {
    it('should validate successfully when all required fields are present', () => {
      const request: RetrieveDocumentRequest = {
        documentKey: S3Key.fromString('envelopes/test-file.pdf'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId()
      };

      expect(() => {
        validateRetrieveDocumentRequest(request);
      }).not.toThrow();
    });

    it('should throw when request is null', () => {
      expect(() => {
        validateRetrieveDocumentRequest(null as any);
      }).toThrow('Retrieve document request is required');
    });

    it('should throw when documentKey is missing', () => {
      const request: RetrieveDocumentRequest = {
        documentKey: null as any,
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId()
      };

      expect(() => {
        validateRetrieveDocumentRequest(request);
      }).toThrow('Document key is required');
    });

    it('should throw when envelopeId is missing', () => {
      const request: RetrieveDocumentRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        envelopeId: null as any,
        signerId: TestUtils.generateSignerId()
      };

      expect(() => {
        validateRetrieveDocumentRequest(request);
      }).toThrow('Envelope ID is required');
    });

    it('should throw when signerId is missing', () => {
      const request: RetrieveDocumentRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: null as any
      };

      expect(() => {
        validateRetrieveDocumentRequest(request);
      }).toThrow('Signer ID is required');
    });
  });

  describe('validateGeneratePresignedUrlRequest', () => {
    it('should validate successfully when all required fields are present', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        expiresIn: 3600
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).not.toThrow();
    });

    it('should throw when request is null', () => {
      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(null as any, config);
      }).toThrow('Generate presigned URL request is required');
    });

    it('should throw when documentKey is missing', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: null as any,
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId()
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('Document key is required');
    });

    it('should throw when operation is missing', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: null as any,
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId()
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('S3 operation is required');
    });

    it('should throw when envelopeId is missing', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: null as any,
        signerId: TestUtils.generateSignerId()
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('Envelope ID is required');
    });

    it('should throw when signerId is missing', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: null as any
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('Signer ID is required');
    });

    it('should throw when expiration time is too short', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        expiresIn: 100
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('Expiration time');
    });

    it('should throw when expiration time is too long', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId(),
        expiresIn: 10000
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).toThrow('Expiration time');
    });

    it('should validate successfully without expiration time', () => {
      const request: GeneratePresignedUrlRequest = {
        documentKey: S3Key.fromString('test-bucket/documents/test-file.pdf'),
        operation: S3Operation.fromString('get'),
        envelopeId: TestUtils.generateEnvelopeId(),
        signerId: TestUtils.generateSignerId()
      };

      const config = {
        maxExpirationTime: 7200,
        minExpirationTime: 300
      };

      expect(() => {
        validateGeneratePresignedUrlRequest(request, config);
      }).not.toThrow();
    });
  });
});
