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
  SignCommand,
  VerifyCommand,
  type SigningAlgorithmSpec,
} from "@aws-sdk/client-kms";

import type {
  KmsPort,
  KmsEncryptInput,
  KmsDecryptInput,
  KmsSignInput,
  KmsVerifyInput,
} from "@lawprotect/shared-ts";

import {
  BadRequestError,
  InternalError,
  ErrorCodes,
  mapAwsError,
  shouldRetry,
  isAwsRetryable,
} from "@lawprotect/shared-ts";

import type { KmsSignerOptions } from "../../shared/types/kms";
import { pickMessageType } from "@lawprotect/shared-ts";
import { sleep } from "@lawprotect/shared-ts";

/**
 * AWS KMS adapter that fulfills the shared `KmsPort`.
 *
 * @example
 * ```ts
 * const signer = new KmsSigner(kmsClient, {
 *   defaultKeyId: process.env.KMS_SIGNER_KEY_ID!,
 *   defaultSigningAlgorithm: "RSASSA_PSS_SHA_256",
 *   maxAttempts: 3,
 * });
 *
 * // Uses defaults:
 * await signer.sign({ message: new Uint8Array([1,2,3]) });
 *
 * // Per-call override:
 * await signer.sign({ keyId: otherKey, signingAlgorithm: "ECDSA_SHA_256", message });
 * ```
 */
export class KmsSigner implements KmsPort {
  private readonly client: KMSClient;
  private readonly maxAttempts: number;

  /** Default KeyId used when a call omits `input.keyId`. */
  private readonly defaultKeyId?: string;

  /** Default algorithm used when a call omits `input.signingAlgorithm`. */
  private readonly defaultAlgorithm: SigningAlgorithmSpec;

  constructor(client: KMSClient, opts: KmsSignerOptions = {}) {
    this.client = client;
    this.maxAttempts = Math.max(1, opts.maxAttempts ?? 3);

    // Back-compat + preferred names
    this.defaultKeyId = opts.defaultKeyId ?? opts.signerKeyId;
    this.defaultAlgorithm =
      (opts.defaultSigningAlgorithm ??
        opts.signingAlgorithm ??
        "RSASSA_PSS_SHA_256") as SigningAlgorithmSpec;
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
          EncryptionContext: input.context,
        })
      );
      if (!res.CiphertextBlob) {
        throw new InternalError("KMS returned empty CiphertextBlob", ErrorCodes.COMMON_INTERNAL_ERROR, {
          op: ctx,
        });
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
          EncryptionContext: input.context,
        })
      );
      if (!res.Plaintext) {
        throw new InternalError("KMS returned empty Plaintext", ErrorCodes.COMMON_INTERNAL_ERROR, {
          op: ctx,
        });
      }
      return { plaintext: res.Plaintext };
    });
  }

  /**
   * Signs a message (RAW or DIGEST) with the specified (or default) key and algorithm.
   *
   * - If the message length matches the digest size for SHA-256/384/512, `MessageType` is set to `DIGEST`;
   *   otherwise `RAW` is used.
   */
  async sign(input: KmsSignInput): Promise<{ signature: Uint8Array }> {
    const ctx = "KmsSigner.sign";
    const keyId = (input as any).keyId ?? this.defaultKeyId;
    if (!keyId) {
      throw new BadRequestError("Missing KeyId", ErrorCodes.COMMON_BAD_REQUEST);
    }

    const algo = (input as any).signingAlgorithm ?? this.defaultAlgorithm;
    const messageType = pickMessageType(input.message, algo);

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new SignCommand({
          KeyId: keyId,
          Message: input.message,
          MessageType: messageType,
          SigningAlgorithm: algo as SigningAlgorithmSpec,
        })
      );
      if (!res.Signature) {
        throw new InternalError("KMS returned empty Signature", ErrorCodes.COMMON_INTERNAL_ERROR, {
          op: ctx,
        });
      }
      return { signature: res.Signature };
    });
  }

  /**
   * Verifies a signature for a message using the specified (or default) key and algorithm.
   *
   * - Automatically selects `MessageType` (RAW/DIGEST) using the same heuristic as {@link sign}.
   */
  async verify(input: KmsVerifyInput): Promise<{ valid: boolean }> {
    const ctx = "KmsSigner.verify";
    const keyId = (input as any).keyId ?? this.defaultKeyId;
    if (!keyId) {
      throw new BadRequestError("Missing KeyId", ErrorCodes.COMMON_BAD_REQUEST);
    }

    const algo = (input as any).signingAlgorithm ?? this.defaultAlgorithm;
    const messageType = pickMessageType(input.message, algo);

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new VerifyCommand({
          KeyId: keyId,
          Message: input.message,
          MessageType: messageType,
          Signature: input.signature,
          SigningAlgorithm: algo as SigningAlgorithmSpec,
        })
      );
      return { valid: Boolean(res.SignatureValid) };
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
}
