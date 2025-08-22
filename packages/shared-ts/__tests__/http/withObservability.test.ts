/**
 * @file withObservability.test.ts
 * @summary Unit tests for withObservability with full line and branch coverage.
 */

import { withObservability, type ObservabilityFactories } from "../../src/http/withObservability";
import type { LoggerLike, MetricsLike, TracerLike } from "../../src/app/AppContext";

type HttpEvent = {
  headers?: Record<string, string>;
  requestContext?: { http?: { method?: string; path?: string } };
  ctx?: unknown;
};

describe("withObservability", () => {
  const mkLogger = (): LoggerLike => {
    const api: LoggerLike = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      // Return another logger-like object
      // (shape is sufficient for structural typing)
      child: jest.fn(() => mkLogger()),
    };
    return api;
  };

  const mkMetrics = (): MetricsLike =>
    ({
      counter: jest.fn(),
      histogram: jest.fn(),
    } as unknown as MetricsLike);

  const mkTracer = (): TracerLike =>
    ({
      startSpan: jest.fn(),
      withSpan: jest.fn(),
    } as unknown as TracerLike);

  const makeObs = () => {
    const loggerInst = mkLogger();
    const metricsInst = mkMetrics();
    const tracerInst = mkTracer();

    const fns: ObservabilityFactories = {
      logger: jest.fn(() => loggerInst),
      metrics: jest.fn(() => metricsInst),
      tracer: jest.fn(() => tracerInst),
    };

    return { fns, instances: { loggerInst, metricsInst, tracerInst } };
  };

  const makeEvent = (overrides: Partial<HttpEvent> = {}): HttpEvent => ({
    headers: {},
    requestContext: { http: { method: "GET", path: "/ping" } },
    ...overrides,
  });

  const saveENV = process.env.ENV;

  afterEach(() => {
    jest.restoreAllMocks();
    if (saveENV === undefined) {
      delete (process.env as any).ENV;
    } else {
      process.env.ENV = saveENV;
    }
  });

  it("binds observability and prefers lowercase request/trace IDs", () => {
    delete (process.env as any).ENV;
    const { fns, instances } = makeObs();
    const before = withObservability(fns);

    const evt = makeEvent({
      headers: {
        "x-request-id": "req-123",
        "x-trace-id": "trace-abc",
        "X-Request-Id": "UP-REQ",
        "X-Trace-Id": "UP-TRACE",
      },
    });

    const ret = before(evt as any);
    expect(ret).toBeUndefined();

    expect(fns.logger).toHaveBeenCalledTimes(1);
    expect(fns.metrics).toHaveBeenCalledTimes(1);
    expect(fns.tracer).toHaveBeenCalledTimes(1);

    expect(fns.logger).toHaveBeenCalledWith({
      requestId: "req-123",
      traceId: "trace-abc",
      route: "/ping",
      method: "GET",
    });

    const ctx = (evt as any).ctx;
    expect(ctx).toBeDefined();
    expect(ctx.env).toBe("dev");
    expect(ctx.requestId).toBe("req-123");
    expect(ctx.logger).toBe(instances.loggerInst);
    expect(ctx.metrics).toBe(instances.metricsInst);
    expect(ctx.tracer).toBe(instances.tracerInst);
    expect(ctx.bag).toEqual({});
  });

  it("falls back to uppercase headers and uses provided ENV", () => {
    process.env.ENV = "staging";
    const { fns, instances } = makeObs();
    const before = withObservability(fns);

    const evt = makeEvent({
      headers: { "X-Request-Id": "REQ-UP", "X-Trace-Id": "TRACE-UP" },
    });

    before(evt as any);

    expect(fns.logger).toHaveBeenCalledWith({
      requestId: "REQ-UP",
      traceId: "TRACE-UP",
      route: "/ping",
      method: "GET",
    });

    const ctx = (evt as any).ctx;
    expect(ctx.env).toBe("staging");
    expect(ctx.requestId).toBe("REQ-UP");
    expect(ctx.logger).toBe(instances.loggerInst);
    expect(ctx.metrics).toBe(instances.metricsInst);
    expect(ctx.tracer).toBe(instances.tracerInst);
  });

  it("handles missing IDs and requestContext", () => {
    const { fns } = makeObs();
    const before = withObservability(fns);

    const evt = makeEvent({
      headers: undefined,
      requestContext: undefined,
    });

    before(evt as any);

    expect(fns.logger).toHaveBeenCalledWith({
      requestId: undefined,
      traceId: undefined,
      route: undefined,
      method: undefined,
    });

    const ctx = (evt as any).ctx;
    expect(ctx.requestId).toBeUndefined();
    expect(typeof ctx.logger?.info).toBe("function");
    expect(typeof ctx.metrics?.counter).toBe("function");
    expect(typeof ctx.tracer?.startSpan).toBe("function");
  });
});
