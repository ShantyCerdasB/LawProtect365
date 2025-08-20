// src/adapters/kms/KmsSigner.ts
/**
 * @file KmsSigner.ts
 * @summary AWS KMS adapter implementing the shared `KmsPort` contract.
 * @description
 * - Uses AWS SDK v3 (@aws-sdk/client-kms)
 * - Normalizes provider failures via `mapAwsError`
 * - Retries throttling/5xx using shared jittered backoff (`shouldRetry`, `isAwsRetryable`)
 * - Picks MessageType RAW vs DIGEST automatically for `sign/verify`
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

import { mapAwsError } from "@lawprotect/shared-ts";
import { shouldRetry } from "@lawprotect/shared-ts";
import { isAwsRetryable } from "@lawprotect/shared-ts";

/** Minimal config for the adapter. Extend as needed. */
export interface KmsSignerOptions {
  /** Max total attempts per call (retries = maxAttempts - 1). Default: 3 */
  maxAttempts?: number;
  /** Backoff base/cap/jitter are taken from shared defaults via `shouldRetry`. */
}

/** Small sleep helper (kept local to avoid extra deps). */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/** Heuristic: choose MessageType (RAW vs DIGEST) based on algorithm + message size. */
const pickMessageType = (
  message: Uint8Array,
  signingAlgorithm?: string
): "RAW" | "DIGEST" => {
  const algo = String(signingAlgorithm ?? "").toUpperCase();
  // Common KMS algos: RSASSA_PSS_SHA_256, RSASSA_PKCS1_V1_5_SHA_256, ECDSA_SHA_256, etc.
  const isSha256 = algo.includes("SHA_256");
  // If caller passed a 32-byte value and algo mentions SHA_256, assume it is a digest.
  if (isSha256 && message.byteLength === 32) return "DIGEST";
  return "RAW";
};

/**
 * AWS KMS adapter that fulfills the shared `KmsPort`.
 * Inject your preconfigured `KMSClient` (region/creds/middleware) from bootstrap.
 */
export class KmsSigner implements KmsPort {
  private readonly client: KMSClient;
  private readonly maxAttempts: number;

  constructor(client: KMSClient, opts: KmsSignerOptions = {}) {
    this.client = client;
    this.maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  }

  async encrypt(input: KmsEncryptInput): Promise<{ ciphertext: Uint8Array }> {
    const ctx = "KmsSigner.encrypt";
    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new EncryptCommand({
          KeyId: input.keyId,
          Plaintext: input.plaintext,
          EncryptionContext: input.context,
        })
      );
      if (!res.CiphertextBlob) throw mapAwsError(new Error("Empty CiphertextBlob"), ctx);
      return { ciphertext: res.CiphertextBlob };
    });
  }

  async decrypt(input: KmsDecryptInput): Promise<{ plaintext: Uint8Array }> {
    const ctx = "KmsSigner.decrypt";
    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new DecryptCommand({
          CiphertextBlob: input.ciphertext,
          EncryptionContext: input.context,
        })
      );
      if (!res.Plaintext) throw mapAwsError(new Error("Empty Plaintext"), ctx);
      return { plaintext: res.Plaintext };
    });
  }

  async sign(input: KmsSignInput): Promise<{ signature: Uint8Array }> {
    const ctx = "KmsSigner.sign";
    const messageType = pickMessageType(input.message, input.signingAlgorithm);
    const algo = (input.signingAlgorithm ??
      "RSASSA_PSS_SHA_256") as SigningAlgorithmSpec;

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new SignCommand({
          KeyId: input.keyId,
          Message: input.message,
          MessageType: messageType,
          SigningAlgorithm: algo,
        })
      );
      if (!res.Signature) throw mapAwsError(new Error("Empty Signature"), ctx);
      return { signature: res.Signature };
    });
  }

  async verify(input: KmsVerifyInput): Promise<{ valid: boolean }> {
    const ctx = "KmsSigner.verify";
    const messageType = pickMessageType(input.message, input.signingAlgorithm);
    const algo = (input.signingAlgorithm ??
      "RSASSA_PSS_SHA_256") as SigningAlgorithmSpec;

    return this.withRetry(ctx, async () => {
      const res = await this.client.send(
        new VerifyCommand({
          KeyId: input.keyId,
          Message: input.message,
          MessageType: messageType,
          Signature: input.signature,
          SigningAlgorithm: algo,
        })
      );
      return { valid: Boolean(res.SignatureValid) };
    });
  }

  /**
   * Shared retry wrapper:
   * - Uses `isAwsRetryable` classification
   * - Delay policy via `shouldRetry` (full/decorrelated jitter in shared)
   * - On non-retryable or maxed attempts → map via `mapAwsError`
   */
  private async withRetry<T>(op: string, fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const { retry, delayMs } = shouldRetry(attempt, this.maxAttempts, isAwsRetryable, err);
        if (!retry) throw mapAwsError(err, op);
        await sleep(delayMs);
      }
    }
    // Should not reach here, but keep a safe fallback:
    throw mapAwsError(lastErr, op);
  }
}
