/**
 * @file withRequestContext.test.ts
 * @summary Unit tests for withRequestContext achieving 100% line and branch coverage.
 */

jest.mock("ulid", () => ({ ulid: jest.fn() }));

import { withRequestContext } from "../../src/http/withRequestContext";
import { ulid as ulidFn } from "ulid";

type HttpEvent = {
  headers?: Record<string, string>;
  requestContext: { requestId?: string };
};

const ulidMock = ulidFn as unknown as jest.Mock;

describe("withRequestContext", () => {
  const makeEvent = (overrides: Partial<HttpEvent> = {}): HttpEvent => ({
    headers: {},
    requestContext: {},
    ...overrides,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Prefers lowercase header variants when both lowercase and uppercase are present.
   * No IDs are generated when both values are already provided.
   */
  it("uses existing lowercase headers and does not generate IDs", () => {
    const before = withRequestContext();

    const evt = makeEvent({
      headers: {
        "x-request-id": "low-req",
        "X-Request-Id": "UP-REQ",
        "x-trace-id": "low-trace",
        "X-Trace-Id": "UP-TRACE",
      },
      requestContext: { requestId: "ctx-req" },
    });

    const ret = before(evt as any);
    expect(ret).toBeUndefined();
    expect(ulidMock).not.toHaveBeenCalled();

    expect(evt.headers!["x-request-id"]).toBe("low-req");
    expect(evt.headers!["x-trace-id"]).toBe("low-trace");
  });

  /**
   * Falls back to uppercase header variants when lowercase are missing,
   * and normalizes them into lowercase canonical keys.
   */
  it("uses uppercase headers when lowercase are missing and normalizes to lowercase keys", () => {
    const before = withRequestContext();

    const evt = makeEvent({
      headers: {
        "X-Request-Id": "UP-REQ",
        "X-Trace-Id": "UP-TRACE",
      },
    });

    before(evt as any);

    // No generation needed
    expect(ulidMock).not.toHaveBeenCalled();

    // Canonical lowercase headers are set to the uppercase values
    expect(evt.headers!["x-request-id"]).toBe("UP-REQ");
    expect(evt.headers!["x-trace-id"]).toBe("UP-TRACE");

    // Original uppercase headers remain present (function does not delete them)
    expect(evt.headers!["X-Request-Id"]).toBe("UP-REQ");
    expect(evt.headers!["X-Trace-Id"]).toBe("UP-TRACE");
  });

  /**
   * Uses requestContext.requestId when header is missing and generates a trace ID.
   */
  it("uses requestContext.requestId and generates only the trace ID", () => {
    const before = withRequestContext();
    ulidMock.mockReturnValue("TRACE-GEN"); // only trace should be generated

    const evt = makeEvent({
      headers: {}, // no IDs provided
      requestContext: { requestId: "CTX-REQ" },
    });

    before(evt as any);

    expect(ulidMock).toHaveBeenCalledTimes(1);
    expect(evt.headers!["x-request-id"]).toBe("CTX-REQ");
    expect(evt.headers!["x-trace-id"]).toBe("TRACE-GEN");
  });

  /**
   * Generates both request and trace IDs when none are provided anywhere.
   * Also verifies headers object is created when initially undefined.
   */
  it("generates both IDs when absent in headers and requestContext", () => {
    const before = withRequestContext();
    ulidMock.mockReturnValueOnce("RID-1").mockReturnValueOnce("TID-1");

    const evt = makeEvent({
      headers: undefined, // triggers (evt.headers ||= {})
      requestContext: {}, // no requestId provided
    });

    before(evt as any);

    expect(ulidMock).toHaveBeenCalledTimes(2);
    expect(evt.headers!["x-request-id"]).toBe("RID-1");
    expect(evt.headers!["x-trace-id"]).toBe("TID-1");
  });
});
