/**
 * @file signature.ts
 * @summary Signature-specific mixins.
 */
import type { KmsAlgorithmType } from "@/domain/value-objects";
import { HashAlgorithm } from "@/domain/values/enums";
import { ActorInfo, EnvelopeScoped } from "../common/use-case-inputs";

/** Actor público (añade locale). */
export type WithActorPublic = { actor?: ActorInfo & { locale?: string } };

/** Token opaco para flujos públicos. */
export type WithRequestToken = { token: string };

/** Identificadores de ámbito. */
export type SignerScoped = { signerId: string };
export type EnvelopeSignerScoped = EnvelopeScoped & SignerScoped;

/** Datos “técnicos” de firma. */
export type WithDigest = { digest: { alg: HashAlgorithm; value: string } };
export type WithKms    = { algorithm: KmsAlgorithmType; keyId?: string };
export type WithOtp    = { otpCode?: string };

/** Campos semánticos comunes. */
export type WithReason = { reason: string };
