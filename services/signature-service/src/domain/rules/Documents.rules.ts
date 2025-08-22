import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import type { Document } from "../entities";
import { ContentTypeSchema } from "../value-objects/ContentType";

/**
 * Validates that a document:
 *  - Has MIME type `application/pdf`
 *  - Does not exceed the provided maximum size (in bytes)
 *
 * This version accepts the exact shape from the `Document` entity
 * via `Pick<Document, "mimeType" | "size">`.
 *
 * @param doc - A subset of the Document entity containing its MIME type and size.
 * @param maxBytes - Maximum allowed size in bytes.
 * @throws {AppError} 415 (UNSUPPORTED_MEDIA_TYPE) when the MIME type is not PDF.
 * @throws {AppError} 413 (PAYLOAD_TOO_LARGE) when the document exceeds `maxBytes`.
 */
export const assertPdfWithinPolicy = (
  doc: Pick<Document, "mimeType" | "size">,
  maxBytes: number
): void => {
  const ct = ContentTypeSchema.parse(doc.mimeType);
  if (ct !== "application/pdf") {
    throw new AppError(
      ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE,
      415,
      "Only PDF documents are allowed in envelopes"
    );
  }

  if (typeof doc.size === "number" && doc.size > maxBytes) {
    throw new AppError(
      ErrorCodes.COMMON_PAYLOAD_TOO_LARGE,
      413,
      "Document exceeds allowed size"
    );
  }
};

/**
 * Validates that a page number is within the inclusive range [1..totalPages].
 *
 * @param pageNumber - The page number to validate (1-based index).
 * @param totalPages - Total number of pages in the document.
 * @throws {AppError} 400 (BAD_REQUEST) when `pageNumber` is not an integer,
 *                     is less than 1, or is greater than `totalPages`.
 */
export const assertPageInRange = (pageNumber: number, totalPages: number): void => {
  const isValid =
    Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages;

  if (!isValid) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "Requested page is out of range"
    );
  }
};


/**
 * Compatibility wrapper that accepts either:
 *  - `{ mimeType: string; size: number }` (preferred), or
 *  - `{ contentType: string; sizeBytes: number }` (legacy).
 *
 * @param doc - A document-like object with MIME type and size in either shape.
 * @param maxBytes - Maximum allowed size in bytes.
 * @throws {AppError} See {@link assertPdfWithinPolicy} for possible errors.
 */
export const assertPdfWithinPolicyFlexible = (
  doc:
    | { mimeType: string; size: number }
    | { contentType: string; sizeBytes: number },
  maxBytes: number
): void => {
  const mimeType = "mimeType" in doc ? doc.mimeType : doc.contentType;
  const size = "size" in doc ? doc.size : doc.sizeBytes;

  // Reuse the main validator by adapting to the canonical shape
  assertPdfWithinPolicy({ mimeType, size } as Pick<Document, "mimeType" | "size">, maxBytes);
};
