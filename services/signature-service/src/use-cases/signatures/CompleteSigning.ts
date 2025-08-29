// src/use-cases/signatures/CompleteSigning.ts
/**
 * @file CompleteSigning.ts
 * @summary Use case to complete a signer’s execution of a document.
 *
 * @description
 * Validates the request token and domain constraints, optionally verifies an OTP,
 * signs the provided digest with KMS using an allowed algorithm, and transitions
 * both party and envelope states. Emits a single audit event with consistent
 * timestamps and actor metadata.
 */

import { nowIso, type Repository, type ISODateString } from "@lawprotect/shared-ts";
import type { EventEnvelope } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { KmsAlgorithmType } from "@/domain/value-objects";

import { assertOtpValid } from "@/domain/rules/ConsentMfa.rules";
import { assertKmsAlgorithmAllowed } from "@/domain/rules/Signing.rules";
import {
  ensureEnvelope,
  ensureSignerInEnvelope,
  requireTokenScope,
  assertEnvelopeCompletable,
} from "@/use-cases/shared/guards/signatures.guard"; // <- fix path
import type {
  EnvelopeSignerScoped,
  WithActorPublic,
  WithRequestToken,
} from "@/use-cases/shared/types/signature";
import type { WithDigest } from "@/use-cases/shared/types/signature"; // <- use enum type for digest.alg

import {
  envelopeNotFound,
  partyNotFound,
  otpInvalid,
  kmsPermissionDenied,
  invalidEnvelopeState,
  signatureFailed,
} from "@/errors";

import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";
import type { EventBridgePublisher } from "@/adapters/eventbridge/EventBridgePublisher";
import type { KmsSigner } from "@/adapters/kms/KmsSigner";
import { base64urlToBytes } from "@/utils/Base64Url.util";

/** Input contract for completing signing. */
export interface CompleteSigningInput
  extends EnvelopeSignerScoped,
    WithRequestToken,
    WithActorPublic {
  /** Precomputed digest to sign (base64url, no padding). */
  digest: WithDigest["digest"];   
  /** KMS signing algorithm to use (must be allowed by policy). */
  algorithm: KmsAlgorithmType;
  /** Optional override for the KMS key id. */
  keyId?: string;
  /** Optional OTP provided by the signer (when MFA is enabled). */
  otpCode?: string;
}

/** Output contract for completing signing. */
export interface CompleteSigningOutput {
  completedAt: string;
  envelopeId: string;
  signerId: string;
  signature: string;
  keyId: string;
  algorithm: KmsAlgorithmType;
}

/** Execution context for completing signing. */
export interface CompleteSigningContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
    parties: Repository<Party, { envelopeId: string; partyId: string }>;
  };
  signer: KmsSigner;
  events: EventBridgePublisher;
  idempotency: IdempotencyRunner;
  ids: { ulid(): string };
  time: { now(): number };
  signing: {
    defaultKeyId: string;
    allowedAlgorithms?: readonly string[];
  };
}

export const executeCompleteSigning = async (
  input: CompleteSigningInput,
  ctx: CompleteSigningContext
): Promise<CompleteSigningOutput> => {
  // 1) Request token
  requireTokenScope(input.token, "signing", ctx.time.now());

  // 2) Envelope + lifecycle
  const envelopesRepo = {
    getById: (id: string) => ctx.repos.envelopes.getById(id as EnvelopeId),
  };
  const env = await ensureEnvelope(envelopesRepo, input.envelopeId);
  try {
    assertEnvelopeCompletable(env.status, input.envelopeId);
  } catch {
    throw invalidEnvelopeState({
      envelopeId: input.envelopeId,
      currentState: env.status,
      requiredState: "sent",
    });
  }

  // 3) Party (signer) — adapt repo shape to PartyLike to satisfy ensureSignerInEnvelope
  const partyRepo = {
    async getById(keys: { envelopeId: string; partyId: string }) {
      const p = await ctx.repos.parties.getById(keys);
      if (!p) return null;
      // Widen Party → PartyLike by adding an index signature via object spread.
      return { ...p } as unknown as { envelopeId: string; partyId: string } & Record<string, unknown>;
    },
  };
  const party = await ensureSignerInEnvelope(partyRepo, input.envelopeId, input.signerId);

  // 4) OTP (if required)
  const otpState = (party as { otpState?: { expiresAt: string; tries?: number; maxTries: number } })
    .otpState;
  if (otpState) {
    try {
      assertOtpValid({
        required: true,
        code: input.otpCode ?? "",
        expiresAt: new Date(otpState.expiresAt).getTime(),
        tries: otpState.tries,
        maxTries: otpState.maxTries,
      });
    } catch {
      throw otpInvalid({ envelopeId: input.envelopeId, partyId: input.signerId });
    }
  }

  // 5) KMS sign digest
  const keyId = input.keyId ?? ctx.signing.defaultKeyId;
  try {
    assertKmsAlgorithmAllowed(input.algorithm, ctx.signing.allowedAlgorithms);
    const message = base64urlToBytes(input.digest.value);

    const { signature } = await ctx.signer.sign({
      keyId,
      signingAlgorithm: input.algorithm,
      message,
    });

    // 6) Persist + event (single timestamp)
    const ts = nowIso() as ISODateString;
    const requestId = ctx.ids.ulid();

    await ctx.repos.envelopes.update(input.envelopeId as EnvelopeId, {
      status: "completed",
      updatedAt: ts,
    });

    await ctx.repos.parties.update(
      { envelopeId: input.envelopeId, partyId: input.signerId },
      { status: "signed", signedAt: ts }
    );

    const event: EventEnvelope = {
      name: "signing.completed",
      meta: { id: requestId, ts, source: "signature-service" },
      data: {
        envelopeId: input.envelopeId,
        partyId: input.signerId,
        completedAt: ts,
        metadata: {
          ip: input.actor?.ip,
          userAgent: input.actor?.userAgent,
          locale: input.actor?.locale ?? "en-US",
          requestId,
        },
      },
    };
    await ctx.events.publish(event);

    return {
      completedAt: ts,
      envelopeId: input.envelopeId,
      signerId: input.signerId,
      signature: Buffer.from(signature).toString("base64url"),
      keyId,
      algorithm: input.algorithm,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("permission")) {
      throw kmsPermissionDenied({ envelopeId: input.envelopeId, keyId });
    }
    if (message === "Envelope not found") {
      throw envelopeNotFound({ envelopeId: input.envelopeId });
    }
    if (message === "Party not found") {
      throw partyNotFound({ envelopeId: input.envelopeId, partyId: input.signerId });
    }
    throw signatureFailed({ envelopeId: input.envelopeId, error: message });
  }
};
