// src/use-cases/signatures/DownloadSignedDocument.ts

/**
 * @file DownloadSignedDocument.ts
 * @summary Generate a pre-signed URL to download a signed document.
 *
 * Validates the request token, loads the target envelope, asserts that the
 * current lifecycle state allows downloads, and returns a time-limited URL
 * to fetch the signed artifact from object storage.
 */

import type { Repository, S3Presigner } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import { assertDownloadAllowed } from "@/domain/rules/Download.rules";

import {
  ensureEnvelope,
  requireTokenScope,
} from "@/use-cases/shared/guards/signatures.guard";

import {
  envelopeNotFound,
  requestTokenInvalid,
  invalidDownloadRequest,
} from "@/errors";

import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";

// ────────────────────────────────────────────────────────────────────────────────
// Contracts
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Input contract for generating a download URL for a signed document.
 */
export interface DownloadSignedDocumentInput {
  /** Envelope identifier. */
  envelopeId: string;
  /** Opaque bearer token issued for the `download` scope. */
  token: string;
  /** Optional actor metadata for auditing/telemetry. */
  actor?: { ip?: string; userAgent?: string; locale?: string };
}

/**
 * Output contract containing the pre-signed URL and related metadata.
 */
export interface DownloadSignedDocumentOutput {
  /** Time-limited URL to download the signed document. */
  downloadUrl: string;
  /** Absolute expiration timestamp (ISO 8601) for the URL. */
  expiresAt: string;
  /** Suggested filename for the downloaded document. */
  filename: string;
  /** MIME type of the downloaded content. */
  contentType: string;
  /** Optional file size in bytes, when available. */
  fileSize?: number;
}

/**
 * Execution context required by the use case.
 */
export interface DownloadSignedDocumentContext {
  repos: {
    /** Envelope repository (keyed by EnvelopeId). */
    envelopes: Repository<Envelope, EnvelopeId>;
  };
  /** Object storage presigner. */
  s3: S3Presigner;
  /** Idempotency runner (not used here but part of the standard context). */
  idempotency: IdempotencyRunner;
  /** Id generator (not used here but kept for parity with other flows). */
  ids: { ulid: () => string };
  /** Time source (injectable for testing). */
  time: { now: () => number };
  /** Download configuration parameters. */
  config: {
    /** Bucket containing finalized/signed documents. */
    signedBucket: string;
    /** URL time to live in seconds. */
    downloadTtlSeconds: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Narrow an envelope-like object to one that contains a non-empty `signedDocumentKey`.
 */
function hasSignedDocumentKey(
  e: unknown
): e is { envelopeId: string; status: Envelope["status"] | string; signedDocumentKey: string } {
  return (
    !!e &&
    typeof e === "object" &&
    "signedDocumentKey" in e &&
    typeof (e as any).signedDocumentKey === "string" &&
    (e as any).signedDocumentKey.length > 0
  );
}

/**
 * Normalize minor spelling differences for status values used by rule guards.
 * E.g., `"canceled"` (US) → `"cancelled"` (UK).
 */
function normalizeStatusForRules(s: Envelope["status"] | string): string {
  return s === "canceled" ? "cancelled" : s;
}

// ────────────────────────────────────────────────────────────────────────────────
// Use case
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Generate a pre-signed download URL for the finalized signed document.
 *
 * @param input - Caller-supplied request data.
 * @param ctx - Execution context (repositories, presigner, config, clock).
 * @returns A time-limited URL and related metadata to download the document.
 *
 * @throws {UnauthorizedError} When the request token is invalid/expired.
 * @throws {NotFoundError} When the envelope does not exist.
 * @throws {ConflictError} When the envelope state does not allow downloads.
 * @throws {BadRequestError} When no signed document is available.
 * @throws {InternalError} On storage/presigning failures.
 */
export const executeDownloadSignedDocument = async (
  input: DownloadSignedDocumentInput,
  ctx: DownloadSignedDocumentContext
): Promise<DownloadSignedDocumentOutput> => {
  // 1) Token scope (maps any error to domain 401)
  try {
    requireTokenScope(input.token, "download", ctx.time.now());
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

  // 3) Domain rule: downloads allowed for current status
  //    Normalize spelling differences before invoking the rule guard.
  assertDownloadAllowed(normalizeStatusForRules(envelope.status) as any);

  // 4) Ensure there is a signed artifact to download (narrow the type safely)
  if (!hasSignedDocumentKey(envelope)) {
    throw invalidDownloadRequest({
      reason: "No signed document available for this envelope",
      envelopeId: input.envelopeId,
    });
  }

  // 5) Build the pre-signed URL
  const filename = `signed-document-${envelope.envelopeId}.pdf`;
  const downloadUrl = await ctx.s3.getObjectUrl({
    bucket: ctx.config.signedBucket,
    key: envelope.signedDocumentKey,
    responseContentType: "application/pdf",
    responseContentDisposition: `attachment; filename="${filename}"`,
    expiresInSeconds: ctx.config.downloadTtlSeconds,
  });

  // Prefer the injected clock for determinism in tests
  const expiresAt = new Date(ctx.time.now() + ctx.config.downloadTtlSeconds * 1000).toISOString();

  return {
    downloadUrl,
    expiresAt,
    filename,
    contentType: "application/pdf",
  };
};
