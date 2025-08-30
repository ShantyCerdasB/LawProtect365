/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { actorFromCtx } from "@/presentation/middleware/auth";
import { validateRequest } from "@lawprotect/shared-ts";
import { FinaliseEnvelopeBody } from "@/schemas/requests";
import { toEnvelopeId } from "@/app/ports/shared";
import { getContainer } from "@/core/Container";
import { makeRequestsCommandsPort } from "@/app/adapters/requests/makeRequestsCommandsPort";
import { z } from "zod";

const base = async (evt: any) => {
  const { path, body } = validateRequest(evt, {
    path: z.object({ id: z.string() }),
    body: FinaliseEnvelopeBody,
  });

  const actor = actorFromCtx(evt);
  const c = getContainer();

  const requestsCommands = makeRequestsCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    c.repos.inputs,
    {
      ids: c.ids,
      events: { publish: async (event: any) => { await c.events.publisher.publish(event); } },
      audit: c.audit,
    }
  );

  const result = await requestsCommands.finaliseEnvelope({
    envelopeId: toEnvelopeId(path.id),
    message: body.message,
    actor,
  });

  return {
    statusCode: 202,
    body: result,
  };
};

export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
