/**
 * @file KmsSigner.ts
 * @summary AWS KMS adapter implementing the shared `KmsPort` contract.
 *
 * - Uses AWS SDK v3 (@aws-sdk/client-kms)
 * - Normalizes provider failures via `mapAwsError`
 * - Retries throttling/5xx with shared jittered backoff (`shouldRetry`, `isAwsRetryable`)
 * - Chooses MessageType (RAW vs DIGEST) automatically for `sign/verify`
 * - Supports default KeyId and SigningAlgorithm via constructor options; per-call
 *   values can override defaults.
 *
 * Error policy
 * ------------
 * - Local input/usage errors (e.g., missing KeyId) → `BadRequestError` with shared code.
 * - Provider/SDK errors → catch and rethrow via `mapAwsError`.
 * - Unexpected empty SDK responses (no ciphertext/plaintext/signature) → `InternalError`.
 */

import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  DescribeKeyCommand} from "@aws-sdk/client-kms";

import type {
  KmsPort,
  KmsEncryptInput,
  KmsDecryptInput} from "../ports.js";

import {
  BadRequestError,
  InternalError,
  ErrorCodes,
  mapAwsError,
  shouldRetry,
  isAwsRetryable,
  sleep
} from "../../index.js";

import type { KmsSignerOptions } from "./types.js";

/**
 * AWS KMS adapter that fulfills the shared `KmsPort`.
 * Handles encryption, decryption, and key management operations.
 *
 * @example
 * ```ts
 * const kmsClient = new KmsSigner(kmsClient, {
 *   defaultKeyId: process.env.KMS_KEY_ID!,
 *   maxAttempts: 3,
 * });
 *
 * // Encrypt data:
 * await kmsClient.encrypt({ keyId: "key-123", plaintext: new Uint8Array([1,2,3]) });
 *
 * // Decrypt data:
 * await kmsClient.decrypt({ ciphertext: encryptedData });
 * ```
 */
export class KmsSigner implements KmsPort {
  private readonly client: KMSClient;
  private readonly maxAttempts: number;

  /** Default KeyId used when a call omits `input.keyId`. */
  private readonly defaultKeyId?: string;

  constructor(client: KMSClient, opts: KmsSignerOptions = {}) {
    this.client = client;
    this.maxAttempts = Math.max(1, opts.maxAttempts ?? 3);

    // Back-compat + preferred names
    this.defaultKeyId = opts.defaultKeyId ?? opts.signerKeyId;
  }

  /**
   * Encrypts plaintext with the specified (or default) KMS key.
   */
  async encrypt(input: KmsEncryptInput): Promise<{ ciphertext: Uint8Array }> {
    const ctx = "KmsSigner.encrypt";

    const keyId = (input as any).keyId ?? this.defaultKeyId;
    if (!keyId) {
      throw new BadRequestError("Missing KeyId", ErrorCodes.COMMON_BAD_REQUEST);
    }

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new EncryptCommand({
          KeyId: keyId,
          Plaintext: input.plaintext,
          EncryptionContext: input.context})
      );
      if (!res.CiphertextBlob) {
        throw new InternalError("KMS returned empty CiphertextBlob", ErrorCodes.COMMON_INTERNAL_ERROR, {
          op: ctx});
      }
      return { ciphertext: res.CiphertextBlob };
    });
  }

  /**
   * Decrypts a ciphertext. (KMS can infer the key from the blob; KeyId is optional.)
   */
  async decrypt(input: KmsDecryptInput): Promise<{ plaintext: Uint8Array }> {
    const ctx = "KmsSigner.decrypt";
    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new DecryptCommand({
          CiphertextBlob: input.ciphertext,
          EncryptionContext: input.context})
      );
      if (!res.Plaintext) {
        throw new InternalError("KMS returned empty Plaintext", ErrorCodes.COMMON_INTERNAL_ERROR, {
          op: ctx});
      }
      return { plaintext: res.Plaintext };
    });
  }


  /**
   * Shared retry wrapper:
   * - Uses `isAwsRetryable` classification
   * - Delay policy via `shouldRetry` (full/decorrelated jitter in shared)
   * - On non-retryable or exhausted attempts → map via `mapAwsError`
   */
  private async withRetry<T>(op: string, fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const { retry, delayMs } = shouldRetry(
          attempt,
          this.maxAttempts,
          isAwsRetryable,
          err
        );
        if (!retry) throw mapAwsError(err, op);
        await sleep(delayMs);
      }
    }
    throw mapAwsError(lastErr, op);
  }

  /**
   * Describes a KMS key to check its availability and configuration
   * @param keyId - The KMS key ID to describe
   * @returns Promise with key metadata
   */
  async describeKey(keyId: string): Promise<{
    keyId: string;
    keyState: string;
    keyUsage: string;
    enabled: boolean;
  }> {
    const ctx = "KmsSigner.describeKey";

    if (!keyId) {
      throw new BadRequestError("Missing KeyId", ErrorCodes.COMMON_BAD_REQUEST);
    }

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      if (!res.KeyMetadata) {
        throw new InternalError("No key metadata returned", ErrorCodes.COMMON_INTERNAL_ERROR);
      }

      return {
        keyId: res.KeyMetadata.KeyId || keyId,
        keyState: res.KeyMetadata.KeyState || 'Unknown',
        keyUsage: res.KeyMetadata.KeyUsage || 'Unknown',
        enabled: res.KeyMetadata.KeyState === 'Enabled'
      };
    });
  }
}

