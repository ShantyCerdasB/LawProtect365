/**
 * AWS service ports (storage-agnostic interfaces) for S3, KMS, Secrets, SSM, SNS and SQS.
 * Implement these interfaces in adapters using AWS SDK v3 or other providers.
 */

export interface S3PutObjectInput {
  bucket: string;
  key: string;
  body: Uint8Array | string | Buffer | ReadableStream<any>;
  contentType?: string;
  metadata?: Record<string, string>;
  kmsKeyId?: string;
  cacheControl?: string;
  acl?: "private" | "public-read";
}

export interface S3GetObjectOutput {
  body: Uint8Array | Buffer | ReadableStream<any>;
  contentType?: string;
  metadata?: Record<string, string>;
  etag?: string;
  lastModified?: Date;
}

export interface S3Port {
  putObject(input: S3PutObjectInput): Promise<{ etag?: string; versionId?: string }>;
  getObject(bucket: string, key: string, rangeBytes?: string): Promise<S3GetObjectOutput>;
  headObject(bucket: string, key: string): Promise<{ exists: boolean; size?: number; etag?: string; lastModified?: Date; metadata?: Record<string, string> }>;
  deleteObject(bucket: string, key: string): Promise<void>;
}

export interface KmsEncryptInput {
  keyId: string;
  plaintext: Uint8Array;
  context?: Record<string, string>;
}
export interface KmsDecryptInput {
  ciphertext: Uint8Array;
  context?: Record<string, string>;
}
export interface KmsSignInput {
  keyId: string;
  message: Uint8Array;
  signingAlgorithm?: string;
}
export interface KmsVerifyInput {
  keyId: string;
  message: Uint8Array;
  signature: Uint8Array;
  signingAlgorithm?: string;
}

export interface KmsPort {
  encrypt(input: KmsEncryptInput): Promise<{ ciphertext: Uint8Array }>;
  decrypt(input: KmsDecryptInput): Promise<{ plaintext: Uint8Array }>;
  sign(input: KmsSignInput): Promise<{ signature: Uint8Array }>;
  verify(input: KmsVerifyInput): Promise<{ valid: boolean }>;
}

export interface SecretsPort {
  getSecretString(id: string): Promise<string | undefined>;
}

export interface SsmPort {
  getParameter(name: string, withDecryption?: boolean): Promise<string | undefined>;
}

export interface SnsPort {
  publish(topicArn: string, message: string, attributes?: Record<string, string>): Promise<{ messageId: string }>;
}

export interface SqsSendMessageInput {
  queueUrl: string;
  messageBody: string;
  delaySeconds?: number;
  messageAttributes?: Record<string, { dataType: "String" | "Number" | "Binary"; stringValue?: string; binaryValue?: Uint8Array }>;
}

export interface SqsPort {
  sendMessage(input: SqsSendMessageInput): Promise<{ messageId: string }>;
  deleteMessage(queueUrl: string, receiptHandle: string): Promise<void>;
  receiveMessages(queueUrl: string, maxMessages?: number, waitTimeSeconds?: number, visibilityTimeoutSeconds?: number): Promise<
    Array<{ messageId: string; receiptHandle: string; body: string; attributes?: Record<string, string> }>
  >;
}
