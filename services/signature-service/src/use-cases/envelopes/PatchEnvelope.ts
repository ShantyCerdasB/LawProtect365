/**
 * @file PatchEnvelope.ts
 * @summary Partially updates envelope fields while enforcing lifecycle rules.
 *
 * @description
 * - Loads the current envelope.
 * - For structural mutations (title, parties, documents), requires `draft`.
 * - Applies the patch and persists via repository.
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import { envelopeNotFound } from "@/shared/errors";
import * as Rules from "@/domain/rules";

export interface PatchEnvelopeInput {
  envelopeId: EnvelopeId;
  title?: string;
  // add domain fields as needed
}

export interface PatchEnvelopeOutput {
  envelope: Envelope;
}

export interface PatchEnvelopeContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
  };
}

export const patchEnvelope = async (
  input: PatchEnvelopeInput,
  ctx: PatchEnvelopeContext
): Promise<PatchEnvelopeOutput> => {
  const current = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!current) throw envelopeNotFound({ envelopeId: input.envelopeId });

  // Structural changes only allowed in draft
  Rules.EnvelopeLifecycle.assertDraft({ envelopeId: current.envelopeId, status: current.status });

  const next = await ctx.repos.envelopes.update(input.envelopeId, {
    title: input.title?.trim() ?? current.title,
  });

  return { envelope: next };
};
