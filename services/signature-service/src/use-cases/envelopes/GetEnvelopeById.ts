/**
 * @file GetEnvelopeById.ts
 * @summary Retrieves a single envelope by id.
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import { envelopeNotFound } from "@/errors";

export interface GetEnvelopeByIdInput {
  envelopeId: EnvelopeId;
}

export interface GetEnvelopeByIdOutput {
  envelope: Envelope;
}

export interface GetEnvelopeByIdContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
  };
}

export const getEnvelopeById = async (
  input: GetEnvelopeByIdInput,
  ctx: GetEnvelopeByIdContext
): Promise<GetEnvelopeByIdOutput> => {
  const env = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!env) throw envelopeNotFound({ envelopeId: input.envelopeId });
  return { envelope: env };
};
