/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { apiHandler, ok } from "@lawprotect/shared-ts/http";
import { authenticate } from "@lawprotect/shared-ts/auth";
import { z, validate } from "@lawprotect/shared-ts/validation";

const Params = z.object({});      // adjust per-route
const Query  = z.object({});      // adjust per-route
const Body   = z.object({}).optional(); // adjust per-route

export const handler = apiHandler(async (evt) => {
  const auth = await authenticate(evt); // principal/tenant/scopes
  const { params, query, body } = validate(evt, { params: Params, query: Query, body: Body });

  // TODO: call use-case via DI from infra (e.g., ctx.getUseCase("..."))
  // const result = await useCase.execute({ ...params, ...query, ...body }, { auth });

  return ok({ status: "stub", route: evt.requestContext?.http?.path });
});
