// src/use-cases/signatures/PresignUpload.ts

/**
 * @file PresignUpload.ts
 * @summary Generate a pre-signed PUT URL to upload a document.
 *
 * Validates the request token, loads the target envelope, asserts that the
 * current lifecycle state allows uploads, validates basic filename/content-type
 * constraints, builds a stable object key, and returns a time-limited URL for
 * uploading to object storage.
 */

import type { Repository, S3Presigner } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import { assertUploadAllowed } from "@/domain/rules/Upload.rules";

import {
  ensureEnvelope,
  requireTokenScope,
} from "@/use-cases/shared/guards/signatures.guard";

import {
  envelopeNotFound,
  requestTokenInvalid,
  invalidUploadRequest,
} from "@/errors";

import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";

// ────────────────────────────────────────────────────────────────────────────────
// Contracts
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Input contract for generating a pre-signed upload URL.
 */
export interface PresignUploadInput {
  /** Envelope identifier. */
  envelopeId: string;
  /** Desired filename for the upload (used in the object key). */
  filename: string;
  /** MIME content type to be uploaded. */
  contentType: string;
  /** Opaque bearer token issued for the `presign` scope. */
  token: string;
  /** Optional actor metadata for auditing/telemetry. */
  actor?: { ip?: string; userAgent?: string; locale?: string };
}

/**
 * Output contract with the pre-signed URL and related metadata.
 */
export interface PresignUploadOutput {
  /** Time-limited URL to perform the PUT upload. */
  uploadUrl: string;
  /** Final object key where the upload will be stored. */
  objectKey: string;
  /** Absolute expiration timestamp (ISO 8601) for the URL. */
  expiresAt: string;
}

/**
 * Execution context required by the use case.
 */
export interface PresignUploadContext {
  repos: {
    /** Envelope repository (keyed by EnvelopeId). */
    envelopes: Repository<Envelope, EnvelopeId>;
  };
  /** Object storage presigner. */
  s3: S3Presigner;
  /** Idempotency runner (not used here but kept for parity with other flows). */
  idempotency: IdempotencyRunner;
  /** Id generator. */
  ids: { ulid(): string };
  /** Time source (injectable for testing). */
  time: { now(): number };
  /** Upload configuration parameters. */
  config: {
    /** Bucket where user uploads are staged. */
    uploadBucket: string;
    /** URL time to live in seconds. */
    uploadTtlSeconds: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────────
/** Normalize minor spelling differences for status values used by rule guards. */
function normalizeStatusForRules(s: Envelope["status"] | string): string {
  return s === "canceled" ? "cancelled" : s;
}

// ────────────────────────────────────────────────────────────────────────────────
// Use case
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Generate a pre-signed PUT URL for uploading a document to object storage.
 *
 * @param input - Caller-supplied request data.
 * @param ctx - Execution context (repositories, presigner, config, clock).
 * @returns A time-limited URL and object key for the upload.
 *
 * @throws {UnauthorizedError} When the request token is invalid/expired.
 * @throws {NotFoundError} When the envelope does not exist.
 * @throws {ConflictError} When the envelope state does not allow uploads.
 * @throws {BadRequestError} When filename or content type is empty/invalid.
 * @throws {InternalError} On storage/presigning failures.
 */
export const executePresignUpload = async (
  input: PresignUploadInput,
  ctx: PresignUploadContext
): Promise<PresignUploadOutput> => {
  // 1) Token scope (maps any error to domain 401)
  try {
    requireTokenScope(input.token, "presign", ctx.time.now());
  } catch (error) {
    throw requestTokenInvalid({ token: input.token, error });
  }

  // 2) Envelope existence (via shared guard)
  const envelopesRepo = {
    getById: (id: string) => ctx.repos.envelopes.getById(id as EnvelopeId),
  };
  const envelope = await ensureEnvelope(envelopesRepo, input.envelopeId).catch((e) => {
    throw envelopeNotFound({ envelopeId: input.envelopeId, error: e });
  });

  // 3) Domain rule: uploads allowed for current status
  assertUploadAllowed(normalizeStatusForRules(envelope.status) as any);

  // 4) Basic input validation
  const filename = (input.filename ?? "").trim();
  if (!filename) {
    throw invalidUploadRequest({ field: "filename", reason: "Filename cannot be empty" });
  }
  const contentType = (input.contentType ?? "").trim();
  if (!contentType) {
    throw invalidUploadRequest({ field: "contentType", reason: "Content type cannot be empty" });
  }

  // 5) Build object key (deterministic & collision-resistant)
  const tsIso = new Date(ctx.time.now()).toISOString();
  const objectKey = `uploads/${envelope.envelopeId}/${tsIso}-${ctx.ids.ulid()}-${filename}`;

  // 6) Create pre-signed PUT URL
  const metadata: Record<string, string> = {
    envelopeId: envelope.envelopeId,
    uploadedAt: tsIso,
  };
  if (input.actor) {
    metadata.actor = JSON.stringify(input.actor);
  }

  const uploadUrl = await ctx.s3.putObjectUrl({
    bucket: ctx.config.uploadBucket,
    key: objectKey,
    contentType,
    expiresInSeconds: ctx.config.uploadTtlSeconds,
    metadata,
  });

  // 7) Expiration timestamp (use injected clock)
  const expiresAt = new Date(ctx.time.now() + ctx.config.uploadTtlSeconds * 1000).toISOString();

  // 8) Return contract
  return {
    uploadUrl,
    objectKey,
    expiresAt,
  };
};
