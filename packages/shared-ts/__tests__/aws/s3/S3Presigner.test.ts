/**
 * @file S3Presigner.test.ts
 * @summary Tests for S3 presigner implementation
 * @description Comprehensive tests for the S3Presigner class covering GET and PUT URL generation
 */

import { S3Presigner } from '../../../src/aws/s3/S3Presigner.js';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../../src/index.js', () => ({
  ...jest.requireActual('../../../src/index.js'),
  mapAwsError: jest.fn((err, op) => err),
}));

describe('S3Presigner', () => {
  let mockS3Client: any;
  let s3Presigner: S3Presigner;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client = {};
    
    s3Presigner = new S3Presigner(mockS3Client, {
      defaultTtl: 600,
      defaultAcl: 'private',
      defaultCacheControl: 'max-age=300',
      defaultKmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key',
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const presigner = new S3Presigner(mockS3Client);
      expect(presigner).toBeInstanceOf(S3Presigner);
    });

    it('should use provided options', () => {
      const options = {
        defaultTtl: 1200,
        defaultAcl: 'public-read' as const,
        defaultCacheControl: 'max-age=600',
        defaultKmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/custom-key',
      };
      const presigner = new S3Presigner(mockS3Client, options);
      expect(presigner).toBeInstanceOf(S3Presigner);
    });

    it('should enforce minimum TTL of 1 second', () => {
      const presigner = new S3Presigner(mockS3Client, { defaultTtl: 0 });
      expect(presigner).toBeInstanceOf(S3Presigner);
    });
  });

  describe('getObjectUrl', () => {
    const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key?signature=abc123';

    it('should generate GET URL with minimal parameters', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await s3Presigner.getObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      });

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should generate GET URL with response headers', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await s3Presigner.getObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        responseContentType: 'text/plain',
        responseContentDisposition: 'attachment; filename="test.txt"',
        expiresInSeconds: 300,
      });

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 300 }
      );
    });

    it('should use default TTL when expiresInSeconds is not provided', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.getObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should enforce minimum TTL of 1 second', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.getObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        expiresInSeconds: 0,
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 1 }
      );
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(awsError);

      await expect(s3Presigner.getObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      })).rejects.toThrow(awsError);
    });
  });

  describe('putObjectUrl', () => {
    const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key?signature=def456';

    it('should generate PUT URL with minimal parameters', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      });

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should generate PUT URL with all parameters', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      const result = await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'application/json',
        acl: 'public-read',
        cacheControl: 'max-age=3600',
        metadata: { purpose: 'test' },
        kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/custom-key',
        expiresInSeconds: 300,
      });

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 300 }
      );
    });

    it('should use default values when parameters are omitted', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should not include KMS settings when kmsKeyId is not provided', async () => {
      const presignerWithoutKms = new S3Presigner(mockS3Client, {
        defaultTtl: 600,
      });
      
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await presignerWithoutKms.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should use custom KMS key when provided', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
        kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/custom-key',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should use default TTL when expiresInSeconds is not provided', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should enforce minimum TTL of 1 second', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);

      await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        expiresInSeconds: 0,
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 1 }
      );
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(awsError);

      await expect(s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      })).rejects.toThrow(awsError);
    });
  });

  describe('edge cases', () => {
    it('should handle presigner without any defaults', async () => {
      const minimalPresigner = new S3Presigner(mockS3Client);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://test.com');

      await minimalPresigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 900 } // default TTL
      );
    });

    it('should handle empty metadata', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://test.com');

      await s3Presigner.putObjectUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
        metadata: {},
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });
  });
});
