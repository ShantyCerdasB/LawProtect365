/**
 * @file InvitationErrors.ts
 * @summary Custom errors for invitation management
 * @description Defines invitation-specific error classes
 */

import { HttpError } from "@lawprotect/shared-ts";

/** 403 Forbidden - Document access denied */
export class DocumentAccessDeniedError extends HttpError<string> {
  constructor(
    message = "Access denied to this document",
    code: string = "DOCUMENT_ACCESS_DENIED",
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Invitation token expired */
export class InvitationTokenExpiredError extends HttpError<string> {
  constructor(
    message = "Invitation token has expired",
    code: string = "INVITATION_TOKEN_EXPIRED",
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Invalid invitation token */
export class InvitationTokenInvalidError extends HttpError<string> {
  constructor(
    message = "Invalid invitation token",
    code: string = "INVITATION_TOKEN_INVALID",
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Invitation token already used */
export class InvitationTokenAlreadyUsedError extends HttpError<string> {
  constructor(
    message = "Invitation token has already been used",
    code: string = "INVITATION_TOKEN_ALREADY_USED",
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 404 Not Found - Invitation not found */
export class InvitationNotFoundError extends HttpError<string> {
  constructor(
    message = "Invitation not found",
    code: string = "INVITATION_NOT_FOUND",
    details?: unknown
  ) {
    super(404, code, message, details);
  }
}

/** 403 Forbidden - Consent not recorded */
export class ConsentNotRecordedError extends HttpError<string> {
  constructor(
    message = "Consent must be recorded before signing",
    code: string = "CONSENT_NOT_RECORDED",
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}
