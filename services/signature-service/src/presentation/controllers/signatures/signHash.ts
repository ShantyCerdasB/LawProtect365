/**
 * @file signHash.ts
 * @summary HTTP controller for POST /signatures/hash:sign
 *
 * @description
 * Internal endpoint that accepts a precomputed hash digest and returns a KMS signature.
 * - Auth enforced by the shared pipeline (JWT)
 * - Input validated via Zod (local schema helper)
 * - Delegates to the SignHash use case
 * - Errors are mapped uniformly by the shared HTTP middleware
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { parseSignHashRequest } from "@/schemas/signing/SignHash.schema";
import { executeSignHash } from "@/use-cases/signatures/SignHash";
import { getContainer } from "@/core/Container";

/**
 * Business handler: signs a precomputed hash digest using KMS.
 *
 * @param evt API event enriched by middleware (auth, logger, ids).
 * @returns 200 OK with `{ data: { signature, algorithm, keyId } }`.
 * @throws Domain/App errors which are mapped by the shared middleware.
 */
const base: HandlerFn = async (evt) => {
  // Validate & parse request body
  const request = parseSignHashRequest(evt);

  // Observability context (provided by wrapController)
  const ctx = (evt as any).ctx;
  const logger = ctx?.logger ?? console;

  // Resolve dependencies
  const { crypto: { signer }, config } = getContainer();

  // Execute use case
  const result = await executeSignHash(
    {
      digest: request.digest,
      algorithm: request.algorithm,
      keyId: request.keyId,
    },
    {
      kms: signer,
      defaultKeyId: config.kms.signerKeyId,
      // Keep the allowed algorithms constrained by configuration
      allowedAlgorithms: [config.kms.signingAlgorithm],
    }
  );

  logger?.info?.("Hash digest signed successfully", {
    requestId: ctx?.requestId,
    algorithm: result.algorithm,
    keyId: result.keyId,
  });

  // Uniform payload shape across controllers
  return ok({ data: result });
};

/**
 * Lambda handler with:
 * - Request IDs & observability
 * - JWT auth
 * - CORS and uniform error mapping
 */
export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
