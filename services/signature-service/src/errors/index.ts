/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { AppError } from "@lawprotect/shared-ts/errors";

export class EnvelopeNotFound extends AppError {
  constructor(id: string) {
    super("SIGN_ENVELOPE_NOT_FOUND", `Envelope ${id} was not found`, 404);
  }
}
