import { BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';
import { S3Key } from '@lawprotect/shared-ts';
export function validateS3StorageForSignature(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    signatureKeyPrefix?: string;
    maxKeyLength?: number;
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw new BadRequestError(
        `S3 bucket ${bucket} is not allowed for signature storage`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.signatureKeyPrefix) {
    if (!s3Key.getValue().startsWith(config.signatureKeyPrefix)) {
      throw new BadRequestError(
        `S3 key must start with prefix: ${config.signatureKeyPrefix}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.maxKeyLength && s3Key.getValue().length > config.maxKeyLength) {
    throw new BadRequestError(
      `S3 key length exceeds maximum allowed length of ${config.maxKeyLength}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }
}

export function validateS3StorageForDocument(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    documentKeyPrefix?: string;
    allowedExtensions?: string[];
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw new BadRequestError(
        `S3 bucket ${bucket} is not allowed for document storage`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.documentKeyPrefix) {
    if (!s3Key.getValue().startsWith(config.documentKeyPrefix)) {
      throw new BadRequestError(
        `S3 key must start with prefix: ${config.documentKeyPrefix}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.allowedExtensions && config.allowedExtensions.length > 0) {
    const extension = s3Key.getExtension().toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      throw new BadRequestError(
        `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }
}

export function validateS3StorageForTemplate(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    templateKeyPrefix?: string;
    templateVersioning?: boolean;
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw new BadRequestError(
        `S3 bucket ${bucket} is not allowed for template storage`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.templateKeyPrefix) {
    if (!s3Key.getValue().startsWith(config.templateKeyPrefix)) {
      throw new BadRequestError(
        `S3 key must start with prefix: ${config.templateKeyPrefix}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  if (config.templateVersioning) {
    const keyParts = s3Key.getValue().split('/');
    const lastPart = keyParts[keyParts.length - 1];
    
    if (!lastPart.includes('v') || !/\d+/.test(lastPart)) {
      throw new BadRequestError(
        'Template key must include version information when versioning is required',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }
}

export function validateS3StorageCompliance(
  s3Key: S3Key,
  config: {
    requireEncryption?: boolean;
    requireVersioning?: boolean;
    auditKeyPrefix?: string;
    retentionPeriod?: number;
  }
): void {
  if (config.auditKeyPrefix) {
    if (!s3Key.getValue().startsWith(config.auditKeyPrefix)) {
      throw new BadRequestError(
        `S3 key must start with audit prefix: ${config.auditKeyPrefix}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }
}

function extractBucketFromKey(s3Key: string): string {
  const parts = s3Key.split('/');
  return parts[0] || '';
}

export function validateS3StorageGeneral(
  s3Key: S3Key,
  config: {
    allowedS3Buckets: string[];
    maxKeyLength?: number;
    minKeyLength?: number;
    allowedCharacters?: RegExp;
  }
): void {
  if (config.allowedS3Buckets.length > 0) {
    const bucket = extractBucketFromKey(s3Key.getValue());
    if (!config.allowedS3Buckets.includes(bucket)) {
      throw new BadRequestError(
        `S3 bucket ${bucket} is not allowed`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

  const keyLength = s3Key.getValue().length;
  if (config.maxKeyLength && keyLength > config.maxKeyLength) {
    throw new BadRequestError(
      `S3 key length ${keyLength} exceeds maximum allowed length of ${config.maxKeyLength}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  if (config.minKeyLength && keyLength < config.minKeyLength) {
    throw new BadRequestError(
      `S3 key length ${keyLength} is below minimum required length of ${config.minKeyLength}`,
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }

  if (config.allowedCharacters && !config.allowedCharacters.test(s3Key.getValue())) {
    throw new BadRequestError(
      'S3 key contains invalid characters',
      ErrorCodes.COMMON_BAD_REQUEST
    );
  }
}
