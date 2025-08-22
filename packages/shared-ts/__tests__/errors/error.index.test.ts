/**
 * @file errors.index.test.ts
 * @summary Verifies that the errors index re-exports the public API.
 */

import * as errorsIndex from "../../src/errors";
import {
    ErrorCodes,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  InternalError,
  ServiceUnavailableError,
  TooManyRequestsError,
  mapError,
  mapAwsError,
} from "../../src/errors";


describe("errors index re-exports", () => {
  it("re-exports error codes", () => {
    expect((errorsIndex as any).ErrorCodes).toBe(ErrorCodes);
  });

  it("re-exports error classes", () => {
    const E = errorsIndex as any;

    // Instances created via the index should be instances of the direct classes
    expect(new E.BadRequestError("m", ErrorCodes.COMMON_BAD_REQUEST)).toBeInstanceOf(BadRequestError);
    expect(new E.NotFoundError("m", ErrorCodes.COMMON_NOT_FOUND)).toBeInstanceOf(NotFoundError);
    expect(new E.ConflictError("m", ErrorCodes.COMMON_CONFLICT)).toBeInstanceOf(ConflictError);
    expect(new E.ForbiddenError("m", ErrorCodes.AUTH_FORBIDDEN)).toBeInstanceOf(ForbiddenError);
    expect(new E.InternalError("m", ErrorCodes.COMMON_INTERNAL_ERROR)).toBeInstanceOf(InternalError);
    expect(new E.ServiceUnavailableError("m", ErrorCodes.COMMON_DEPENDENCY_UNAVAILABLE)).toBeInstanceOf(
      ServiceUnavailableError
    );
    expect(new E.TooManyRequestsError("m", ErrorCodes.COMMON_TOO_MANY_REQUESTS)).toBeInstanceOf(
      TooManyRequestsError
    );
  });

  it("re-exports helper functions", () => {
    expect((errorsIndex as any).mapError).toBe(mapError);
    expect((errorsIndex as any).mapAwsError).toBe(mapAwsError);
  });

  it("does not define a default export", () => {
    expect((errorsIndex as any).default).toBeUndefined();
  });
});
