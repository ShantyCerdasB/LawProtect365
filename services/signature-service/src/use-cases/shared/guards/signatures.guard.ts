// file: src/use-cases/shared/guards/signature.ts
/**
 * @file signature.ts
 * @summary Reusable guards for public signature flows.
 *
 * @description
 * - Envelope guard (no tenant boundary)
 * - Party guard with composite key { envelopeId, partyId }
 * - Request-token assertion → mapea a 401 de dominio
 * - Helper de ciclo de vida para completar (usa EnvelopeStatus VO)
 */

import { envelopeNotFound, partyNotFound, requestTokenInvalid, invalidEnvelopeState } from "@/errors";
import { assertRequestToken } from "@/domain/rules/Token.rules";
import { assertLifecycleTransition } from "@/domain/rules/EnvelopeLifecycle.rules";
import type { EnvelopeStatus } from "@/domain/value-objects/EnvelopeStatus";
import type { RequestTokenScope } from "@/domain/value-objects/RequestToken";

/** Minimal envelope shape esperado por estos guards. */
type EnvelopeLike = { envelopeId: string; status: EnvelopeStatus };

/** Repo con get por ID para envelopes. */
type EnvelopesRepo = { getById(id: string): Promise<EnvelopeLike | null> };

/** Minimal party shape; el resto de campos (otpState, etc.) quedan opacos. */
type PartyLike = { envelopeId: string; partyId: string } & Record<string, unknown>;

/** Repo con get por clave compuesta para parties. */
type PartiesRepo = {
  getById(keys: { envelopeId: string; partyId: string }): Promise<PartyLike | null>;
};

/**
 * Asegura que el envelope exista (sin boundary de tenant en flujos públicos).
 * @throws 404 si no existe.
 */
export async function ensureEnvelope(
  envelopes: EnvelopesRepo,
  envelopeId: string
): Promise<EnvelopeLike> {
  const env = await envelopes.getById(envelopeId);
  if (!env) throw envelopeNotFound({ envelopeId });
  return env;
}

/**
 * Asegura que el signer (party) exista dentro del envelope (clave compuesta).
 * @throws 404 si no existe.
 */
export async function ensureSignerInEnvelope(
  parties: PartiesRepo,
  envelopeId: string,
  signerId: string
): Promise<PartyLike> {
  const p = await parties.getById({ envelopeId, partyId: signerId });
  if (!p) throw partyNotFound({ envelopeId, partyId: signerId });
  return p;
}

/**
 * Valida el request token para un scope dado y mapea cualquier fallo a 401.
 */
export function requireTokenScope(
  token: string,
  scope: RequestTokenScope,
  now: number
): void {
  try {
    assertRequestToken(token, scope, now);
  } catch (error) {
    throw requestTokenInvalid({ token, error });
  }
}

/**
 * Helper: asegura que el envelope puede transicionar a "completed".
 * Nota: mientras el tipo de `assertLifecycleTransition` no acepte tus nuevos enums,
 * casteamos los args para evitar desajustes de tipos en compilación.
 */
export function assertEnvelopeCompletable(
  current: EnvelopeStatus,
  envelopeId: string
): void {
  try {
    (assertLifecycleTransition as unknown as (c: string, t: string) => void)(current, "completed");
  } catch {
    throw invalidEnvelopeState({
      envelopeId,
      currentState: current,
      requiredState: "sent",
    });
  }
}
