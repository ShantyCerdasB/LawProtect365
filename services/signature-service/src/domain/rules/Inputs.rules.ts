
import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import type { Input } from "../entities";
import { InputTypeSchema } from "../value-objects/InputType";
import { RectSchema } from "../value-objects/Geometry";

/**
 * Validates that each input references valid document and party IDs if applicable.
 *
 * @param inputs - Inputs to validate.
 * @param documentIds - Set of valid document IDs.
 * @param partyIds - Set of valid party IDs.
 * @throws {AppError} 400 when an input references an unknown documentId or partyId.
 */
export const assertInputReferences = (
  inputs: readonly Input[],
  documentIds: ReadonlySet<string>,
  partyIds: ReadonlySet<string>
): void => {
  for (const i of inputs) {
    InputTypeSchema.parse(i.type);
    if (!documentIds.has(i.documentId)) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Invalid documentId in input ${i.inputId}`
      );
    }
    if (i.partyId && !partyIds.has(i.partyId)) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Invalid partyId in input ${i.inputId}`
      );
    }
  }
};

/**
 * Validates that input positions lie within the given page bounds.
 *
 * @param inputs - Inputs to validate.
 * @param pageSize - Page dimensions (width and height).
 * @throws {AppError} 400 when an input lies outside the page bounds.
 */
export const assertInputGeometry = (
  inputs: readonly Input[],
  pageSize: { width: number; height: number }
): void => {
  for (const i of inputs) {
    const pos = RectSchema.parse(i.position);
    if (
      pos.x + pos.width > pageSize.width ||
      pos.y + pos.height > pageSize.height
    ) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Input ${i.inputId} exceeds page bounds`
      );
    }
  }
};

/**
 * Validates that no two inputs illegally overlap on the same page
 * when strict mode is enabled.
 *
 * @param inputs - Inputs to validate.
 * @param strict - Whether overlap detection is enforced.
 * @throws {AppError} 409 when two inputs overlap under strict mode.
 */
export const assertNoIllegalOverlap = (
  inputs: readonly Input[],
  strict = false
): void => {
  if (!strict) return;

  const rects = inputs.map((i) => ({
    id: i.inputId,
    r: RectSchema.parse(i.position),
  }));

  for (let a = 0; a < rects.length; a++) {
    for (let b = a + 1; b < rects.length; b++) {
      const A = rects[a].r;
      const B = rects[b].r;
      const overlap =
        A.page === B.page &&
        A.x < B.x + B.width &&
        A.x + A.width > B.x &&
        A.y < B.y + B.height &&
        A.y + A.height > B.y;

      if (overlap) {
        throw new AppError(
          ErrorCodes.COMMON_CONFLICT,
          409,
          `Inputs ${rects[a].id} and ${rects[b].id} overlap`
        );
      }
    }
  }
};
