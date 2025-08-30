/**
 * @file GetEnvelopeStatus.ts
 * @summary Returns consolidated status for an envelope.
 *
 * @description
 * - Loads the envelope and (optionally) aggregates child state if needed.
 * - This sample returns the current lifecycle status from the aggregate.
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import { envelopeNotFound } from "@/shared/errors";

export interface GetEnvelopeStatusInput {
  envelopeId: EnvelopeId;
}

export interface GetEnvelopeStatusOutput {
  envelopeId: EnvelopeId;
  status: Envelope["status"];
}

export interface GetEnvelopeStatusContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
  };
}

export const getEnvelopeStatus = async (
  input: GetEnvelopeStatusInput,
  ctx: GetEnvelopeStatusContext
): Promise<GetEnvelopeStatusOutput> => {
  const env = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!env) throw envelopeNotFound({ envelopeId: input.envelopeId });

  return { envelopeId: env.envelopeId, status: env.status };
};
