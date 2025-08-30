/**
 * @file DeleteEnvelope.ts
 * @summary Deletes a draft envelope.
 *
 * @description
 * - Only allowed in `draft` state.
 * - Idempotent delete at the repository (conditional).
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import { envelopeNotFound } from "@/shared/errors";
import * as Rules from "@/domain/rules";

export interface DeleteEnvelopeInput {
  envelopeId: EnvelopeId;
}

export interface DeleteEnvelopeContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
  };
}

export const deleteEnvelope = async (
  input: DeleteEnvelopeInput,
  ctx: DeleteEnvelopeContext
): Promise<void> => {
  const current = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!current) throw envelopeNotFound({ envelopeId: input.envelopeId });

  Rules.EnvelopeLifecycle.assertDraft({ envelopeId: current.envelopeId, status: current.status });
  await ctx.repos.envelopes.delete(input.envelopeId);
};
