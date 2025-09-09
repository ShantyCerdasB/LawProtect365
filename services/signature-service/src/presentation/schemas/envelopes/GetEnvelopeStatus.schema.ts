/**
 * @file GetEnvelopeStatus.schema.ts
 * @summary Request/response schemas for getting envelope status
 * @description Defines Zod schemas for envelope status retrieval operations
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeWithIdParams, BaseEnvelopeFields } from "./common";

/**
 * @description Path parameters schema for getting envelope status
 */
export const GetEnvelopeStatusParams = EnvelopeWithIdParams;
export type GetEnvelopeStatusParams = z.infer<typeof GetEnvelopeStatusParams>;

/**
 * @description Response schema for envelope status
 */
export const GetEnvelopeStatusResponse = BaseEnvelopeFields;
export type GetEnvelopeStatusResponse = z.infer<typeof GetEnvelopeStatusResponse>;






