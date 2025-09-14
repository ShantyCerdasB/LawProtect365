/**
 * @file PrepareSigning.schema.ts
 * @summary Prepare Signing request schemas
 * @description Zod schemas for signing preparation requests
 */

import { z } from "zod";
import { EnvelopeIdSchema, PartyIdSchema } from "@/domain/value-objects/ids";

/**
 * @description Body schema for prepare signing request
 */
export const PrepareSigningBody = z.object({
  /** The signer/party ID */
  signerId: PartyIdSchema});

/**
 * @description Path schema for prepare signing request
 */
export const PrepareSigningParams = z.object({
  /** The envelope ID */
  id: EnvelopeIdSchema});

