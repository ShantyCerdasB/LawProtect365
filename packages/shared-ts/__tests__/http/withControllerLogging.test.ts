/**
 * @file withControllerLogging.test.ts
 * @summary Unit tests for withControllerLogging achieving full line and branch coverage.
 */

import { withControllerLogging } from "../../src/http/withControllerLogging";

type HttpEvent = {
  headers?: Record<string, string>;
  requestContext?: { http?: { method?: string; path?: string } };
  ctx?: { logger?: { info: jest.Mock } };
};

describe("withControllerLogging", () => {
  const makeEvent = (overrides: Partial<HttpEvent> = {}): HttpEvent => ({
    headers: { "x-request-id": "req-123" },
    requestContext: { http: { method: "GET", path: "/ping" } },
    ctx: { logger: { info: jest.fn() } },
    ...overrides,
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Logs start/finish and infers status 200 for string responses without mutating them.
   */
  it("logs start/finish and infers status=200 for string responses", () => {
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_000) // before()
      .mockReturnValueOnce(1_250); // after() => 250ms

    const { before, after } = withControllerLogging();
    const evt = makeEvent();

    before(evt as any);
    const out = after(evt as any, "OK" as any);

    expect(nowSpy).toHaveBeenCalledTimes(2);

    expect(evt.ctx!.logger!.info).toHaveBeenNthCalledWith(
      1,
      "http:start",
      expect.objectContaining({ method: "GET", path: "/ping" })
    );

    expect(evt.ctx!.logger!.info).toHaveBeenNthCalledWith(
      2,
      "http:finish",
      expect.objectContaining({ status: 200, ms: 250 })
    );

    expect(out).toBe("OK");
  });

  /**
   * Uses provided statusCode and injects x-request-id, preserving existing headers.
   */
  it("logs provided statusCode and injects x-request-id while preserving headers", () => {
    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(5_000) // before()
      .mockReturnValueOnce(5_600); // after() => 600ms

    const { before, after } = withControllerLogging();
    const evt = makeEvent();

    const res = { statusCode: 204, headers: { "x-pre": "1" }, body: "no content" } as any;

    before(evt as any);
    const out = after(evt as any, res);

    expect(evt.ctx!.logger!.info).toHaveBeenLastCalledWith(
      "http:finish",
      expect.objectContaining({ status: 204, ms: 600 })
    );

    expect(out).toBe(res);
    expect(res.headers).toEqual({ "x-pre": "1", "x-request-id": "req-123" });
  });

  /**
   * Defaults status to 200 and sets empty x-request-id when the header is missing.
   */
  it("defaults status to 200 and sets empty x-request-id when header is missing", () => {
    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(10_000) // before()
      .mockReturnValueOnce(10_500); // after() => 500ms

    const { before, after } = withControllerLogging();
    const evt = makeEvent({ headers: {} }); // no x-request-id

    const res = { body: "ok" } as any; // no statusCode, no headers

    before(evt as any);
    after(evt as any, res);

    expect(evt.ctx!.logger!.info).toHaveBeenLastCalledWith(
      "http:finish",
      expect.objectContaining({ status: 200, ms: 500 })
    );

    expect(res.headers).toEqual({ "x-request-id": "" });
  });

  /**
   * Works without a logger and still injects x-request-id when the request has no id header.
   */
  it("does not throw when logger is absent and still injects headers", () => {
    jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(20_000) // before()
      .mockReturnValueOnce(20_123); // after()

    const { before, after } = withControllerLogging();
    const evt = makeEvent({ ctx: undefined, headers: {} }); // ensure no request id header

    const res = { statusCode: 201 } as any;

    expect(() => before(evt as any)).not.toThrow();
    after(evt as any, res);

    expect(res.headers).toEqual({ "x-request-id": "" });
  });
});
