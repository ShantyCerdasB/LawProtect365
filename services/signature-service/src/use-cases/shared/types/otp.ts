// src/use-cases/shared/contracts/otp.ts

/**
 * @file otp.ts
 * @summary Shared OTP contracts for Request/Verify use cases.
 *
 * @description
 * Centralizes the input/output and context types used by the OTP flows
 * (request and verify). Import these contracts in controllers and use cases
 * to keep signatures consistent across services.
 */

import type { ISODateString, Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { EventBridgePublisher } from "@/adapters/eventbridge/EventBridgePublisher";
import type { RateLimitStore } from "@/adapters/ratelimit/RateLimitStore";
import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";

import type {
  EnvelopeSignerScoped,
  WithRequestToken,
  WithActorPublic,
} from "@/use-cases/shared/types/signature";
import type { OtpChannel } from "@/domain/values/enums";

/**
 * Base input shared by OTP use cases.
 * Combines the standard scoping (envelope + signer) with the public request token
 * and optional actor metadata captured at the transport layer.
 */
export type OtpBaseInput = EnvelopeSignerScoped & WithRequestToken & WithActorPublic;

/**
 * Input for the Request-OTP use case.
 * Extends the base input with the delivery channel ("sms" | "email").
 */
export type OtpRequestInput = OtpBaseInput & { delivery: OtpChannel };

/**
 * Input for the Verify-OTP use case.
 * Extends the base input with the submitted OTP code.
 */
export type OtpVerifyInput = OtpBaseInput & { code: string };

/**
 * Output contract for the Request-OTP use case.
 * Returns neutral metadata only (never the OTP secret).
 */
export interface OtpRequestOutput {
  /** Delivery channel used to send the OTP. */
  channel: OtpChannel;
  /** Absolute expiry timestamp (ISO 8601, branded). */
  expiresAt: ISODateString;
  /** Cooldown hint in seconds before a new OTP can be requested. */
  cooldownSeconds: number;
}

/**
 * Output contract for the Verify-OTP use case.
 * Returns verification status and minimal metadata.
 */
export interface OtpVerifyOutput {
  /** Fixed status when verification succeeds. */
  status: "verified";
  /** Verification timestamp (ISO 8601, branded). */
  verifiedAt: ISODateString;
  /** Envelope identifier. */
  envelopeId: string;
  /** Signer/party identifier within the envelope. */
  signerId: string;
  /** Remaining attempts (best-effort; not security-critical). */
  remainingTries: number;
}

/**
 * Base execution context shared by OTP use cases.
 * Provides repositories, event publisher, clock, id generator, and optional idempotency.
 */
export interface OtpContextBase {
  repos: {
    /** Envelope repository (keyed by EnvelopeId). */
    envelopes: Repository<Envelope, EnvelopeId>;
    /** Party repository (composite key: { envelopeId, partyId }). */
    parties: Repository<Party, { envelopeId: string; partyId: string }>;
  };
  /** Domain event publisher (e.g., EventBridge). */
  events: EventBridgePublisher;
  /** ULID factory. */
  ids: { ulid(): string };
  /** Time source (injectable for testing). */
  time: { now(): number };
  /**
   * Optional idempotency runner. Not all flows need it, but keeping it here
   * allows controllers to pass it without widening each concrete context.
   */
  idempotency?: IdempotencyRunner;
}

/**
 * Execution context for the Request-OTP use case.
 * Extends the base context with a rate-limit store.
 */
export interface OtpRequestContext extends OtpContextBase {
  /** Rate-limit store used to throttle OTP requests. */
  rateLimit: RateLimitStore;
}

/**
 * Execution context for the Verify-OTP use case.
 * No additional dependencies beyond the base context.
 */
export type OtpVerifyContext = OtpContextBase;
