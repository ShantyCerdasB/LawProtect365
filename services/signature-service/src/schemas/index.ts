/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { z } from "@lawprotect/shared-ts/validation";

/** Example reusable schemas; extend by route */
export const EnvelopeId = z.string().min(1);
export const DocumentId = z.string().min(1);
export const InputId    = z.string().min(1);
export const PartyId    = z.string().min(1);
