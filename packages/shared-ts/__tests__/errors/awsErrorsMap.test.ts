/**
 * @file mapAwsError.test.ts
 * @summary Unit tests for mapAwsError with 100% line & branch coverage.
 */

jest.mock("../../src/aws/errors.js", () => ({
  extractAwsError: jest.fn(() => ({ name: undefined, code: undefined })),
  isAwsAccessDenied: jest.fn(() => false),
  isAwsRetryable: jest.fn(() => false),
  isAwsServiceUnavailable: jest.fn(() => false),
  isAwsThrottling: jest.fn(() => false),
}));

import { mapAwsError, ErrorCodes } from "../../src/errors";
import * as AwsErr from "../../src/aws/errors.js";

const ctx = "Repo.method";

describe("mapAwsError", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("maps throttling to TooManyRequestsError", () => {
    (AwsErr.isAwsThrottling as jest.Mock).mockReturnValue(true);

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(AwsErr.isAwsThrottling).toHaveBeenCalled();
    expect(err.code).toBe(ErrorCodes.COMMON_TOO_MANY_REQUESTS);
    expect(String(err.message)).toContain(`${ctx}: throttled`);
  });

  it("maps generic retryable to TooManyRequestsError", () => {
    (AwsErr.isAwsRetryable as jest.Mock).mockReturnValue(true);

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(AwsErr.isAwsRetryable).toHaveBeenCalled();
    expect(err.code).toBe(ErrorCodes.COMMON_TOO_MANY_REQUESTS);
    expect(String(err.message)).toContain(`${ctx}: throttled`);
  });

  it("maps access denied to ForbiddenError", () => {
    (AwsErr.isAwsAccessDenied as jest.Mock).mockReturnValue(true);

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(AwsErr.isAwsAccessDenied).toHaveBeenCalled();
    expect(err.code).toBe(ErrorCodes.AUTH_FORBIDDEN);
    expect(String(err.message)).toContain(`${ctx}: access denied`);
  });

  it("maps service unavailable to ServiceUnavailableError", () => {
    (AwsErr.isAwsServiceUnavailable as jest.Mock).mockReturnValue(true);

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(AwsErr.isAwsServiceUnavailable).toHaveBeenCalled();
    expect(err.code).toBe(ErrorCodes.COMMON_DEPENDENCY_UNAVAILABLE);
    expect(String(err.message)).toContain(`${ctx}: service unavailable`);
  });

  it("maps known names to specific errors via lookup (conflict, not found, bad request)", () => {
    // Conflict
    (AwsErr.extractAwsError as jest.Mock).mockReturnValueOnce({
      name: "ConditionalCheckFailedException",
      code: undefined,
    });
    let err = mapAwsError(new Error("x"), ctx) as any;
    expect(err.code).toBe(ErrorCodes.COMMON_CONFLICT);
    expect(String(err.message)).toContain(`${ctx}: conflict`);

    // Not found (alternate name)
    (AwsErr.extractAwsError as jest.Mock).mockReturnValueOnce({
      name: "NoSuchKey",
      code: undefined,
    });
    err = mapAwsError(new Error("x"), ctx) as any;
    expect(err.code).toBe(ErrorCodes.COMMON_NOT_FOUND);
    expect(String(err.message)).toContain(`${ctx}: not found`);

    // Bad request (alternate name)
    (AwsErr.extractAwsError as jest.Mock).mockReturnValueOnce({
      name: "InvalidParameterException",
      code: undefined,
    });
    err = mapAwsError(new Error("x"), ctx) as any;
    expect(err.code).toBe(ErrorCodes.COMMON_BAD_REQUEST);
    expect(String(err.message)).toContain(`${ctx}: bad request`);
  });

  it("falls back to InternalError when nothing matches", () => {
    (AwsErr.extractAwsError as jest.Mock).mockReturnValue({
      name: undefined,
      code: undefined,
    });

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(err.code).toBe(ErrorCodes.COMMON_INTERNAL_ERROR);
    expect(String(err.message)).toContain(`${ctx}: internal error`);
  });

  it("uses error.code when name is undefined in lookup", () => {
    (AwsErr.extractAwsError as jest.Mock).mockReturnValue({
      name: undefined,
      code: "ResourceNotFoundException",
    });

    const err = mapAwsError(new Error("x"), ctx) as any;

    expect(err.code).toBe(ErrorCodes.COMMON_NOT_FOUND);
    expect(String(err.message)).toContain(`${ctx}: not found`);
  });
});
